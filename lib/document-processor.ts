export interface DocumentChunk {
  chunkId: string
  documentId: string
  section: string
  text: string
  startChar: number
  endChar: number
  tokenEstimate: number
  metadata: {
    section: string
    documentId: string
    chunkIndex: number
    [key: string]: any
  }
}

export const CANONICAL_SECTIONS = [
  "summary",
  "objective",
  "professional summary",
  "experience",
  "work experience",
  "employment history",
  "education",
  "skills",
  "technical skills",
  "core competencies",
  "projects",
  "key projects",
  "certifications",
  "licenses",
  "awards",
  "achievements",
  "publications",
  "volunteer",
]

const DEFAULT_WINDOW_CHARS = 600
const DEFAULT_OVERLAP_CHARS = 100

/**
 * Preprocesses and normalizes document text by stripping noise,
 * standardizing whitespace, and normalizing dashes/bullets.
 */
export function normalizeDocumentText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, "-") // normalize unicode dashes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/**
 * Processes a resume or job description into section-aware chunks with metadata.
 */
export function processDocument(
  text: string,
  documentId: string = "doc",
  options: {
    maxWindowChars?: number
    overlapChars?: number
    metadata?: Record<string, any>
  } = {}
): DocumentChunk[] {
  const {
    maxWindowChars = DEFAULT_WINDOW_CHARS,
    overlapChars = DEFAULT_OVERLAP_CHARS,
    metadata = {},
  } = options

  const normalized = normalizeDocumentText(text)
  if (!normalized) return []

  const lines = normalized.split("\n")
  const chunks: DocumentChunk[] = []
  let currentSection = "general"
  let sectionLines: string[] = []
  let chunkIndex = 0

  const flushSection = () => {
    const sectionText = sectionLines.join(" ").trim()
    if (!sectionText) return

    const windows = splitIntoWindows(sectionText, maxWindowChars, overlapChars)
    for (const w of windows) {
      chunks.push({
        chunkId: `${documentId}-${currentSection}-${chunkIndex++}`,
        documentId,
        section: currentSection,
        text: w.text,
        startChar: w.start,
        endChar: w.end,
        tokenEstimate: Math.ceil(w.text.length / 4),
        metadata: {
          ...metadata,
          documentId,
          section: currentSection,
          chunkIndex: chunkIndex - 1,
        },
      })
    }
    sectionLines = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    const headerMatch = detectSectionHeader(line)
    if (headerMatch) {
      flushSection()
      currentSection = headerMatch
      continue
    }

    sectionLines.push(line)
  }

  flushSection()

  // Fallback if no sections were flushed
  if (chunks.length === 0) {
    chunks.push({
      chunkId: `${documentId}-general-0`,
      documentId,
      section: "general",
      text: normalized.slice(0, maxWindowChars),
      startChar: 0,
      endChar: Math.min(normalized.length, maxWindowChars),
      tokenEstimate: Math.ceil(Math.min(normalized.length, maxWindowChars) / 4),
      metadata: {
        ...metadata,
        documentId,
        section: "general",
        chunkIndex: 0,
      },
    })
  }

  return chunks
}

function detectSectionHeader(line: string): string | null {
  if (line.length > 50) return null
  const cleaned = line
    .toLowerCase()
    .replace(/[:\-–•|#*_]/g, "")
    .trim()

  for (const header of CANONICAL_SECTIONS) {
    if (cleaned === header || cleaned.startsWith(header + " ") || cleaned.endsWith(" " + header)) {
      // Map to canonical root
      if (header.includes("experience") || header.includes("employment")) return "experience"
      if (header.includes("skill") || header.includes("competencies")) return "skills"
      if (header.includes("summary") || header.includes("objective")) return "summary"
      if (header.includes("project")) return "projects"
      if (header.includes("education")) return "education"
      if (header.includes("certification") || header.includes("licenses")) return "certifications"
      return header
    }
  }

  return null
}

interface TextWindow {
  text: string
  start: number
  end: number
}

function splitIntoWindows(text: string, maxLen: number, overlap: number): TextWindow[] {
  if (text.length <= maxLen) {
    return [{ text, start: 0, end: text.length }]
  }

  const windows: TextWindow[] = []
  let start = 0

  while (start < text.length) {
    let end = start + maxLen
    if (end < text.length) {
      // Look for a clean sentence or word break near the end
      const sentenceBreak = text.lastIndexOf(". ", end)
      if (sentenceBreak > start + maxLen * 0.6) {
        end = sentenceBreak + 1
      } else {
        const spaceBreak = text.lastIndexOf(" ", end)
        if (spaceBreak > start + maxLen * 0.6) {
          end = spaceBreak
        }
      }
    } else {
      end = text.length
    }

    const windowText = text.slice(start, end).trim()
    if (windowText.length > 0) {
      windows.push({ text: windowText, start, end })
    }

    start = end - overlap
    if (start >= text.length - overlap) break
  }

  return windows
}

