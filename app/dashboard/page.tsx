"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, FileText, TrendingUp, Brain, Download, Trash2, Sparkles } from "lucide-react"
import Navigation from "@/components/navigation"

interface SavedAnalysis {
  id: number
  fileName: string
  jobDescription?: string // Added job description field for file-based system
  uploadDate: string
  matchScore: number
  semanticScore: number
  keywordScore: number
  resumeSkills: string[]
  jobSkills: string[]
  matchingSkills: string[]
  missingSkills: string[]
  resumeText: string
  skillsAnalysis: {
    totalResumeSkills: number
    totalJobSkills: number
    matchingSkillsCount: number
    missingSkillsCount: number
    skillMatchPercentage: number
  }
}

export default function DashboardPage() {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const savedResults = JSON.parse(localStorage.getItem("resumeAnalyses") || "[]")
      console.log("[v0] Loaded analyses from localStorage:", savedResults.length, "items")
      setAnalyses(savedResults)
    } catch (error) {
      console.error("[v0] Error loading analyses from localStorage:", error)
      setAnalyses([])
    }
    setLoading(false)
  }, [])

  const deleteAnalysis = (id: number) => {
    const updatedAnalyses = analyses.filter((analysis) => analysis.id !== id)
    setAnalyses(updatedAnalyses)
    localStorage.setItem("resumeAnalyses", JSON.stringify(updatedAnalyses))
    console.log("[v0] Deleted analysis, remaining:", updatedAnalyses.length)
  }

  const exportToCSV = () => {
    const csvHeaders = [
      "File Name",
      "Job Description",
      "Upload Date",
      "Overall Score (%)",
      "AI Semantic Score (%)",
      "Keyword Score (%)",
      "Matching Skills Count",
      "Missing Skills Count",
      "Matching Skills",
      "Missing Skills",
    ]

    const csvData = analyses.map((analysis) => [
      analysis.fileName,
      analysis.jobDescription || "",
      new Date(analysis.uploadDate).toLocaleDateString(),
      analysis.matchScore,
      analysis.semanticScore,
      analysis.keywordScore,
      analysis.matchingSkills.length,
      analysis.missingSkills.length,
      analysis.matchingSkills.join("; "),
      analysis.missingSkills.join("; "),
    ])

    const csvContent = [csvHeaders, ...csvData].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "resume_analyses.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportData = () => {
    const dataStr = JSON.stringify(analyses, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = "resume_analyses.json"

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const totalResumes = analyses.length
  const averageScore =
    totalResumes > 0
      ? Math.round(analyses.reduce((acc, analysis) => acc + (analysis.matchScore || 0), 0) / totalResumes)
      : 0
  const topScore = totalResumes > 0 ? Math.max(...analyses.map((a) => a.matchScore || 0)) : 0
  const averageSemanticScore =
    totalResumes > 0
      ? Math.round(analyses.reduce((acc, analysis) => acc + (analysis.semanticScore || 0), 0) / totalResumes)
      : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-pulse">Loading dashboard...</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 text-sm text-muted-foreground">
            Showing data for {totalResumes} analyzed resume{totalResumes !== 1 ? "s" : ""}
          </div>

          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2 flex items-center">
                <BarChart3 className="h-8 w-8 text-primary mr-3" />
                Resume Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">Analytics and insights from all analyzed resumes</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="sm"
                className="hover:bg-primary/5 transition-colors duration-300 bg-transparent"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={exportData}
                variant="outline"
                size="sm"
                className="hover:bg-accent/5 transition-colors duration-300 bg-transparent"
              >
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </div>

          {totalResumes === 0 ? (
            <Card className="border-2 border-primary/10">
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No analyses yet</h3>
                <p className="text-muted-foreground mb-4">Upload and analyze your first resume to see insights here</p>
                <Button
                  asChild
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
                >
                  <a href="/analyze">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start Analyzing
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <Card className="border-2 border-primary/10 hover:border-primary/20 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
                    <FileText className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">{totalResumes}</div>
                    <p className="text-xs text-muted-foreground">Analyzed resumes</p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-accent/10 hover:border-accent/20 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                    <BarChart3 className="h-4 w-4 text-accent" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-accent">{averageScore}%</div>
                    <p className="text-xs text-muted-foreground">Overall match</p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary/10 hover:border-primary/20 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Score</CardTitle>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">{topScore}%</div>
                    <p className="text-xs text-muted-foreground">Best match</p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-accent/10 hover:border-accent/20 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">AI Semantic Avg</CardTitle>
                    <Brain className="h-4 w-4 text-accent" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-accent">{averageSemanticScore}%</div>
                    <p className="text-xs text-muted-foreground">AI understanding</p>
                  </CardContent>
                </Card>
              </div>

              {/* Resume List */}
              <Card className="border-2 border-primary/10 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle>Analyzed Resumes</CardTitle>
                  <CardDescription>Detailed view of all analyzed resumes with scores and insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyses.map((analysis) => (
                      <div key={analysis.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <h3 className="font-medium">{analysis.fileName}</h3>
                              {analysis.jobDescription && (
                                <p className="text-xs text-muted-foreground">vs {analysis.jobDescription}</p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                Analyzed {new Date(analysis.uploadDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={
                                analysis.matchScore >= 80
                                  ? "default"
                                  : analysis.matchScore >= 60
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="text-sm"
                            >
                              {analysis.matchScore}% Match
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAnalysis(analysis.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Score Breakdown */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground">Overall</div>
                            <div className="text-lg font-semibold">{analysis.matchScore}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground">AI Semantic</div>
                            <div className="text-lg font-semibold">{analysis.semanticScore}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground">Keyword</div>
                            <div className="text-lg font-semibold">{analysis.keywordScore}%</div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-green-600 mb-2">
                              Strengths ({analysis.matchingSkills.length})
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {analysis.matchingSkills.slice(0, 5).map((skill) => (
                                <Badge key={skill} variant="outline" className="text-xs bg-green-50">
                                  {skill}
                                </Badge>
                              ))}
                              {analysis.matchingSkills.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{analysis.matchingSkills.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-orange-600 mb-2">
                              Missing Skills ({analysis.missingSkills.length})
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {analysis.missingSkills.slice(0, 5).map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs bg-orange-50">
                                  {skill}
                                </Badge>
                              ))}
                              {analysis.missingSkills.length > 5 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{analysis.missingSkills.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
