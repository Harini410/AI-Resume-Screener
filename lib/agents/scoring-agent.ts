import type { RequirementVerdict, DeterministicScore } from "../schemas"

export interface ScoringInput {
  status: "matched" | "partial" | "gap" | "insufficient_evidence"
  importance?: "required" | "preferred"
  confidence?: "low" | "medium" | "high"
}

/**
 * AGENT 5: Deterministic Scoring Agent
 * 
 * Implements a 100% deterministic mathematical aggregation. The LLM is never
 * permitted to invent or hallucinate the numerical score.
 * 
 * MATHEMATICAL SPECIFICATION:
 * ----------------------------
 * 1. Base Status Score:
 *    - matched: 1.0
 *    - partial: 0.5
 *    - gap: 0.0
 *    - insufficient_evidence: 0.0 (unverified claims cannot earn points)
 * 
 * 2. Importance Weight:
 *    - required: 1.0
 *    - preferred: 0.4 (nice-to-have capabilities contribute secondary weight)
 * 
 * 3. Confidence Adjustment:
 *    - high: 1.0 (verified, verbatim quotation)
 *    - medium: 0.9 (partial or semantic inference)
 *    - low: 0.75 (weak citation or downgraded evidence)
 * 
 * 4. Aggregation Formula:
 *    EffectiveScore_i = StatusScore_i * ConfidenceMultiplier_i
 *    OverallScore = Round( (SUM(EffectiveScore_i * ImportanceWeight_i) / SUM(ImportanceWeight_i)) * 100 )
 */
export function calculateFinalScore(
  results: (RequirementVerdict | ScoringInput)[]
): DeterministicScore {
  const STATUS_SCORES: Record<string, number> = {
    matched: 1.0,
    partial: 0.5,
    gap: 0.0,
    insufficient_evidence: 0.0,
  }

  const IMPORTANCE_WEIGHTS: Record<string, number> = {
    required: 1.0,
    preferred: 0.4,
  }

  const CONFIDENCE_MULTIPLIERS: Record<string, number> = {
    high: 1.0,
    medium: 0.9,
    low: 0.75,
  }

  let totalWeightedScore = 0
  let totalWeight = 0

  let matchedCount = 0
  let partialCount = 0
  let gapCount = 0
  let insufficientEvidenceCount = 0

  for (const item of results) {
    const status = item.status
    const importance = item.importance || "required"
    const confidence = item.confidence || "medium"

    // Increment categorical counts
    if (status === "matched") matchedCount++
    else if (status === "partial") partialCount++
    else if (status === "gap") gapCount++
    else if (status === "insufficient_evidence") insufficientEvidenceCount++

    const baseStatusScore = STATUS_SCORES[status] ?? 0
    const impWeight = IMPORTANCE_WEIGHTS[importance] ?? 1.0
    const confMultiplier = CONFIDENCE_MULTIPLIERS[confidence] ?? 0.9

    // Confidence scales positive matches; gaps and missing evidence remain 0
    const effectiveItemScore = baseStatusScore * confMultiplier

    totalWeightedScore += effectiveItemScore * impWeight
    totalWeight += impWeight
  }

  const overallMatchScore = totalWeight > 0
    ? Math.max(0, Math.min(100, Math.round((totalWeightedScore / totalWeight) * 100)))
    : 0

  return {
    overallMatchScore,
    matchedCount,
    partialCount,
    gapCount,
    insufficientEvidenceCount,
  }
}

