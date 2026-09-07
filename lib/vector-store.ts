import { calculateCosineSimilarity } from "./embeddings"

export interface VectorMetadata {
  chunkId: string
  documentId: string
  section: string
  startChar?: number
  endChar?: number
  [key: string]: any
}

export interface VectorDocument {
  id: string
  text: string
  metadata: VectorMetadata
  vector: number[]
}

export interface ScoredVectorDocument extends VectorDocument {
  score: number
}

export interface VectorSearchOptions {
  k?: number
  minScore?: number
  filter?: (doc: VectorDocument) => boolean
}

/**
 * Standard vector store interface enabling future drop-in migration to
 * pgvector, Pinecone, Qdrant, or Weaviate.
 */
export interface IVectorStore {
  addDocuments(docs: VectorDocument[]): Promise<void>
  similaritySearch(queryVector: number[], options?: VectorSearchOptions): Promise<ScoredVectorDocument[]>
  count(): number
  clear(): void
}

/**
 * High-performance in-memory vector store for request-scoped or local index RAG.
 */
export class LocalVectorStore implements IVectorStore {
  private documents: VectorDocument[] = []

  async addDocuments(docs: VectorDocument[]): Promise<void> {
    this.documents.push(...docs)
  }

  async similaritySearch(
    queryVector: number[],
    options: VectorSearchOptions | number = {}
  ): Promise<ScoredVectorDocument[]> {
    // Handle backwards-compatible signature: similaritySearch(queryVector, k, minScore)
    const k = typeof options === "number" ? options : options.k ?? 3
    const minScore = typeof options === "object" ? options.minScore ?? 0.2 : 0.2
    const filter = typeof options === "object" ? options.filter : undefined

    let candidates = this.documents
    if (filter) {
      candidates = candidates.filter(filter)
    }

    const scored: ScoredVectorDocument[] = candidates.map((doc) => ({
      ...doc,
      score: calculateCosineSimilarity(queryVector, doc.vector),
    }))

    return scored
      .filter((doc) => doc.score >= minScore)
      .sort((a, b) => {
        // Primary sort: descending similarity score
        if (b.score !== a.score) return b.score - a.score
        // Deterministic tie-breaker: document ID
        return a.id.localeCompare(b.id)
      })
      .slice(0, k)
  }

  getDocuments(): VectorDocument[] {
    return [...this.documents]
  }

  count(): number {
    return this.documents.length
  }

  clear(): void {
    this.documents = []
  }
}

