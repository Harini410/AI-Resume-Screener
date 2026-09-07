import { z } from "zod"
import { generateStructuredAnalysis } from "../model-provider"
import {
  EvaluationStatusSchema,
  ConfidenceLevelSchema,
  RawAgentEvaluationSchema,
  type RawAgentEvaluation,
  type RetrievalEvidenceItem,
  type RetrievalResult,
  type StructuredRequirement,
  type RequirementVerdict,
} from "../schemas"

export const BatchEvaluationItemSchema = z.object({
  requirementId: z.string(),
  status: EvaluationStatusSchema,
  explanation: z.string().min(1),
  confidence: ConfidenceLevelSchema,
  citedQuotes: z.array(z.string()).default([]),
})

export const BatchAgentEvaluationSchema = z.object({
  evaluations: z.array(BatchEvaluationItemSchema),
})

export type BatchAgentEvaluation = z.infer<typeof BatchAgentEvaluationSchema>

/**
 * AGENT 3 & 4: Evidence Evaluation & Gap Analysis Agent
 * Responsibility: Evaluate candidate match for an atomic requirement strictly
 * based on retrieved resume evidence chunks.
 * 
 * Rules:
 * - matched: Strong, explicit, unambiguous evidence in retrieved text.
 * - partial: Some relevant evidence, but does not meet full scope or years.
 * - gap: Evidence explicitly contradicts requirement or candidate's own summary shows absence.
 * - insufficient_evidence: Retrieved text does not have enough context to decide.
 * 
 * CRITICAL GROUNDING RULE: "Not found in evidence" is NOT "gap". It is "insufficient_evidence".
 */
export async function evaluateRequirement(
  requirement: string,
  evidence: RetrievalEvidenceItem[]
): Promise<RawAgentEvaluation> {
  // If no evidence was retrieved above the similarity threshold:
  if (!evidence || evidence.length === 0) {
    return {
      status: "insufficient_evidence",
      explanation: "No relevant evidence chunks were retrieved from the resume for this requirement.",
      confidence: "low",
      citedQuotes: [],
    }
  }

  const system = `You are a Senior Technical Resume Auditor and Grounded Gap Analyst.
Your task is to evaluate whether a candidate satisfies a specific job requirement based SOLELY on the provided retrieved resume evidence chunks.

STATUS CRITERIA:
- "matched": The candidate explicitly and convincingly satisfies the requirement based on the retrieved text.
- "partial": The candidate possesses some relevant skills or related experience, but falls short of full depth, scope, or stated years.
- "gap": The retrieved resume text explicitly indicates the candidate does not meet the requirement (e.g., conflicting experience or stated limitations).
- "insufficient_evidence": The retrieved chunks do not contain enough information to determine whether the candidate satisfies the requirement.

CRITICAL GROUNDING RULES:
1. NEVER invent candidate achievements, technologies, or years of experience.
2. If the retrieved text simply does not mention the skill, assign status "insufficient_evidence", NEVER "gap".
3. Every cited quote MUST be copied VERBATIM from the provided evidence chunks. Do not paraphrase in citedQuotes.
4. Output strictly valid JSON conforming to the schema.`

  const evidenceFormatted = evidence
    .map((e, i) => `[Chunk ${i + 1} | Section: ${e.section} | SimScore: ${e.score}]\n"${e.text}"`)
    .join("\n\n")

  const user = `Requirement: "${requirement}"

Retrieved Resume Evidence:
${evidenceFormatted}

Evaluate this requirement. Return JSON in this exact schema:
{
  "status": "matched" | "partial" | "gap" | "insufficient_evidence",
  "explanation": "Detailed grounded explanation citing specific observations",
  "confidence": "low" | "medium" | "high",
  "citedQuotes": ["verbatim quote from evidence"]
}`

  try {
    return await generateStructuredAnalysis(
      system,
      user,
      RawAgentEvaluationSchema,
      { timeoutMs: 25000, maxRetries: 1 }
    )
  } catch (error) {
    console.warn(`[Gap Agent] Model evaluation failed for "${requirement}", applying heuristic grounding:`, error)
    return evaluateRequirementHeuristic(requirement, evidence)
  }
}

