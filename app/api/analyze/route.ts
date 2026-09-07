import { type NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { extractSkills, findMissingSkills, findMatchingSkills } from "@/utils/text-analysis"
import { runMultiAgentScreening } from "@/lib/agents/orchestrator"
import { ModelAPIError, ModelTimeoutError } from "@/lib/model-provider"
import { InvalidJobDescriptionError } from "@/lib/agents/requirement-agent"
import { calculateCosineSimilarity, generateBatchEmbeddings } from "@/lib/embeddings"
import { AnalysisRequestSchema } from "@/lib/schemas"

const MAX_TEXT_LENGTH = 30000

export async function POST(request: NextRequest) {
  const requestId = randomUUID()
  const startedAt = Date.now()

  // 1. JSON Parse Validation
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Malformed request: Body must be valid JSON", requestId },
      { status: 400 }
    )
  }

  // 2. Schema Validation via Zod
  const parseResult = AnalysisRequestSchema.safeParse(body)
  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ")

    return NextResponse.json(
      { error: `Validation failed: ${errorDetails}`, requestId },
      { status: 400 }
    )
  }

  const { resumeText, jobDescription, fileName, jobDescriptionName } = parseResult.data

  // 3. Explicit Empty and Length Bounds Check
  const trimmedResume = resumeText.trim()
  const trimmedJD = jobDescription.trim()

  if (trimmedResume.length === 0 || trimmedJD.length === 0) {
    return NextResponse.json(
      { error: "Resume text and job description cannot be empty.", requestId },
      { status: 400 }
    )
  }

  if (trimmedResume.length > MAX_TEXT_LENGTH || trimmedJD.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      {
        error: `Payload too large: Maximum character length is ${MAX_TEXT_LENGTH}.`,
        requestId,
      },
      { status: 413 }
    )
  }

  // 4. Deterministic Keyword Layer (fast lexical alignment)
  const resumeSkills = extractSkills(trimmedResume)
  const jobSkills = extractSkills(trimmedJD)
  const matchingSkills = findMatchingSkills(resumeSkills, jobSkills)
  const missingSkills = findMissingSkills(resumeSkills, jobSkills)
  const keywordScore =
    jobSkills.length > 0 ? Math.round((matchingSkills.length / jobSkills.length) * 100) : 0

  // 5. Server-Side Embeddings Document-Level Semantic Score
  let semanticScore: number | null = null
  try {
    const [resumeEmbedding, jobEmbedding] = await generateBatchEmbeddings([
      trimmedResume,
      trimmedJD,
    ])
    const similarity = calculateCosineSimilarity(resumeEmbedding, jobEmbedding)
    semanticScore = Math.max(0, Math.min(100, Math.round(((similarity + 1) / 2) * 100)))
  } catch (error) {
    console.error(`[analyze:${requestId}] Document embedding calculation failed:`, error)
  }

  // 6. Execute Production Multi-Agent RAG Pipeline
  try {
    const { report, logs, observability } = await runMultiAgentScreening(
      requestId,
      trimmedResume,
      trimmedJD
    )

    console.log(
      `[analyze:${requestId}] completed in ${Date.now() - startedAt}ms, ` +
        `score=${report.overallMatchScore}, requirements=${report.requirementResults.length}`
    )

    return NextResponse.json({
      requestId,
      matchScore: report.overallMatchScore,
      semanticScore: semanticScore ?? 0,
      semanticScoreAvailable: semanticScore !== null,
      keywordScore,
      resumeSkills,
      jobSkills,
      matchingSkills,
      missingSkills,
      fileName: fileName || "Unknown Resume",
      jobDescriptionName: jobDescriptionName || "Unknown Job",
      skillsAnalysis: {
        totalResumeSkills: resumeSkills.length,
        totalJobSkills: jobSkills.length,
        matchingSkillsCount: matchingSkills.length,
        missingSkillsCount: missingSkills.length,
        skillMatchPercentage:
          jobSkills.length > 0 ? Math.round((matchingSkills.length / jobSkills.length) * 100) : 0,
      },
      screeningReport: report,
      observability,
      _stageLogs: logs,
    })
  } catch (error) {
    console.error(`[analyze:${requestId}] Pipeline failure:`, error)

    if (error instanceof InvalidJobDescriptionError) {
      return NextResponse.json(
        {
          error: "Unprocessable job description: Unable to extract actionable requirements.",
          requestId,
        },
        { status: 422 }
      )
    }

    if (error instanceof ModelTimeoutError) {
      return NextResponse.json(
        {
          error: "Gateway timeout: The AI multi-agent pipeline exceeded the execution deadline.",
          requestId,
        },
        { status: 504 }
      )
    }

    if (error instanceof ModelAPIError) {
      return NextResponse.json(
        {
          error: `Inference service error: ${error.message}`,
          requestId,
        },
        { status: 502 }
      )
    }

    return NextResponse.json(
      {
        error: "An unexpected error occurred during multi-agent resume screening.",
        requestId,
      },
      { status: 500 }
    )
  }
}

