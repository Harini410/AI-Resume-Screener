import { describe, it, expect } from "vitest"
import { chunkResume } from "./chunking"

describe("chunkResume", () => {
  it("tags chunks with the section header they appeared under", () => {
    const resume =
      "Summary\nBuilt things.\n\nExperience\nDid Python backend work for 3 years.\n\nEducation\nBS Computer Science."
    const chunks = chunkResume(resume)
    const sections = new Set(chunks.map((c) => c.section))
    expect(sections.has("experience")).toBe(true)
    expect(sections.has("education")).toBe(true)
  })

  it("never returns zero chunks for unstructured text", () => {
    const chunks = chunkResume("just one line of text with no headers at all")
    expect(chunks.length).toBeGreaterThan(0)
  })

  it("falls back to a single chunk for empty-ish input rather than throwing", () => {
    const chunks = chunkResume("   ")
    expect(chunks.length).toBeGreaterThan(0)
  })

  it("splits long sections into bounded windows", () => {
    const longParagraph = "word ".repeat(300) // ~1500 chars, over the 500-char window
    const resume = `Experience\n${longParagraph}`
    const chunks = chunkResume(resume)
    expect(chunks.length).toBeGreaterThan(1)
    for (const c of chunks) {
      expect(c.text.length).toBeLessThanOrEqual(520) // small slack for word-boundary splitting
    }
  })
})