/**
 * High-performance batch requirement evaluation across the entire job description.
 * Evaluates all criteria in a single unified prompt to minimize token usage and latency.
 */
export async function evaluateRequirementsBatch(
  retrievalResults: RetrievalResult[],
  requirements: StructuredRequirement[]
): Promise<RequirementVerdict[]> {
  if (!retrievalResults || retrievalResults.length === 0) {
    return []
  }

  const system = `You are a Senior Technical Resume Auditor and Grounded Gap Analyst.
Your task is to evaluate whether a candidate satisfies each job requirement based SOLELY on the provided retrieved resume evidence chunks for that requirement.

STATUS CRITERIA:
- "matched": The candidate explicitly and convincingly satisfies the requirement based on the retrieved text.
- "partial": The candidate possesses some relevant skills or related experience, but falls short of full depth, scope, or stated years.
- "gap": The retrieved resume text explicitly indicates the candidate does not meet the requirement (e.g., candidate states lack of experience or conflicting background).
- "insufficient_evidence": The retrieved chunks do not contain enough information to determine whether the candidate satisfies the requirement.

CRITICAL GROUNDING RULES:
1. NEVER invent candidate achievements, technologies, or years of experience.
2. If the retrieved text simply does not mention the skill, assign status "insufficient_evidence", NEVER "gap".
3. Every cited quote MUST be copied VERBATIM from the provided evidence chunks. Do not paraphrase in citedQuotes.
4. Output strictly valid JSON conforming to the schema.`

  const user = `Evaluate the candidate against the following requirements based strictly on the retrieved resume evidence:

${retrievalResults
  .map((r, i) => {
    const evidenceText =
      r.evidence.length > 0
        ? r.evidence
            .map((e, j) => `[Chunk ${j + 1} | Section: ${e.section} | SimScore: ${e.score}]\n"${e.text}"`)
            .join("\n")
        : "(No relevant evidence chunks retrieved above similarity threshold)"
    return `### Requirement ${i + 1} (ID: ${r.requirementId})
Statement: "${r.requirement}"
Evidence:
${evidenceText}`
  })
  .join("\n\n")}

Return JSON in this exact structure:
{
  "evaluations": [
    {
      "requirementId": "req-id",
      "status": "matched" | "partial" | "gap" | "insufficient_evidence",
      "explanation": "Detailed grounded explanation",
      "confidence": "low" | "medium" | "high",
      "citedQuotes": ["verbatim quote from evidence"]
    }
  ]
}`

  try {
    const batchResult = await generateStructuredAnalysis(
      system,
      user,
      BatchAgentEvaluationSchema,
      { timeoutMs: 15000, maxRetries: 0 }
    )

    const evalMap = new Map(batchResult.evaluations.map((e) => [e.requirementId, e]))

    return retrievalResults.map((res) => {
      const evalItem =
        evalMap.get(res.requirementId) ||
        evaluateRequirementHeuristic(res.requirement, res.evidence)

      const matchingReq = requirements.find((r) => r.id === res.requirementId)

      const matchedEvidence = (evalItem.citedQuotes || []).map((quote) => {
        const normalizedQuote = quote.toLowerCase().replace(/[^a-z0-9]/g, "")
        const matchingChunk = res.evidence.find((e) =>
          e.text.toLowerCase().replace(/[^a-z0-9]/g, "").includes(normalizedQuote.slice(0, 30))
        )

        return {
          chunkId: matchingChunk?.chunkId || res.evidence[0]?.chunkId || "chunk-0",
          section: matchingChunk?.section || res.evidence[0]?.section || "general",
          quote,
          score: matchingChunk?.score || res.evidence[0]?.score || 0.5,
        }
      })

      return {
        requirementId: res.requirementId,
        requirement: res.requirement,
        category: matchingReq?.category || "skill",
        importance: res.importance || "required",
        status: evalItem.status,
        evidence: matchedEvidence,
        explanation: evalItem.explanation,
        confidence: evalItem.confidence,
      }
    })
  } catch (error) {
    console.warn("[Gap Agent] Batch model evaluation failed, applying heuristic grounding:", error)
    return retrievalResults.map((res) => {
      const heuristic = evaluateRequirementHeuristic(res.requirement, res.evidence)
      const matchingReq = requirements.find((r) => r.id === res.requirementId)

      const matchedEvidence = (heuristic.citedQuotes || []).map((quote) => {
        const normalizedQuote = quote.toLowerCase().replace(/[^a-z0-9]/g, "")
        const matchingChunk = res.evidence.find((e) =>
          e.text.toLowerCase().replace(/[^a-z0-9]/g, "").includes(normalizedQuote.slice(0, 30))
        )

        return {
          chunkId: matchingChunk?.chunkId || res.evidence[0]?.chunkId || "chunk-0",
          section: matchingChunk?.section || res.evidence[0]?.section || "general",
          quote,
          score: matchingChunk?.score || res.evidence[0]?.score || 0.5,
        }
      })

      return {
        requirementId: res.requirementId,
        requirement: res.requirement,
        category: matchingReq?.category || "skill",
        importance: res.importance || "required",
        status: heuristic.status,
        evidence: matchedEvidence,
        explanation: heuristic.explanation,
        confidence: heuristic.confidence,
      }
    })
  }
}

