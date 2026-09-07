import { retrieveEvidenceForRequirements, type RetrievalResult } from "./retrieval"
import { generateStructuredAnalysis } from "./model-provider"
import {
  StructuredRequirementsSchema,
  ScreeningReportSchema,
  type StructuredRequirement,
  type ScreeningReport,
} from "./schemas"

export interface StageLog {
  requestId: string
  stage: string
  durationMs: number
  status: "ok" | "error"
  error?: string
}

export interface AgentResult {
  report: ScreeningReport
  logs: StageLog[]
}

async function timedStage<T>(
  requestId: string,
  stage: string,
  logs: StageLog[],
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now()

  try {
    const result = await fn()

    logs.push({
      requestId,
      stage,
      durationMs: Date.now() - start,
      status: "ok",
    })

    return result
  } catch (error) {
    logs.push({
      requestId,
      stage,
      durationMs: Date.now() - start,
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    })

    throw error
  }
}

/**
 * Multi-step screening agent:
 *   1. extractRequirements  - LLM turns free-text JD into structured, atomic requirements
 *   2. retrieveEvidence     - real vector search per requirement against resume chunks
 *   3. compareAndGenerate   - LLM compares each requirement against ONLY its own
 *                             retrieved evidence, grounded, with insufficient-evidence handling
 *   4. validateGrounding    - deterministic post-check rejecting invented citations
 */
export async function runScreeningAgent(
  requestId: string,
  resumeText: string,
  jobDescription: string,
): Promise<AgentResult> {
  const logs: StageLog[] = []

  const requirements = await timedStage(
    requestId,
    "extractRequirements",
    logs,
    () => extractRequirements(jobDescription),
  )

  const retrieval = await timedStage(
    requestId,
    "retrieveEvidence",
    logs,
    () => retrieveEvidenceForRequirements(resumeText, requirements),
  )

  const report = await timedStage(
    requestId,
    "compareAndGenerate",
    logs,
    () => generateGroundedReport(requirements, retrieval),
  )

  return { report, logs }
}

async function extractRequirements(
  jobDescription: string,
): Promise<StructuredRequirement[]> {
  const system =
    "You extract job requirements as structured data. " +
    "Output ONLY JSON matching the schema. " +
    "The requirements array MUST contain at least 1 item. " +
    "Extract every meaningful job requirement from the job description. " +
    "Each requirement must be a single, atomic, checkable claim. " +
    "Use one skill, one experience requirement, one education requirement, " +
    "or one other requirement per item. " +
    "Do not bundle multiple requirements into one item. " +
    "Never return an empty requirements array. " +
    "If the job description is short or vague, extract at least the most obvious " +
    "requirement rather than returning an empty array."

  const user =
    `Job description:\n"""${jobDescription.slice(0, 6000)}"""\n\n` +
    `Return JSON in exactly this structure:\n` +
    `{ "requirements": [ { "id": string, "requirement": string, ` +
    `"category": "skill"|"experience"|"education"|"other", ` +
    `"importance": "required"|"preferred" } ] }\n\n` +
    `The requirements array MUST contain at least 1 requirement.`

  const result = await generateStructuredAnalysis(
    system,
    user,
    StructuredRequirementsSchema,
  )

  return result.requirements
}

async function generateGroundedReport(
  requirements: StructuredRequirement[],
  retrieval: RetrievalResult[],
): Promise<ScreeningReport> {
  const system =
    "You are a resume screening assistant. " +
    "For EACH requirement you are given ONLY the retrieved resume evidence chunks " +
    "for that requirement - never invent experience not present in the evidence. " +
    "If the evidence list for a requirement is empty or clearly irrelevant, " +
    "you MUST set status to 'insufficient_evidence' and say so explicitly. " +
    "That means the evidence was not found in the retrieved text, NOT that the " +
    "candidate definitely lacks the skill. " +
    "Every 'quote' you cite must be copied verbatim from the evidence text " +
    "you were given for that requirement."

  const payload = retrieval.map((r) => ({
    requirementId: r.requirementId,
    requirement: r.requirement,
    evidence: r.evidence,
  }))

  const user =
    `Requirements with retrieved evidence:\n` +
    `${JSON.stringify(payload, null, 2)}\n\n` +
    `Return JSON in exactly this structure:\n` +
    `{ "requirementResults": [ { "requirementId", "requirement", ` +
    `"status": "matched"|"partial"|"gap"|"insufficient_evidence", ` +
    `"evidence": [ { "chunkId", "section", "quote", "score" } ], ` +
    `"explanation": string, ` +
    `"confidence": "low"|"medium"|"high" } ], ` +
    `"overallMatchScore": number (0-100), ` +
    `"matchedCount": number, ` +
    `"gapCount": number, ` +
    `"insufficientEvidenceCount": number }`

  const report = await generateStructuredAnalysis(
    system,
    user,
    ScreeningReportSchema,
    { timeoutMs: 25000 },
  )

  return validateGrounding(report, retrieval)
}

/**
 * Deterministic post-generation check:
 * any cited quote that doesn't actually appear in the evidence text
 * it claims to come from gets stripped, and the verdict is downgraded.
 *
 * This is the real defense against hallucinated evidence.
 */
export function validateGrounding(
  report: ScreeningReport,
  retrieval: RetrievalResult[],
): ScreeningReport {
  const evidenceByRequirement = new Map(
    retrieval.map((r) => [r.requirementId, r.evidence]),
  )

  const fixed = report.requirementResults.map((verdict) => {
    const available =
      evidenceByRequirement.get(verdict.requirementId) ?? []

    const availableText = available.map((e) => e.text.toLowerCase())

    const grounded = verdict.evidence.filter((cited) =>
      availableText.some((text) =>
        text.includes(cited.quote.toLowerCase().slice(0, 40)),
      ),
    )

    if (
      grounded.length < verdict.evidence.length &&
      verdict.status !== "insufficient_evidence"
    ) {
      return {
        ...verdict,
        evidence: grounded,
        status:
          grounded.length > 0
            ? verdict.status
            : ("insufficient_evidence" as const),
        confidence: "low" as const,
        explanation:
          `${verdict.explanation} ` +
          `[One or more cited quotes could not be verified against ` +
          `retrieved evidence and were removed.]`,
      }
    }

    return verdict
  })

  return {
    ...report,
    requirementResults: fixed,
  }
}