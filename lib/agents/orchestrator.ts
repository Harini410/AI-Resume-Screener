import { extractRequirements } from "./requirement-agent"
import { retrieveEvidence } from "./evidence-agent"
import { evaluateRequirement, evaluateRequirementsBatch } from "./gap-agent"
import { calculateFinalScore } from "./scoring-agent"
import { auditGrounding } from "./grounding-agent"
import { processDocument } from "../document-processor"
import { generateBatchEmbeddings } from "../embeddings"
import { LocalVectorStore } from "../vector-store"
import { getActiveModelName } from "../model-provider"
import type {
  ScreeningReport,
  RequirementVerdict,
  StageMetric,
  ObservabilityReport,
} from "../schemas"

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
  observability: ObservabilityReport
}

/**
 * PRODUCTION MULTI-AGENT RAG ORCHESTRATOR
 * 
 * Executes the complete 7-stage resume screening pipeline:
 * 1. Document Processing & Ingestion (Normalization, Section Detection, Chunking)
 * 2. Vector Indexing (Server-side Embeddings & Vector Store Population)
 * 3. Requirement Extraction Agent (Atomic Decomposition)
 * 4. Evidence Retrieval Agent (Requirement-specific Semantic Vector Search)
 * 5. Evidence Evaluation & Gap Analysis Agent (Grounded Evaluation)
 * 6. Grounding / Judge Validation Agent (Hallucination Detection & Citation Audit)
 * 7. Deterministic Scoring Agent (Mathematical Weighted Aggregation)
 */
export async function runMultiAgentScreening(
  requestId: string,
  resumeText: string,
  jobDescription: string
): Promise<AgentResult> {
  const stageLogs: StageLog[] = []
  const stageDurations: Record<string, number> = {}
  const startTotal = Date.now()
  const modelName = getActiveModelName()

  let requirementCount = 0
  let retrievalCount = 0

  try {
    // -------------------------------------------------------------------------
    // STAGE 1 & 2: Document Processing & Vector Store Indexing
    // -------------------------------------------------------------------------
    const { vectorStore, chunkCount } = await timedStage(
      requestId,
      "document-processing",
      stageLogs,
      stageDurations,
      async () => {
        const chunks = processDocument(resumeText, "resume")
        const texts = chunks.map((c) => c.text)
        const vectors = await generateBatchEmbeddings(texts)

        const store = new LocalVectorStore()
        await store.addDocuments(
          chunks.map((c, i) => ({
            id: c.chunkId,
            text: c.text,
            metadata: {
              ...c.metadata,
              chunkId: c.chunkId,
              documentId: "resume",
              section: c.section,
            },
            vector: vectors[i],
          }))
        )

        return { vectorStore: store, chunkCount: chunks.length }
      }
    )

    // -------------------------------------------------------------------------
    // STAGE 3: Requirement Extraction Agent
    // -------------------------------------------------------------------------
    const requirements = await timedStage(
      requestId,
      "requirement-extraction",
      stageLogs,
      stageDurations,
      async () => {
        const extracted = await extractRequirements(jobDescription)
        requirementCount = extracted.length
        return extracted
      }
    )

    // -------------------------------------------------------------------------
    // STAGE 4: Evidence Retrieval Agent (RAG)
    // -------------------------------------------------------------------------
    const retrievalResults = await timedStage(
      requestId,
      "evidence-retrieval",
      stageLogs,
      stageDurations,
      async () => {
        const retrieved = await retrieveEvidence(requirements, vectorStore, {
          topK: 3,
          minScoreThreshold: 0.15,
        })
        retrievalCount = retrieved.reduce((acc, r) => acc + r.evidence.length, 0)
        return retrieved
      }
    )

    // -------------------------------------------------------------------------
    // STAGE 5: Evidence Evaluation & Gap Analysis Agent (Batch Evaluation)
    // -------------------------------------------------------------------------
    const initialVerdicts: RequirementVerdict[] = await timedStage(
      requestId,
      "evidence-evaluation",
      stageLogs,
      stageDurations,
      async () => {
        return evaluateRequirementsBatch(retrievalResults, requirements)
      }
    )

    // -------------------------------------------------------------------------
    // STAGE 6: Grounding / Judge Validation Agent
    // -------------------------------------------------------------------------
    const groundingReport = await timedStage(
      requestId,
      "grounding-validation",
      stageLogs,
      stageDurations,
      async () => {
        return auditGrounding(
          initialVerdicts,
          retrievalResults.map((r) => ({
            requirementId: r.requirementId,
            evidence: r.evidence,
          }))
        )
      }
    )

    const validatedVerdicts = groundingReport.verdicts

    // -------------------------------------------------------------------------
    // STAGE 7: Deterministic Scoring Agent
    // -------------------------------------------------------------------------
    const scoringResults = await timedStage(
      requestId,
      "scoring",
      stageLogs,
      stageDurations,
      async () => {
        return calculateFinalScore(validatedVerdicts)
      }
    )

    const totalMs = Date.now() - startTotal

    // Build Observability Report
    const observability: ObservabilityReport = {
      requestId,
      model: modelName,
      requirementCount,
      retrievalCount,
      finalScore: scoringResults.overallMatchScore,
      status: "completed",
      stageDurations: {
        ...stageDurations,
        totalMs,
      },
      totalMs,
      stages: stageLogs.map((l) => ({
        stage: l.stage,
        durationMs: l.durationMs,
        status: l.status,
        error: l.error,
      })),
    }

    const report: ScreeningReport = {
      requirementResults: validatedVerdicts,
      ...scoringResults,
      observability,
    }

    return {
      report,
      logs: stageLogs,
      observability,
    }
  } catch (error) {
    console.error(`[Orchestrator:${requestId}] Pipeline failed:`, error)
    const totalMs = Date.now() - startTotal

    const observability: ObservabilityReport = {
      requestId,
      model: modelName,
      requirementCount,
      retrievalCount,
      finalScore: 0,
      status: "failed",
      stageDurations: {
        ...stageDurations,
        totalMs,
      },
      totalMs,
      stages: stageLogs.map((l) => ({
        stage: l.stage,
        durationMs: l.durationMs,
        status: l.status,
        error: l.error,
      })),
    }

    throw error
  }
}

async function timedStage<T>(
  requestId: string,
  stage: string,
  logs: StageLog[],
  durations: Record<string, number>,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    const durationMs = Date.now() - start
    durations[`${stage}Ms`] = durationMs
    logs.push({ requestId, stage, durationMs, status: "ok" })
    return result
  } catch (error) {
    const durationMs = Date.now() - start
    durations[`${stage}Ms`] = durationMs
    logs.push({
      requestId,
      stage,
      durationMs,
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

