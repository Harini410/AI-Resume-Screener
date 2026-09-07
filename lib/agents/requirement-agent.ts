import { generateStructuredAnalysis } from "../model-provider"
import { StructuredRequirementsSchema, type StructuredRequirement } from "../schemas"

export class InvalidJobDescriptionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InvalidJobDescriptionError"
  }
}

/**
 * AGENT 1: Requirement Extraction Agent
 * Responsibility: Extract atomic, checkable, and grounded requirements from a Job Description.
 */
export async function extractRequirements(jobDescription: string): Promise<StructuredRequirement[]> {
  const trimmedJD = jobDescription ? jobDescription.trim() : ""
  if (trimmedJD.length === 0) {
    throw new InvalidJobDescriptionError("Job description cannot be empty.")
  }

  const system = `You are a Principal Technical Recruiter and Job Requirement Decomposition Agent.
Your sole job is to dissect a Job Description into a list of atomic, verifiable requirements.

STRICT RULES:
1. Every requirement MUST be atomic (a single verifiable capability, credential, or experience).
   - BAD: "5+ years Python, AWS and Docker experience"
   - GOOD 1: "At least 5 years of professional backend software development experience"
   - GOOD 2: "Proficiency in Python programming"
   - GOOD 3: "Hands-on experience deploying and managing cloud infrastructure on AWS"
   - GOOD 4: "Experience containerizing applications using Docker"
2. Categories: "skill" | "experience" | "education" | "other".
3. Importance: "required" (must-haves, essential qualifications) vs "preferred" (bonus, nice-to-have).
4. The output must strictly be a JSON object matching { "requirements": [...] }.
5. The "requirements" array MUST contain at least 1 item. For non-empty JDs, extract the core role expectations.
6. NEVER fabricate requirements. Every requirement must be grounded in the text provided.`

  const user = `Extract all atomic requirements from this Job Description:
"""
${trimmedJD.slice(0, 8000)}
"""

Return JSON in exactly this format:
{
  "requirements": [
    {
      "id": "req-1",
      "requirement": "atomic requirement statement",
      "category": "skill" | "experience" | "education" | "other",
      "importance": "required" | "preferred"
    }
  ]
}`

  try {
    const result = await generateStructuredAnalysis(
      system,
      user,
      StructuredRequirementsSchema,
      { timeoutMs: 30000, maxRetries: 2 }
    )

    // Normalize requirement IDs
    return result.requirements.map((req, index) => ({
      ...req,
      id: req.id || `req-${index + 1}`,
      requirement: req.requirement.trim(),
    }))
  } catch (error) {
    console.warn("[Requirement Agent] Model extraction failed, engaging grounded text fallback:", error)
    return extractGroundedHeuristicRequirements(trimmedJD)
  }
}

/**
 * Deterministic fallback extractor that derives atomic requirements directly from
 * bullet points and key lines of the Job Description without fabricating non-existent content.
 */
