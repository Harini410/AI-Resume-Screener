import * as tf from "@tensorflow/tfjs"

let model: tf.GraphModel | null = null

// Load the Universal Sentence Encoder model
export async function loadEmbeddingModel(): Promise<tf.GraphModel | null> {
  if (model) return model

  try {
    // Try multiple model URLs for better reliability
    const modelUrls = [
      "https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder-lite/1/default/1/model.json",
      "https://storage.googleapis.com/tfjs-models/savedmodel/universal_sentence_encoder/model.json",
    ]

    for (const modelUrl of modelUrls) {
      try {
        console.log("[v0] Attempting to load model from:", modelUrl)
        model = await tf.loadGraphModel(modelUrl)
        console.log("[v0] Model loaded successfully")
        return model
      } catch (urlError) {
        console.warn("[v0] Failed to load from", modelUrl, ":", urlError)
        continue
      }
    }

    throw new Error("All model URLs failed")
  } catch (error) {
    console.error("[v0] Failed to load embedding model:", error)
    return null // Return null instead of throwing to enable graceful fallback
  }
}

// Generate embeddings for a given text
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const loadedModel = await loadEmbeddingModel()
    if (!loadedModel) {
      console.warn("[v0] Model not available, skipping embedding generation")
      return null
    }

    const cleanText = preprocessText(text)
    console.log("[v0] Generating embedding for text length:", cleanText.length)

    // Create string tensor with proper shape
    const inputTensor = tf.tensor1d([cleanText], "string")
    console.log("[v0] Input tensor shape:", inputTensor.shape)

    // Generate embedding
    const embedding = loadedModel.predict(inputTensor) as tf.Tensor
    console.log("[v0] Output embedding shape:", embedding.shape)

    const embeddingArray = await embedding.data()

    // Clean up tensors
    inputTensor.dispose()
    embedding.dispose()

    return Array.from(embeddingArray)
  } catch (error) {
    console.error("[v0] Error generating embedding:", error)
    return null // Return null instead of throwing
  }
}

// Generate embeddings for multiple texts efficiently
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][] | null> {
  try {
    const loadedModel = await loadEmbeddingModel()
    if (!loadedModel) {
      console.warn("[v0] Model not available, skipping batch embedding generation")
      return null
    }

    const cleanTexts = texts.map(preprocessText)
    console.log("[v0] Generating batch embeddings for", texts.length, "texts")

    try {
      const maxLength = 128
      const inputIds: number[][] = []
      const attentionMasks: number[][] = []

      for (const text of cleanTexts) {
        // Simple tokenization - convert text to token IDs
        const tokens = text.split(" ").slice(0, maxLength - 2) // Reserve space for [CLS] and [SEP]
        const tokenIds = [101] // [CLS] token

        // Convert words to simple hash-based IDs (simplified tokenization)
        for (const token of tokens) {
          const hashId =
            (Math.abs(
              token.split("").reduce((a, b) => {
                a = (a << 5) - a + b.charCodeAt(0)
                return a & a
              }, 0),
            ) %
              30000) +
            1000 // Simple hash to token ID
          tokenIds.push(hashId)
        }

        tokenIds.push(102) // [SEP] token

        // Pad or truncate to maxLength
        while (tokenIds.length < maxLength) {
          tokenIds.push(0) // [PAD] token
        }
        tokenIds.splice(maxLength)

        // Create attention mask (1 for real tokens, 0 for padding)
        const attentionMask = tokenIds.map((id) => (id === 0 ? 0 : 1))

        inputIds.push(tokenIds)
        attentionMasks.push(attentionMask)
      }

      // Create tensors with proper shapes
      const inputIdsTensor = tf.tensor2d(inputIds, [texts.length, maxLength], "int32")
      const attentionMaskTensor = tf.tensor2d(attentionMasks, [texts.length, maxLength], "int32")

      console.log("[v0] Input IDs tensor shape:", inputIdsTensor.shape)
      console.log("[v0] Attention mask tensor shape:", attentionMaskTensor.shape)

      const modelInputs = {
        input_ids: inputIdsTensor,
        attention_mask: attentionMaskTensor,
      }

      const embeddings = loadedModel.predict(modelInputs) as tf.Tensor
      console.log("[v0] Batch output embeddings shape:", embeddings.shape)

      const embeddingData = await embeddings.data()
      const embeddingSize = embeddingData.length / texts.length

      const result: number[][] = []
      for (let i = 0; i < texts.length; i++) {
        const start = i * embeddingSize
        const end = start + embeddingSize
        result.push(Array.from(embeddingData.slice(start, end)))
      }

      // Clean up tensors
      inputIdsTensor.dispose()
      attentionMaskTensor.dispose()
      embeddings.dispose()

      return result
    } catch (bertError) {
      console.warn("[v0] BERT format failed, trying Universal Sentence Encoder format:", bertError)

      try {
        const stringTensor = tf.tensor1d(cleanTexts, "string")
        console.log("[v0] Using Universal Sentence Encoder format with tensor shape:", stringTensor.shape)

        const embeddings = loadedModel.predict(stringTensor) as tf.Tensor
        console.log("[v0] Batch output embeddings shape:", embeddings.shape)

        const embeddingData = await embeddings.data()
        const embeddingSize = embeddingData.length / texts.length

        const result: number[][] = []
        for (let i = 0; i < texts.length; i++) {
          const start = i * embeddingSize
          const end = start + embeddingSize
          result.push(Array.from(embeddingData.slice(start, end)))
        }

        // Clean up tensors
        stringTensor.dispose()
        embeddings.dispose()

        return result
      } catch (useError) {
        console.warn("[v0] Universal Sentence Encoder format also failed:", useError)
        return null // Graceful fallback
      }
    }
  } catch (error) {
    console.error("[v0] Error generating batch embeddings:", error)
    return null // Return null instead of throwing
  }
}

