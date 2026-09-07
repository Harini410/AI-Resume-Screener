import { z } from "zod"

export interface ModelProviderConfig {
  timeoutMs?: number
  maxRetries?: number
  model?: string
  temperature?: number
}

const DEFAULT_TIMEOUT_MS = 30000
const DEFAULT_MAX_RETRIES = 2

export class ModelTimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ModelTimeoutError"
  }
}

export class ModelAPIError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ModelAPIError"
  }
}

export class ModelRateLimitError extends Error {
  public retryAfterMs: number
  constructor(message: string, retryAfterMs: number) {
    super(message)
    this.name = "ModelRateLimitError"
    this.retryAfterMs = retryAfterMs
  }
}

export class SchemaValidationError extends Error {
  public errors: z.ZodIssue[]
  constructor(message: string, errors: z.ZodIssue[]) {
    super(message)
    this.name = "SchemaValidationError"
    this.errors = errors
  }
}

/**
 * Returns the configured Groq model.
 * Prioritizes process.env.GROQ_MODEL, defaulting to 'openai/gpt-oss-120b'.
 */
export function getActiveModelName(overrideModel?: string): string {
  if (overrideModel) return overrideModel
  return process.env.GROQ_MODEL || "openai/gpt-oss-120b"
}

/**
 * Generate structured analysis using Groq with multi-stage schema repair and retries.
 */
export async function generateStructuredAnalysis<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodSchema<T>,
  config: ModelProviderConfig = {},
): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxRetries = DEFAULT_MAX_RETRIES,
    model = getActiveModelName(config.model),
    temperature = 0.1,
  } = config

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new ModelAPIError(
      "GROQ_API_KEY is not set. Add it to .env.local (server-side only, never exposed to client)."
    )
  }

  let lastError: unknown
  let currentPrompt = userPrompt

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const raw = await callGroq(
        systemPrompt,
        currentPrompt,
        apiKey,
        model,
        temperature,
        timeoutMs
      )

      const parsedJson = extractJson(raw)
      const parseResult = schema.safeParse(parsedJson)

      if (parseResult.success) {
        return parseResult.data
      }

      // Schema validation failed - build targeted repair prompt with validation issues
      const formattedErrors = parseResult.error.issues
        .map((issue) => `• At '${issue.path.join(".")}': ${issue.message}`)
        .join("\n")

      console.warn(
        `[model-provider] Schema validation failed on attempt ${attempt + 1}/${maxRetries + 1}:\n${formattedErrors}`
      )

      lastError = new SchemaValidationError(
        `Output failed schema validation:\n${formattedErrors}`,
        parseResult.error.issues
      )

      // Prepare feedback for the next retry
      currentPrompt = buildRepairPrompt(
        userPrompt,
        raw,
        formattedErrors
      )
    } catch (error) {
      lastError = error
      console.error(
        `[model-provider] Attempt ${attempt + 1}/${maxRetries + 1} failed:`,
        error instanceof Error ? error.message : error
      )

      if (error instanceof ModelRateLimitError) {
        if (attempt < maxRetries && error.retryAfterMs <= 3000) {
          console.warn(`[model-provider] Rate limited (429). Short backoff (${error.retryAfterMs}ms) before retry...`)
          await new Promise((resolve) => setTimeout(resolve, error.retryAfterMs))
          continue
        } else {
          // Long rate limit or max retries reached - throw immediately so pipeline can fall back without timing out
          throw error
        }
      }

      if (error instanceof ModelTimeoutError && attempt === maxRetries) {
        throw error
      }

      if (attempt < maxRetries) {
        // Small backoff before next attempt
        await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt)))
      }

      currentPrompt = `${userPrompt}\n\nIMPORTANT: The previous attempt encountered an error: ${
        error instanceof Error ? error.message : String(error)
      }. Please output ONLY a valid JSON object matching the required schema.`
    }
  }

  throw new ModelAPIError(
    `Model call failed after ${maxRetries + 1} attempt(s): ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  )
}

async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  model: string,
  temperature: number,
  timeoutMs: number
): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      if (response.status === 429) {
        let waitMs = 2500
        const retryHeader = response.headers.get("retry-after")
        if (retryHeader) {
          const parsed = parseFloat(retryHeader)
          if (!isNaN(parsed) && parsed > 0) waitMs = Math.ceil(parsed * 1000)
        } else {
          const match = body.match(/try again in ([0-9.]+)s/i)
          if (match) {
            const parsed = parseFloat(match[1])
            if (!isNaN(parsed) && parsed > 0) waitMs = Math.ceil(parsed * 1000) + 200
          }
        }
        throw new ModelRateLimitError(`Groq API error 429: ${body.slice(0, 300)}`, waitMs)
      }
      throw new ModelAPIError(`Groq API error ${response.status}: ${body.slice(0, 300)}`)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== "string") {
      throw new ModelAPIError("Groq response missing message content")
    }
    return content
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ModelTimeoutError(`Model call timed out after ${timeoutMs}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Extracts and parses JSON from raw LLM output, handling markdown codeblocks,
 * pre/post commentary, and trailing commas.
 */
export function extractJson(raw: string): unknown {
  const trimmed = raw.trim()

  // 1. Direct parse attempt
  try {
    return JSON.parse(trimmed)
  } catch {
    // Continue to repair attempts
  }

  // 2. Strip markdown code fence (```json ... ``` or ``` ... ```)
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim())
    } catch {
      // Continue to regex extractor
    }
  }

  // 3. Extract outermost balanced or delimited JSON object/array
  const jsonMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
  if (jsonMatch) {
    let candidate = jsonMatch[0]
    try {
      return JSON.parse(candidate)
    } catch {
      // 4. Try stripping trailing commas before } or ]
      const cleaned = candidate
        .replace(/,\s*([\}\]])/g, "$1")
        .replace(/[\u0000-\u001F]+/g, " ")
      try {
        return JSON.parse(cleaned)
      } catch {
        // Fall through to error
      }
    }
  }

  throw new ModelAPIError("Model did not return valid JSON: " + trimmed.slice(0, 150))
}

/**
 * Builds a precise schema repair prompt showing the previous response and the exact validation failures.
 */
function buildRepairPrompt(originalPrompt: string, rawResponse: string, validationErrors: string): string {
  return `${originalPrompt}

---
CRITICAL CORRECTION REQUIRED:
Your previous response failed schema validation with these errors:
${validationErrors}

Your previous output was:
${rawResponse.slice(0, 500)}

Please correct these errors immediately. Output a valid, complete JSON object matching the exact schema. Ensure all required fields are present and non-empty as specified.`
}

