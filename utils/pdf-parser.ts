import * as pdfjsLib from "pdfjs-dist"

try {
  // Primary: Use bundled worker with import.meta.url
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.js", import.meta.url).toString()
} catch (error) {
  console.warn("[v0] Primary worker setup failed, trying fallback:", error)
  try {
    // Fallback 1: Use CDN with different URL
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.js"
  } catch (fallbackError) {
    console.warn("[v0] CDN fallback failed:", fallbackError)
    // Fallback 2: Use local path (if available)
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js"
  }
}

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log("[v0] Starting PDF text extraction for:", file.name)
    const arrayBuffer = await file.arrayBuffer()
    console.log("[v0] File loaded, size:", arrayBuffer.byteLength, "bytes")

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    console.log("[v0] PDF loaded successfully, pages:", pdf.numPages)

    let fullText = ""

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()

        const pageText = textContent.items.map((item: any) => item.str).join(" ")
        fullText += pageText + "\n"

        console.log("[v0] Extracted text from page", pageNum, "- length:", pageText.length)
      } catch (pageError) {
        console.warn("[v0] Failed to extract text from page", pageNum, ":", pageError)
        // Continue with other pages even if one fails
      }
    }

    const finalText = fullText.trim()
    console.log("[v0] Total extracted text length:", finalText.length)

    if (!finalText || finalText.length < 50) {
      throw new Error(
        "PDF appears to be empty or contains mostly images. Please ensure your PDF contains selectable text.",
      )
    }

    return finalText
  } catch (error) {
    console.error("[v0] Error extracting text from PDF:", error)

    if (error instanceof Error) {
      if (error.message.includes("Invalid PDF")) {
        throw new Error("The uploaded file is not a valid PDF. Please check the file and try again.")
      }
      if (error.message.includes("Password")) {
        throw new Error("This PDF is password protected. Please upload an unprotected PDF.")
      }
      if (error.message.includes("worker")) {
        throw new Error(
          "PDF processing failed due to browser compatibility. Please try refreshing the page or use a different browser.",
        )
      }
      if (error.message.includes("selectable text")) {
        throw error // Re-throw our custom message
      }
    }

    throw new Error(
      "Failed to extract text from PDF. Please ensure the file is a valid, text-based PDF (not a scanned image).",
    )
  }
}

export function validatePDFFile(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: "No file selected" }
  }

  if (file.type !== "application/pdf") {
    return { isValid: false, error: "File must be a PDF (.pdf extension required)" }
  }

  if (file.size > 10 * 1024 * 1024) {
    return {
      isValid: false,
      error: "File size must be less than 10MB. Please compress your PDF or remove unnecessary pages.",
    }
  }

  if (file.size < 1024) {
    return { isValid: false, error: "File appears to be too small to be a valid PDF resume." }
  }

  return { isValid: true }
}
