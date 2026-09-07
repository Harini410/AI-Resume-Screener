import {
  generateBatchEmbeddings as libGenerateBatchEmbeddings,
  generateEmbedding as libGenerateEmbedding,
  calculateCosineSimilarity as libCalculateCosineSimilarity,
} from "../lib/embeddings"

export const generateBatchEmbeddings = libGenerateBatchEmbeddings
export const generateEmbedding = libGenerateEmbedding
export const calculateCosineSimilarity = libCalculateCosineSimilarity

/**
 * Calculates semantic similarity (0-100) between resume and job description
 * using the server-side embedding engine.
 */
export async function calculateSemanticSimilarity(
  resumeText: string,
  jobDescription: string
): Promise<number | null> {
  try {
    const [resumeEmbedding, jobEmbedding] = await generateBatchEmbeddings([
      resumeText,
      jobDescription,
    ])
    const similarity = calculateCosineSimilarity(resumeEmbedding, jobEmbedding)
    return Math.round(((similarity + 1) / 2) * 100)
  } catch (error) {
    console.error("[embeddings] Semantic similarity computation failed:", error)
    return null
  }
}

/**
 * Combines semantic similarity with exact keyword matching.
 */
export async function calculateEnhancedSimilarity(
  resumeText: string,
  jobDescription: string,
  resumeSkills: string[],
  jobSkills: string[]
): Promise<{ semanticScore: number | null; keywordScore: number; combinedScore: number }> {
  const semanticScore = await calculateSemanticSimilarity(resumeText, jobDescription)

  const matchingSkills = resumeSkills.filter((skill) =>
    jobSkills.some((jobSkill) => jobSkill.toLowerCase() === skill.toLowerCase())
  )
  const keywordScore =
    jobSkills.length > 0 ? Math.round((matchingSkills.length / jobSkills.length) * 100) : 0

  const combinedScore =
    semanticScore !== null
      ? Math.round(semanticScore * 0.7 + keywordScore * 0.3)
      : keywordScore

  return {
    semanticScore,
    keywordScore: Math.max(0, Math.min(100, keywordScore)),
    combinedScore: Math.max(0, Math.min(100, combinedScore)),
  }
}

