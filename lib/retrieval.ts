import { chunkResume } from "./chunking"
import { generateBatchEmbeddings, calculateCosineSimilarity } from "./embeddings"
import type { StructuredRequirement } from "./schemas"

export interface RetrievedEvidence {
  chunkId: string
  section: string
  text: string
  score: number
}

export interface RetrievalResult {
  requirementId: string
  requirement: string
  evidence: RetrievedEvidence[]
}

const TOP_K = 3
// Below this cosine similarity, treat a chunk as "not real evidence" rather
// than forcing a top-k match that isn't actually relevant.
const MIN_SIMILARITY = 0.25

/**
 * For each job requirement, retrieves the top-k most semantically similar
 * resume chunks. There is no persistent vector store here on purpose: at
 * prototype scale (one resume vs. one JD per request) a standing vector DB
 * would be unnecessary infrastructure. This scoped, in-memory index is
 * recomputed per request and discarded afterward.
 */
export async function retrieveEvidenceForRequirements(
  resumeText: string,
  requirements: StructuredRequirement[],
): Promise<RetrievalResult[]> {
  const chunks = chunkResume(resumeText)

  const [chunkEmbeddings, requirementEmbeddings] = await Promise.all([
    generateBatchEmbeddings(chunks.map((c) => c.text)),
    generateBatchEmbeddings(requirements.map((r) => r.requirement)),
  ])

  return requirements.map((requirement, i) => {
    const reqEmbedding = requirementEmbeddings[i]

    const scored = chunks.map((chunk, j) => ({
      chunk,
      score: calculateCosineSimilarity(reqEmbedding, chunkEmbeddings[j]),
    }))

    scored.sort((a, b) => b.score - a.score)

    const evidence = scored
      .slice(0, TOP_K)
      .filter((s) => s.score >= MIN_SIMILARITY)
      .map((s) => ({
        chunkId: s.chunk.chunkId,
        section: s.chunk.section,
        text: s.chunk.text,
        score: Math.round(s.score * 1000) / 1000,
      }))

    return {
      requirementId: requirement.id,
      requirement: requirement.requirement,
      evidence,
    }
  })
}