export function extractGroundedHeuristicRequirements(jobDescription: string): StructuredRequirement[] {
  const lines = jobDescription
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const candidateRequirements: StructuredRequirement[] = []
  let isPreferredSection = false
  let idCounter = 1

  const nextId = () => `req-${idCounter++}`

  for (const line of lines) {
    const lower = line.toLowerCase()

    if (lower.includes("preferred") || lower.includes("nice to have") || lower.includes("bonus")) {
      isPreferredSection = true
      continue
    }
    if (lower.includes("required") || lower.includes("responsibilities") || lower.includes("qualifications")) {
      isPreferredSection = false
      continue
    }

    // Identify bullet items or requirement sentences
    const isBullet = /^[\u2022\u2023\u25E6\u2043\u2219\*\-\+]\s*(.+)/.test(line)
    const isNumbered = /^\d+[\.\)]\s*(.+)/.test(line)

    if (isBullet || isNumbered || (line.length > 25 && line.length < 250 && !line.endsWith(":"))) {
      const cleanText = line.replace(/^[\u2022\u2023\u25E6\u2043\u2219\*\-\+\d\.\)\s]+/, "").trim()

      if (cleanText.length >= 8) {
        const decomposed = decomposeAtomicRequirements(
          cleanText,
          categorizeText(cleanText),
          isPreferredSection ? "preferred" : "required",
          nextId
        )
        candidateRequirements.push(...decomposed)
      }
    }
  }

  // If no requirements were extracted from lines, inspect the raw text
  if (candidateRequirements.length === 0) {
    const sentences = jobDescription
      .split(/[.\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10)

    for (const sentence of sentences) {
      const decomposed = decomposeAtomicRequirements(
        sentence,
        categorizeText(sentence),
        "required",
        nextId
      )
      candidateRequirements.push(...decomposed)
    }

    if (candidateRequirements.length === 0) {
      throw new InvalidJobDescriptionError("Job description contains insufficient text to extract requirements.")
    }
  }

  return candidateRequirements.slice(0, 15)
}

function decomposeAtomicRequirements(
  text: string,
  baseCategory: "skill" | "experience" | "education" | "other",
  importance: "required" | "preferred",
  getId: () => string
): StructuredRequirement[] {
  // Check for clauses like "who knows ...", "experience with ...", "skilled in ...", "proficient in ..."
  const listMatch = text.match(
    /(?:who knows|experience with|proficient in|knowledge of|working with|skilled in|familiar with|hands-on with|including|expertise in)\s+([^.]+)/i
  )

  if (listMatch) {
    const listPart = listMatch[1]
    const beforePart = text
      .slice(0, listMatch.index)
      .trim()
      .replace(/^we need an?\s+/i, "")
      .replace(/^seeking an?\s+/i, "")
      .replace(/^looking for an?\s+/i, "")

    const items = listPart
      .split(/,\s*|\s+and\s+/)
      .map((i) => i.trim().replace(/[.]+$/, ""))
      .filter((i) => i.length > 2)

    if (items.length >= 2) {
      const results: StructuredRequirement[] = []
      if (beforePart.length > 4) {
        results.push({
          id: getId(),
          requirement: beforePart,
          category: categorizeText(beforePart),
          importance,
        })
      }
      for (const item of items) {
        results.push({
          id: getId(),
          requirement: item,
          category: categorizeText(item),
          importance,
        })
      }
      return results
    }
  }

  // Check if sentence is a compound list of skills separated by commas/and
  const commaAndParts = text
    .split(/,\s*|\s+and\s+/)
    .map((p) => p.trim().replace(/[.]+$/, ""))
    .filter((p) => p.length > 2)

  if (commaAndParts.length >= 3 && (text.includes(",") || /\band\b/i.test(text))) {
    const avgLen = commaAndParts.reduce((acc, p) => acc + p.length, 0) / commaAndParts.length
    if (avgLen < 35) {
      return commaAndParts.map((part) => ({
        id: getId(),
        requirement: part,
        category: categorizeText(part),
        importance,
      }))
    }
  }

  return [
    {
      id: getId(),
      requirement: text,
      category: baseCategory,
      importance,
    },
  ]
}

function categorizeText(text: string): "skill" | "experience" | "education" | "other" {
  const cleanLower = text.toLowerCase()
  if (
    cleanLower.includes("degree") ||
    cleanLower.includes("bachelor") ||
    cleanLower.includes("master") ||
    cleanLower.includes("phd")
  ) {
    return "education"
  } else if (
    cleanLower.includes("year") ||
    cleanLower.includes("experience") ||
    cleanLower.includes("track record") ||
    cleanLower.includes("engineer") ||
    cleanLower.includes("architect") ||
    cleanLower.includes("developer")
  ) {
    return "experience"
  } else if (cleanLower.includes("certif") || cleanLower.includes("license")) {
    return "other"
  }
  return "skill"
}