// Calculate cosine similarity between two embeddings
export function calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error("Embeddings must have the same length")
  }

  // Calculate dot product
  let dotProduct = 0
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i]
  }

  // Calculate magnitudes
  let magnitude1 = 0
  let magnitude2 = 0
  for (let i = 0; i < embedding1.length; i++) {
    magnitude1 += embedding1[i] * embedding1[i]
    magnitude2 += embedding2[i] * embedding2[i]
  }

  magnitude1 = Math.sqrt(magnitude1)
  magnitude2 = Math.sqrt(magnitude2)

  // Avoid division by zero
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0
  }

  // Calculate cosine similarity
  const similarity = dotProduct / (magnitude1 * magnitude2)

  // Clamp to [-1, 1] range and convert to percentage
  return Math.max(-1, Math.min(1, similarity))
}

// Preprocess text for better embedding quality
function preprocessText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Remove punctuation
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
    .substring(0, 1000) // Limit length for performance
}

// Calculate semantic similarity score between resume and job description
export async function calculateSemanticSimilarity(resumeText: string, jobDescription: string): Promise<number> {
  try {
    const embeddings = await generateBatchEmbeddings([resumeText, jobDescription])

    if (!embeddings || embeddings.length !== 2) {
      console.warn("[v0] Could not generate embeddings, returning 0 semantic score")
      return 0
    }

    const similarity = calculateCosineSimilarity(embeddings[0], embeddings[1])
    const score = Math.round(((similarity + 1) / 2) * 100)
    console.log("[v0] Calculated semantic similarity:", score)

    return score
  } catch (error) {
    console.error("[v0] Error calculating semantic similarity:", error)
    return 0 // Always return a valid score
  }
}

// Enhanced similarity calculation that combines semantic and keyword matching
export async function calculateEnhancedSimilarity(
  resumeText: string,
  jobDescription: string,
  resumeSkills: string[],
  jobSkills: string[],
): Promise<{ semanticScore: number; keywordScore: number; combinedScore: number }> {
  console.log("[v0] Starting enhanced similarity calculation")

  let semanticScore = 0

  try {
    semanticScore = await calculateSemanticSimilarity(resumeText, jobDescription)
    console.log("[v0] Semantic score calculated:", semanticScore)
  } catch (modelError) {
    console.warn("[v0] Semantic analysis failed, using keyword-only scoring:", modelError)
    semanticScore = 0
  }

  // Calculate keyword-based similarity
  const matchingSkills = resumeSkills.filter((skill) =>
    jobSkills.some((jobSkill) => jobSkill.toLowerCase() === skill.toLowerCase()),
  )
  const keywordScore = jobSkills.length > 0 ? Math.round((matchingSkills.length / jobSkills.length) * 100) : 0
  console.log("[v0] Keyword score calculated:", keywordScore)

  // Combine scores: 70% semantic, 30% keyword (if semantic available)
  const combinedScore = semanticScore > 0 ? Math.round(semanticScore * 0.7 + keywordScore * 0.3) : keywordScore
  console.log("[v0] Combined score calculated:", combinedScore)

  return {
    semanticScore: Math.max(0, Math.min(100, semanticScore)),
    keywordScore: Math.max(0, Math.min(100, keywordScore)),
    combinedScore: Math.max(0, Math.min(100, combinedScore)),
  }
}
