import type { RequirementVerdict, CitedEvidence } from "../schemas"

export interface GroundingValidationReport {
  verdicts: RequirementVerdict[]
  totalCitations: number
  verifiedCitations: number
  rejectedCitations: number
  groundingRatio: number
}

/**
 * AGENT 6: Grounding / Judge Validation Agent
 * 
 * Deterministically audits all claims and quotes produced by the evaluation agents.
 * 
 * RULES:
 * 1. A cited quote must actually appear in the retrieved evidence text for that requirement.
 * 2. If a quote is not found in the source text, it is removed as an hallucinated citation.
 * 3. If any citations are stripped, confidence is downgraded to 'low'.
 * 4. If all citations for a 'matched' or 'partial' claim are stripped or missing, the status
 *    is downgraded to 'insufficient_evidence'.
 */
export function validateCitations(
  verdicts: RequirementVerdict[],
  retrievedEvidence: { requirementId: string; evidence: { chunkId: string; text: string }[] }[]
): RequirementVerdict[] {
  const { verdicts: validated } = auditGrounding(verdicts, retrievedEvidence)
  return validated
}

/**
 * Full audit with detailed grounding metrics for observability and evals.
 */
export function auditGrounding(
  verdicts: RequirementVerdict[],
  retrievedEvidence: { requirementId: string; evidence: { chunkId: string; text: string }[] }[]
): GroundingValidationReport {
  const evidenceMap = new Map(retrievedEvidence.map((re) => [re.requirementId, re.evidence]))

  let totalCitations = 0
  let verifiedCitations = 0
  let rejectedCitations = 0

  const validatedVerdicts = verdicts.map((verdict) => {
    const sourceChunks = evidenceMap.get(verdict.requirementId) || []
    const normalizedSourceTexts = sourceChunks.map((c) => normalizeForMatch(c.text))

    const validEvidence: CitedEvidence[] = []

    for (const cited of verdict.evidence) {
      totalCitations++
      const normalizedQuote = normalizeForMatch(cited.quote)

      if (!normalizedQuote) {
        rejectedCitations++
        continue
      }

      // Exact substring or significant prefix match (first 35 chars)
      const quotePrefix = normalizedQuote.slice(0, 35)
      const isVerified = normalizedSourceTexts.some(
        (src) => src.includes(normalizedQuote) || src.includes(quotePrefix)
      )

      if (isVerified) {
        verifiedCitations++
        validEvidence.push(cited)
      } else {
        rejectedCitations++
      }
    }

    let confidence = verdict.confidence
    let status = verdict.status
    let explanation = verdict.explanation

    const hadHallucinatedQuotes = validEvidence.length < verdict.evidence.length

    if (hadHallucinatedQuotes) {
      confidence = "low"
      explanation += " [Judge: Hallucinated or ungrounded citations were removed.]"
    }

    // If candidate was marked matched or partial but has no verified source evidence
    if (validEvidence.length === 0 && (status === "matched" || status === "partial")) {
      status = "insufficient_evidence"
      confidence = "low"
      explanation += " [Judge Downgrade: Status revised to insufficient_evidence due to lack of verified citations.]"
    }

    return {
      ...verdict,
      evidence: validEvidence,
      status,
      confidence,
      explanation,
    }
  })

  const groundingRatio = totalCitations > 0
    ? Math.round((verifiedCitations / totalCitations) * 100) / 100
    : 1.0

  return {
    verdicts: validatedVerdicts,
    totalCitations,
    verifiedCitations,
    rejectedCitations,
    groundingRatio,
  }
}

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}

