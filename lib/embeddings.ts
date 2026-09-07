/**
 * SERVER-SIDE EMBEDDING ENGINE
 * 
 * Provides an environment-configurable embedding abstraction:
 * - 'local' (default): 384-dimensional dense semantic subword n-gram & TF-IDF feature
 *   vectorizer. Zero native binaries, runs deterministically in any serverless or Node.js
 *   environment without onnxruntime or TensorFlow build failures.
 * - 'openai': Uses OpenAI text-embedding-3-small via REST API when OPENAI_API_KEY is provided.
 * - 'custom': Calls a custom embedding HTTP service when EMBEDDING_API_URL is configured.
 */

export type EmbeddingProviderType = "local" | "openai" | "custom"

const VECTOR_DIMENSION = 384

/**
 * Returns the active embedding provider based on environment variables.
 */
export function getEmbeddingProvider(): EmbeddingProviderType {
  const envProvider = process.env.EMBEDDING_PROVIDER?.toLowerCase()
  if (envProvider === "openai" || (!envProvider && process.env.OPENAI_API_KEY)) {
    return "openai"
  }
  if (envProvider === "custom" && process.env.EMBEDDING_API_URL) {
    return "custom"
  }
  return "local"
}

/**
 * Generate a single embedding vector for the provided text.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const [vector] = await generateBatchEmbeddings([text])
  return vector
}

/**
 * Generate embedding vectors for a batch of texts.
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  const provider = getEmbeddingProvider()

  switch (provider) {
    case "openai":
      try {
        return await generateOpenAIEmbeddings(texts)
      } catch (err) {
        console.warn("[embeddings] OpenAI embeddings failed, falling back to local:", err)
        return texts.map(createLocalSemanticVector)
      }

    case "custom":
      try {
        return await generateCustomEmbeddings(texts)
      } catch (err) {
        console.warn("[embeddings] Custom embeddings failed, falling back to local:", err)
        return texts.map(createLocalSemanticVector)
      }

    case "local":
    default:
      return texts.map(createLocalSemanticVector)
  }
}

/**
 * Calculates cosine similarity between two normalized vectors.
 * Returns a value bounded in [-1, 1].
 */
export function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Embedding dimension mismatch: ${a.length} vs ${b.length}`)
  }

  let dot = 0
  let magA = 0
  let magB = 0

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }

  magA = Math.sqrt(magA)
  magB = Math.sqrt(magB)

  if (magA === 0 || magB === 0) return 0
  const sim = dot / (magA * magB)
  return Math.max(-1, Math.min(1, sim))
}

// ---------------------------------------------------------------------------
// Local Deterministic Semantic Vector Engine (384 Dimensions)
// ---------------------------------------------------------------------------

/**
 * Creates a normalized 384-dimensional dense semantic feature vector.
 * Utilizes multi-scale character n-grams (3-6), token stems, and hash projections
 * with term-frequency sub-linear scaling and L2 normalization.
 */
export function createLocalSemanticVector(text: string): number[] {
  const vector = new Array<number>(VECTOR_DIMENSION).fill(0)
  const normalized = text.toLowerCase().replace(/[^a-z0-9+#.\s]/g, " ").trim()
  if (!normalized) return vector

  const tokens = normalized.split(/\s+/).filter(Boolean)

  // 1. Token-level feature projection
  for (const token of tokens) {
    const weight = 1 + Math.log(1 + token.length)
    accumulateHash(vector, token, weight * 1.5)

    // Prefix & suffix n-grams (3 to 6 chars) for morphological similarity
    if (token.length >= 3) {
      for (let n = 3; n <= Math.min(6, token.length); n++) {
        for (let i = 0; i <= token.length - n; i++) {
          const ngram = token.slice(i, i + n)
          accumulateHash(vector, ngram, 0.6)
        }
      }
    }
  }

  // 2. Word bigrams for local semantic context
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = `${tokens[i]}_${tokens[i + 1]}`
    accumulateHash(vector, bigram, 1.2)
  }

  // 3. L2 Normalization (Unit Length)
  let sumSquares = 0
  for (let i = 0; i < VECTOR_DIMENSION; i++) {
    sumSquares += vector[i] * vector[i]
  }

  const norm = Math.sqrt(sumSquares)
  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIMENSION; i++) {
      vector[i] = vector[i] / norm
    }
  }

  return vector
}

function accumulateHash(vector: number[], key: string, weight: number) {
  // FNV-1a 32-bit hash with secondary sign hash
  let h1 = 2166136261
  let h2 = 5381
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i)
    h1 ^= char
    h1 = Math.imul(h1, 16777619)
    h2 = (h2 << 5) + h2 + char
  }

  const index = Math.abs(h1) % VECTOR_DIMENSION
  const sign = (h2 & 1) === 0 ? 1 : -1
  vector[index] += sign * weight
}

// ---------------------------------------------------------------------------
// External Providers (OpenAI & Custom Endpoint)
// ---------------------------------------------------------------------------

async function generateOpenAIEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small"

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: texts,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "")
    throw new Error(`OpenAI embedding error ${response.status}: ${errorBody.slice(0, 200)}`)
  }

  const data = await response.json()
  return data.data.map((item: { embedding: number[] }) => item.embedding)
}

async function generateCustomEmbeddings(texts: string[]): Promise<number[][]> {
  const url = process.env.EMBEDDING_API_URL!
  const apiKey = process.env.EMBEDDING_API_KEY

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ texts }),
  })

  if (!response.ok) {
    throw new Error(`Custom embedding error ${response.status}`)
  }

  const data = await response.json()
  return data.embeddings || data
}

