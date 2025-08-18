"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Brain,
  Sparkles,
  FolderOpen,
} from "lucide-react"
import Navigation from "@/components/navigation"
import { getResumeFiles, getJobDescriptionFiles, type ResumeFile, type JobDescriptionFile } from "@/utils/file-reader"

interface AnalysisResult {
  matchScore: number
  semanticScore: number
  keywordScore: number
  resumeSkills: string[]
  jobSkills: string[]
  matchingSkills: string[]
  missingSkills: string[]
  skillsAnalysis: {
    totalResumeSkills: number
    totalJobSkills: number
    matchingSkillsCount: number
    missingSkillsCount: number
    skillMatchPercentage: number
  }
}

const CircularGauge = ({
  value,
  size = 120,
  strokeWidth = 8,
  color = "hsl(var(--primary))",
}: { value: number; size?: number; strokeWidth?: number; color?: string }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{value}%</span>
      </div>
    </div>
  )
}

export default function AnalyzePage() {
  const [selectedResumeId, setSelectedResumeId] = useState<string>("")
  const [selectedJobId, setSelectedJobId] = useState<string>("")
  const [resumeFiles, setResumeFiles] = useState<ResumeFile[]>([])
  const [jobFiles, setJobFiles] = useState<JobDescriptionFile[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [extractionProgress, setExtractionProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadFiles = async () => {
      try {
        setIsLoading(true)
        const [resumes, jobs] = await Promise.all([getResumeFiles(), getJobDescriptionFiles()])
        setResumeFiles(resumes)
        setJobFiles(jobs)

        // Auto-select first files for convenience
        if (resumes.length > 0) setSelectedResumeId(resumes[0].id)
        if (jobs.length > 0) setSelectedJobId(jobs[0].id)
      } catch (err) {
        setError("Failed to load files from data directories")
      } finally {
        setIsLoading(false)
      }
    }

    loadFiles()
  }, [])

  const handleAnalyze = async () => {
    if (!selectedResumeId || !selectedJobId) return

    const selectedResume = resumeFiles.find((r) => r.id === selectedResumeId)
    const selectedJob = jobFiles.find((j) => j.id === selectedJobId)

    if (!selectedResume || !selectedJob) return

    setIsAnalyzing(true)
    setError(null)
    setExtractionProgress(0)

    try {
      setExtractionProgress(20)

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText: selectedResume.content,
          jobDescription: selectedJob.content,
        }),
      })

      setExtractionProgress(80)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Analysis failed")
      }

      const result: AnalysisResult = await response.json()
      setAnalysisResult(result)

      setExtractionProgress(100)

      const savedResults = JSON.parse(localStorage.getItem("resumeAnalyses") || "[]")
      savedResults.push({
        ...result,
        resumeText: selectedResume.content,
        fileName: selectedResume.name,
        jobDescription: selectedJob.name,
        uploadDate: new Date().toISOString(),
        id: Date.now(),
      })
      localStorage.setItem("resumeAnalyses", JSON.stringify(savedResults))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed")
    } finally {
      setIsAnalyzing(false)
      setExtractionProgress(0)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading resume and job description files...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
              AI Resume Analysis
            </h1>
            <p className="text-muted-foreground text-lg">
              Select resume and job description files to get AI-powered semantic matching insights
            </p>
          </div>

          {error && (
            <Alert className="mb-6" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <Card className="border-2 border-primary/10 hover:border-primary/20 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FolderOpen className="h-5 w-5 text-primary" />
                  <span>Select Resume</span>
                </CardTitle>
                <CardDescription>Choose from available resume files in /data/resumes/</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="resume-select">Resume File</Label>
                    <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a resume file" />
                      </SelectTrigger>
                      <SelectContent>
                        {resumeFiles.map((resume) => (
                          <SelectItem key={resume.id} value={resume.id}>
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4" />
                              <span>{resume.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedResumeId && (
                    <div className="flex items-center space-x-2 text-sm text-green-600 animate-in slide-in-from-left duration-300">
                      <CheckCircle className="h-4 w-4" />
                      <span>Resume file selected</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-accent/10 hover:border-accent/20 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FolderOpen className="h-5 w-5 text-accent" />
                  <span>Select Job Description</span>
                </CardTitle>
                <CardDescription>Choose from available job description files in /data/jds/</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="job-select">Job Description File</Label>
                    <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a job description file" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobFiles.map((job) => (
                          <SelectItem key={job.id} value={job.id}>
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4" />
                              <span>{job.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedJobId && (
                    <div className="flex items-center space-x-2 text-sm text-green-600 animate-in slide-in-from-left duration-300">
                      <CheckCircle className="h-4 w-4" />
                      <span>Job description file selected</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {isAnalyzing && (
            <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 animate-pulse text-primary" />
                    <span className="text-sm font-medium">AI Analysis in progress...</span>
                    <Sparkles className="h-4 w-4 animate-pulse text-accent" />
                  </div>
                  <Progress value={extractionProgress} className="w-full h-3" />
                  <p className="text-xs text-muted-foreground">
                    {extractionProgress < 20 && "Starting analysis..."}
                    {extractionProgress >= 20 && extractionProgress < 40 && "Processing selected files..."}
                    {extractionProgress >= 40 && extractionProgress < 80 && "Running AI semantic analysis..."}
                    {extractionProgress >= 80 && extractionProgress < 100 && "Finalizing results..."}
                    {extractionProgress === 100 && "Analysis complete!"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mb-8 text-center">
            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={!selectedResumeId || !selectedJobId || isAnalyzing}
              className="min-w-[200px] bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  AI Analyze Resume
                </>
              )}
            </Button>
          </div>

          {analysisResult && (
            <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="text-center border-2 border-primary/20 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-center space-x-2 text-sm">
                      <TrendingUp className="h-4 w-4" />
                      <span>Overall Match</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center space-y-4">
                      <CircularGauge value={analysisResult.matchScore} color="hsl(var(--primary))" />
                      <p className="text-xs text-muted-foreground">Combined AI + Keyword Score</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="text-center border-2 border-accent/20 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-center space-x-2 text-sm">
                      <Brain className="h-4 w-4" />
                      <span>AI Semantic</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center space-y-4">
                      <CircularGauge value={analysisResult.semanticScore} color="hsl(var(--accent))" />
                      <p className="text-xs text-muted-foreground">Context Understanding</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="text-center border-2 border-primary/20 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-center space-x-2 text-sm">
                      <FileText className="h-4 w-4" />
                      <span>Keyword Match</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center space-y-4">
                      <CircularGauge value={analysisResult.keywordScore} color="hsl(var(--primary))" />
                      <p className="text-xs text-muted-foreground">Skills Alignment</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-2 border-green-200 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>✅ Strengths ({analysisResult.matchingSkills.length})</span>
                    </CardTitle>
                    <CardDescription>Skills found in both resume and job description</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.matchingSkills.length > 0 ? (
                        analysisResult.matchingSkills.map((skill, index) => (
                          <Badge
                            key={skill}
                            variant="default"
                            className="bg-green-100 text-green-800 hover:bg-green-200 transition-colors duration-200 animate-in slide-in-from-left"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            ✅ {skill}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm">No matching skills found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-red-200 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-red-600">
                      <TrendingDown className="h-5 w-5" />
                      <span>❌ Missing Skills ({analysisResult.missingSkills.length})</span>
                    </CardTitle>
                    <CardDescription>Skills required by job but not found in resume</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.missingSkills.length > 0 ? (
                        analysisResult.missingSkills.map((skill, index) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="bg-red-100 text-red-800 hover:bg-red-200 transition-colors duration-200 animate-in slide-in-from-right"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            ❌ {skill}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm">All required skills found!</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-2 border-primary/20 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle>Skills Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Resume Skills ({analysisResult.resumeSkills.length})</h4>
                      <div className="flex flex-wrap gap-1">
                        {analysisResult.resumeSkills.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Job Requirements ({analysisResult.jobSkills.length})</h4>
                      <div className="flex flex-wrap gap-1">
                        {analysisResult.jobSkills.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
