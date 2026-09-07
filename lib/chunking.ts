import { processDocument, type DocumentChunk } from "./document-processor"

export interface ResumeChunk {
  chunkId: string
  section: string
  text: string
}

export { type DocumentChunk } from "./document-processor"

/**
 * Splits resume text into section-tagged chunks so retrieval results carry
 * real metadata. Wraps the unified processDocument pipeline with 500-char windows.
 */
export function chunkResume(resumeText: string): ResumeChunk[] {
  const trimmed = resumeText ? resumeText.trim() : ""
  if (!trimmed) {
    return [{ chunkId: "c0", section: "general", text: "" }]
  }

  const chunks = processDocument(resumeText, "resume", {
    maxWindowChars: 500,
    overlapChars: 50,
  })

  return chunks.map((c, i) => ({
    chunkId: `c${i}`,
    section: c.section,
    text: c.text,
  }))
}

