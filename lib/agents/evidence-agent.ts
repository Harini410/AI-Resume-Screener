import type { IVectorStore } from "../vector-store"
import { generateEmbedding } from "../embeddings"
import type { StructuredRequirement, RetrievalResult } from "../schemas"

export interface RetrievalAgentOptions {
  topK?: number
  minScoreThreshold?: number
}

/**
 * AGENT 2: Evidence Retrieval Agent
 * Responsibility: For every extracted requirement, query the vector index and retrieve
 * ranked candidate evidence chunks with similarity scores and section metadata.
 * 
 * STRICT RULE: The agent MUST NOT hallucinate or synthesize evidence. Evidence is
 * strictly retrieved from the indexed resume document.
 */
export async function retrieveEvidence(
  requirements: StructuredRequirement[],
  vectorStore: IVectorStore,
  options: RetrievalAgentOptions = {}
): Promise<RetrievalResult[]> {
  const { topK = 3, minScoreThreshold = 0.15 } = options
  const results: RetrievalResult[] = []

  for (const req of requirements) {
    const queryVector = await generateEmbedding(req.requirement)

    const matches = await vectorStore.similaritySearch(queryVector, {
      k: topK,
      minScore: minScoreThreshold,
    })

    results.push({
      requirementId: req.id,
      requirement: req.requirement,
      importance: req.importance,
      evidence: matches.map((m) => ({
        chunkId: m.metadata.chunkId || m.id,
        documentId: m.metadata.documentId || "resume",
        section: m.metadata.section || "general",
        text: m.text,
        score: Math.round(m.score * 1000) / 1000,
      })),
    })
  }

  return results
}