const STOP_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "to", "for", "of", "with", "by", "as", "and", "or", "such",
  "including", "into", "from", "across", "about", "must", "have", "has", "having", "should", "would",
  "could", "can", "will", "is", "are", "was", "were", "be", "been", "being", "do", "does", "did",
  "done", "strong", "hands", "experience", "experienced", "background", "understanding", "knowledge",
  "proficient", "proficiency", "working", "ability", "skills", "skill", "years", "year", "plus",
  "demonstrated", "proven", "excellent", "deep", "solid", "good", "familiarity", "expert", "expertise",
  "specialized", "track", "record", "role", "job", "position", "team", "candidate", "required",
  "preferred", "nice", "bonus", "production", "environment", "environments", "building", "designing",
  "managing", "maintaining", "using", "needed", "seeking", "across", "related", "field", "modern"
])

const TECH_ACRONYMS = new Set([
  "ci", "cd", "go", "ai", "ml", "ui", "ux", "db", "os", "qa", "pr", "k8s", "aws", "gcp", "sql", "git", "iac"
])

/**
 * Deterministic heuristic fallback when LLM inference is unreachable.
 * Evaluates token overlap, technical keywords, and explicit mentions in retrieved chunks.
 */
export function evaluateRequirementHeuristic(
  requirement: string,
  evidence: RetrievalEvidenceItem[]
): RawAgentEvaluation {
  if (!evidence || evidence.length === 0) {
    return {
      status: "insufficient_evidence",
      explanation: "No relevant evidence chunks were retrieved from the resume for this requirement.",
      confidence: "low",
      citedQuotes: [],
    }
  }

  const reqLower = requirement.toLowerCase()

  // 1. Check for explicit contradiction / negation in resume
  for (const item of evidence) {
    const textLower = item.text.toLowerCase()
    const negationMatch = textLower.match(
      /\b(no|never|without|zero)\b[^.\n]*\b(software engineering|coding|swift|programming|experience|responsibilities?)\b/i
    )
    if (negationMatch) {
      const fullSentence = extractSentenceContaining(item.text, negationMatch[0])
      return {
        status: "gap",
        explanation: `Resume explicitly indicates absence or negation of required experience: "${fullSentence}".`,
        confidence: "high",
        citedQuotes: fullSentence ? [fullSentence] : [],
      }
    }
  }

  // 2. Extract meaningful technical keywords from the requirement
  const rawTokens = reqLower
    .replace(/[^a-z0-9+#./\s-]/g, " ")
    .split(/[\s,]+/)
    .map((t) => t.replace(/^[./-]+|[./-]+$/g, ""))
    .filter((t) => t.length > 0)

  const keyTokens = rawTokens.filter((t) => TECH_ACRONYMS.has(t) || (!STOP_WORDS.has(t) && t.length > 2))
  const tokensToMatch = keyTokens.length > 0 ? keyTokens : rawTokens.filter((t) => t.length > 2)

  let bestMatchCount = 0
  let bestChunk: RetrievalEvidenceItem | null = null
  let bestMatchedTokens: string[] = []

  for (const item of evidence) {
    const textLower = item.text.toLowerCase()
    const matched = tokensToMatch.filter((t) => textLower.includes(t))

    if (matched.length > bestMatchCount) {
      bestMatchCount = matched.length
      bestChunk = item
      bestMatchedTokens = matched
    }
  }

  const matchRatio = tokensToMatch.length > 0 ? bestMatchCount / tokensToMatch.length : 0

  // 3. Inspect whether matches appear only in hobby/personal sections for enterprise requirements
  const isHobbySection =
    bestChunk?.section === "hobbies" ||
    bestChunk?.section === "personal interests" ||
    bestChunk?.section === "interests"

  const asksForEnterprise =
    reqLower.includes("production") ||
    reqLower.includes("enterprise") ||
    reqLower.includes("mission-critical") ||
    reqLower.includes("5+") ||
    reqLower.includes("on-call")

  if (isHobbySection && asksForEnterprise && bestChunk) {
    return {
      status: "insufficient_evidence",
      explanation: `Skills mentioned strictly in non-professional personal hobby context (${bestChunk.section}), which does not satisfy enterprise production requirements.`,
      confidence: "low",
      citedQuotes: [],
    }
  }

  let bestQuote = ""
  if (bestChunk && bestMatchedTokens.length > 0) {
    bestQuote = extractBestSentence(bestChunk.text, bestMatchedTokens)
  }

  if (matchRatio >= 0.5 || (tokensToMatch.length <= 2 && bestMatchCount >= 1)) {
    return {
      status: "matched",
      explanation: `Resume evidence in section '${bestChunk?.section || "general"}' confirms alignment with required competencies (${bestMatchedTokens.join(", ")}).`,
      confidence: matchRatio >= 0.75 ? "high" : "medium",
      citedQuotes: bestQuote ? [bestQuote] : [],
    }
  } else if (matchRatio >= 0.25 || bestMatchCount >= 1) {
    return {
      status: "partial",
      explanation: `Resume demonstrates partial coverage of requirement (${bestMatchedTokens.join(", ")}), but lacks full depth or scope.`,
      confidence: "medium",
      citedQuotes: bestQuote ? [bestQuote] : [],
    }
  } else {
    return {
      status: "insufficient_evidence",
      explanation: "Retrieved resume chunks contain insufficient explicit mention to verify this requirement.",
      confidence: "low",
      citedQuotes: [],
    }
  }
}

function extractSentenceContaining(text: string, substring: string): string {
  const sentences = text
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5)

  for (const s of sentences) {
    if (s.toLowerCase().includes(substring.toLowerCase())) {
      return s
    }
  }

  return sentences[0] || text.slice(0, 100)
}

function extractBestSentence(text: string, tokens: string[]): string {
  const sentences = text
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8)

  let bestSent = ""
  let maxMatches = 0

  for (const sent of sentences) {
    const sentLower = sent.toLowerCase()
    let count = 0
    for (const t of tokens) {
      if (sentLower.includes(t)) count++
    }
    if (count > maxMatches) {
      maxMatches = count
      bestSent = sent
    }
  }

  return bestSent || sentences[0] || text.slice(0, 100)
}

