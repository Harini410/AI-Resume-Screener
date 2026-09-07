import { describe, it, expect } from "vitest"
import { validateGrounding } from "./agent"
import type { ScreeningReport } from "./schemas"
import type { RetrievalResult } from "./retrieval"

const retrieval: RetrievalResult[] = [
  {
    requirementId: "r1",
    requirement: "Python backend experience",
    evidence: [{ chunkId: "c1", section: "experience", text: "Built REST APIs in Python for 3 years", score: 0.8 }],
  },
]

function baseReport(quote: string, status: ScreeningReport["requirementResults"][0]["status"] = "matched"): ScreeningReport {
  return {
    requirementResults: [
      {
        requirementId: "r1",
        requirement: "Python backend experience",
        status,
        evidence: [{ chunkId: "c1", section: "experience", quote, score: 0.8 }],
        explanation: "Direct match.",
        confidence: "high",
      },
    ],
    overallMatchScore: 90,
    matchedCount: 1,
    gapCount: 0,
    insufficientEvidenceCount: 0,
  }
}

describe("validateGrounding", () => {
  it("keeps a citation that actually appears in the retrieved evidence", () => {
    const result = validateGrounding(baseReport("Built REST APIs in Python"), retrieval)
    expect(result.requirementResults[0].evidence.length).toBe(1)
    expect(result.requirementResults[0].status).toBe("matched")
  })

  it("strips and downgrades a citation the model invented", () => {
    const result = validateGrounding(baseReport("Led a team of 10 Python engineers"), retrieval)
    expect(result.requirementResults[0].evidence.length).toBe(0)
    expect(result.requirementResults[0].status).toBe("insufficient_evidence")
    expect(result.requirementResults[0].confidence).toBe("low")
  })

  it("does not touch verdicts already marked insufficient_evidence", () => {
    const result = validateGrounding(baseReport("Something not in evidence", "insufficient_evidence"), retrieval)
    expect(result.requirementResults[0].status).toBe("insufficient_evidence")
  })
})
