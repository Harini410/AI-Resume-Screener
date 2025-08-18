import { type NextRequest, NextResponse } from "next/server"
import { extractSkills, findMissingSkills, findMatchingSkills } from "@/utils/text-analysis"
import { calculateEnhancedSimilarity } from "@/utils/embeddings"

export async function POST(request: NextRequest) {
  try {
    const { resumeText, jobDescription, fileName, jobDescriptionName } = await request.json()

    if (!resumeText || !jobDescription) {
      return NextResponse.json({ error: "Resume text and job description are required" }, { status: 400 })
    }

    // Extract skills from both texts
    const resumeSkills = extractSkills(resumeText)
    const jobSkills = extractSkills(jobDescription)

    // Calculate enhanced similarity scores
    const { semanticScore, keywordScore, combinedScore } = await calculateEnhancedSimilarity(
      resumeText,
      jobDescription,
      resumeSkills,
      jobSkills,
    )

    // Find matching and missing skills
    const matchingSkills = findMatchingSkills(resumeSkills, jobSkills)
    const missingSkills = findMissingSkills(resumeSkills, jobSkills)

    // Prepare response
    const analysisResult = {
      matchScore: combinedScore,
      semanticScore,
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
        skillMatchPercentage: jobSkills.length > 0 ? Math.round((matchingSkills.length / jobSkills.length) * 100) : 0,
      },
      aggregatedStats: {
        scoreDistribution: [
          { scoreRange: "0-20%", count: combinedScore >= 0 && combinedScore < 20 ? 1 : 0 },
          { scoreRange: "20-40%", count: combinedScore >= 20 && combinedScore < 40 ? 1 : 0 },
          { scoreRange: "40-60%", count: combinedScore >= 40 && combinedScore < 60 ? 1 : 0 },
          { scoreRange: "60-80%", count: combinedScore >= 60 && combinedScore < 80 ? 1 : 0 },
          { scoreRange: "80-100%", count: combinedScore >= 80 && combinedScore <= 100 ? 1 : 0 },
        ],
        skillsFrequency: resumeSkills.map((skill) => ({ skill, count: 1 })),
        qualityDistribution: {
          excellent: combinedScore >= 80 ? 1 : 0,
          good: combinedScore >= 60 && combinedScore < 80 ? 1 : 0,
          fair: combinedScore >= 40 && combinedScore < 60 ? 1 : 0,
          poor: combinedScore < 40 ? 1 : 0,
        },
        scoreComparison: {
          overall: combinedScore,
          semantic: semanticScore,
          keyword: keywordScore,
        },
      },
    }

    return NextResponse.json(analysisResult)
  } catch (error) {
    console.error("Analysis API error:", error)
    return NextResponse.json({ error: "Failed to analyze resume. Please try again." }, { status: 500 })
  }
}
