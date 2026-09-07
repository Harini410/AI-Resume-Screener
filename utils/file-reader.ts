import canonicalData from "@/data/canonical-dataset.json"

export interface ResumeFile {
  id: string
  name: string
  content: string
  filePath: string
  category?: string
}

export interface JobDescriptionFile {
  id: string
  name: string
  content: string
  filePath: string
  category?: string
}

// Canonical static registry populated from canonical-dataset.json
export const CANONICAL_RESUMES: Record<string, ResumeFile> = {}
for (const resume of (canonicalData.resumes as ResumeFile[])) {
  CANONICAL_RESUMES[resume.id] = resume
}

export const CANONICAL_JDS: Record<string, JobDescriptionFile> = {}
for (const jd of (canonicalData.jds as JobDescriptionFile[])) {
  CANONICAL_JDS[jd.id] = jd
}

async function fetchWithFallback(url: string, fallbackText: string): Promise<string> {
  if (typeof window === "undefined") {
    return fallbackText
  }
  try {
    const res = await fetch(url)
    if (!res.ok) return fallbackText
    const text = await res.text()
    // Guard against 404 HTML fallback page
    if (text.trim().startsWith("<") || text.length === 0) {
      return fallbackText
    }
    return text
  } catch {
    return fallbackText
  }
}

export async function getResumeFiles(): Promise<ResumeFile[]> {
  return canonicalData.resumes as ResumeFile[]
}

export async function getJobDescriptionFiles(): Promise<JobDescriptionFile[]> {
  return canonicalData.jds as JobDescriptionFile[]
}

export async function readResumeFile(filePath: string): Promise<string> {
  const match = (canonicalData.resumes as ResumeFile[]).find(
    (r) => r.filePath === filePath || r.id === filePath
  )
  if (match) return match.content
  return fetchWithFallback(filePath, "")
}

export async function readJobDescriptionFile(filePath: string): Promise<string> {
  const match = (canonicalData.jds as JobDescriptionFile[]).find(
    (j) => j.filePath === filePath || j.id === filePath
  )
  if (match) return match.content
  return fetchWithFallback(filePath, "")
}
