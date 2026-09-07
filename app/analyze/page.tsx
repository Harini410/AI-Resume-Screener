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
  ShieldCheck,
  Search,
  Layers,
  Clock,
  Quote,
  HelpCircle,
  XCircle,
  Activity,
} from "lucide-react"
import Navigation from "@/components/navigation"
import { getResumeFiles, getJobDescriptionFiles, type ResumeFile, type JobDescriptionFile } from "@/utils/file-reader"
import type { ScreeningReport, RequirementVerdict, ObservabilityReport } from "@/lib/schemas"

interface AnalysisResult {
  requestId: string
  matchScore: number
  semanticScore: number
  semanticScoreAvailable: boolean
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
  screeningReport?: ScreeningReport
  observability?: ObservabilityReport
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

const PIPELINE_STEPS = [
  { id: "req", label: "Requirement Extraction", desc: "Atomic decomposition of JD" },
  { id: "chunk", label: "Section Chunking", desc: "Structured parsing of resume" },
  { id: "embed", label: "Vector Indexing", desc: "Dense 384d semantic vectors" },
  { id: "rag", label: "RAG Retrieval", desc: "Requirement-specific vector search" },
  { id: "eval", label: "Evidence Evaluation", desc: "Grounded gap analysis" },
  { id: "judge", label: "Grounding Judge", desc: "Citation audit & hallucination check" },
  { id: "score", label: "Deterministic Scoring", desc: "Mathematical weighted aggregation" },
]

const PRESETS = [
  { label: "Full Stack (John Doe)", resumeId: "john_doe", jobId: "software_engineer" },
  { label: "Frontend React (Liam Smith)", resumeId: "candidate_001_liam_smith", jobId: "jd_001_frontend_engineer_react_next_js_1" },
  { label: "Data Science (Sarah Smith)", resumeId: "sarah_smith", jobId: "data_scientist" },
  { label: "Go Distributed (Emma Davis)", resumeId: "candidate_004_emma_davis", jobId: "jd_004_backend_engineer_go_distributed_systems_1" },
  { label: "DevOps & Cloud (Mia Perez)", resumeId: "candidate_010_mia_perez", jobId: "jd_010_devops_platform_engineer_aws_terraform_1" },
  { label: "Product Lead (Mike Johnson)", resumeId: "mike_johnson", jobId: "product_manager" },
]

export default function AnalyzePage() {
  const [selectedResumeId, setSelectedResumeId] = useState<string>("")
  const [selectedJobId, setSelectedJobId] = useState<string>("")
  const [resumeFiles, setResumeFiles] = useState<ResumeFile[]>([])
  const [jobFiles, setJobFiles] = useState<JobDescriptionFile[]>([])
  const [resumeFilter, setResumeFilter] = useState<string>("")
  const [jobFilter, setJobFilter] = useState<string>("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "matched" | "partial" | "gap" | "insufficient_evidence">("all")
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadFiles = async () => {
      try {
        setIsLoading(true)
        const [resumes, jobs] = await Promise.all([getResumeFiles(), getJobDescriptionFiles()])
        setResumeFiles(resumes)
        setJobFiles(jobs)

        if (resumes.length > 0) setSelectedResumeId(resumes[0].id)
        if (jobs.length > 0) setSelectedJobId(jobs[0].id)
      } catch (err) {
        setError("Failed to load files from data directory")
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
    setCurrentStepIndex(0)

    // Advance visual pipeline progress
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < PIPELINE_STEPS.length - 1 ? prev + 1 : prev))
    }, 1800)

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText: selectedResume.content,
          jobDescription: selectedJob.content,
          fileName: selectedResume.name,
          jobDescriptionName: selectedJob.name,
        }),
      })

      clearInterval(stepInterval)
      setCurrentStepIndex(PIPELINE_STEPS.length)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Analysis failed with HTTP status ${response.status}`)
      }

      const result: AnalysisResult = await response.json()
      setAnalysisResult(result)

      // Save to localStorage for dashboard compatibility
      try {
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
      } catch {
        // localStorage is optional
      }
    } catch (err) {
      clearInterval(stepInterval)
      setError(err instanceof Error ? err.message : "Analysis failed unexpectedly.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const verdicts = analysisResult?.screeningReport?.requirementResults || []
  const filteredVerdicts = verdicts.filter((v) => {
    if (activeTab === "all") return true
    return v.status === activeTab
  })

  const selectedResume = resumeFiles.find((r) => r.id === selectedResumeId)
  const selectedJob = jobFiles.find((j) => j.id === selectedJobId)

  const handleApplyPreset = (resumeId: string, jobId: string) => {
    setSelectedResumeId(resumeId)
    setSelectedJobId(jobId)
    setResumeFilter("")
    setJobFilter("")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto text-center py-20">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground font-medium">Loading canonical resume and job description profiles...</p>
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
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 px-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] sm:text-xs font-semibold mb-3 max-w-full text-center">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>Production RAG + Multi-Agent Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
              AI Resume Screener & Auditor
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-2xl mx-auto">
              Grounded, multi-agent evaluation powered by requirement decomposition, dense vector retrieval, and deterministic citation judge verification.
            </p>
          </div>

          {error && (
            <Alert className="mb-6 border-destructive/50 bg-destructive/10" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {/* Quick Match Presets Toolbar */}
          <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span>1-Click Match Scenarios:</span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Instantly load a pre-indexed candidate and matching job description
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => {
                const isActive = selectedResumeId === preset.resumeId && selectedJobId === preset.jobId
                return (
                  <Button
                    key={preset.label}
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleApplyPreset(preset.resumeId, preset.jobId)}
                    className={`h-7 text-xs px-2.5 rounded-lg transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                        : "bg-background/80 hover:bg-primary/10 border-border/70"
                    }`}
                  >
                    {preset.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Profile Selectors */}
          <div className="grid lg:grid-cols-2 gap-8 mb-6">
            <Card className="border-2 border-primary/10 hover:border-primary/20 transition-all duration-300 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FolderOpen className="h-5 w-5 text-primary" />
                  <span>Target Candidate Resume</span>
                </CardTitle>
                <CardDescription>
                  Select from candidate profiles across diverse engineering & tech domains
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search candidates by name, domain, or role..."
                      value={resumeFilter}
                      onChange={(e) => setResumeFilter(e.target.value)}
                      className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {resumeFilter && (
                      <button
                        type="button"
                        onClick={() => setResumeFilter("")}
                        className="absolute right-2.5 top-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="resume-select">Candidate Profile</Label>
                    <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a resume file" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80">
                        {resumeFiles
                          .filter((r) =>
                            !resumeFilter ||
                            r.name.toLowerCase().includes(resumeFilter.toLowerCase()) ||
                            (r.category && r.category.toLowerCase().includes(resumeFilter.toLowerCase()))
                          )
                          .map((resume) => (
                            <SelectItem key={resume.id} value={resume.id}>
                              <div className="flex items-center justify-between w-full pr-2 text-xs">
                                <div className="flex items-center space-x-2 truncate">
                                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <span className="truncate">{resume.name}</span>
                                </div>
                                {resume.category && (
                                  <Badge variant="outline" className="text-[10px] ml-2 shrink-0 py-0">
                                    {resume.category}
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedResumeId && (
                    <div className="flex items-center space-x-2 text-xs text-emerald-600 font-medium">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Canonical profile loaded</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-accent/10 hover:border-accent/20 transition-all duration-300 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FolderOpen className="h-5 w-5 text-accent" />
                  <span>Target Job Description</span>
                </CardTitle>
                <CardDescription>
                  Select from target job descriptions across diverse engineering & tech domains
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search jobs by title, company, or domain..."
                      value={jobFilter}
                      onChange={(e) => setJobFilter(e.target.value)}
                      className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    {jobFilter && (
                      <button
                        type="button"
                        onClick={() => setJobFilter("")}
                        className="absolute right-2.5 top-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="job-select">Job Posting</Label>
                    <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a job description" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80">
                        {jobFiles
                          .filter((j) =>
                            !jobFilter ||
                            j.name.toLowerCase().includes(jobFilter.toLowerCase()) ||
                            (j.category && j.category.toLowerCase().includes(jobFilter.toLowerCase()))
                          )
                          .map((job) => (
                            <SelectItem key={job.id} value={job.id}>
                              <div className="flex items-center justify-between w-full pr-2 text-xs">
                                <div className="flex items-center space-x-2 truncate">
                                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <span className="truncate">{job.name}</span>
                                </div>
                                {job.category && (
                                  <Badge variant="outline" className="text-[10px] ml-2 shrink-0 py-0">
                                    {job.category}
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedJobId && (
                    <div className="flex items-center space-x-2 text-xs text-emerald-600 font-medium">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Canonical job description loaded</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Candidate & Job Summary Badges */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {selectedResume && (
              <div className="p-4 rounded-xl border border-primary/20 bg-card/60 shadow-sm text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
                    <FileText className="h-4 w-4 text-primary" />
                    {selectedResume.name}
                  </span>
                  {selectedResume.category && (
                    <Badge variant="outline" className="text-[10px] py-0 border-primary/30 text-primary">
                      {selectedResume.category}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground line-clamp-2 leading-relaxed font-mono text-[11px] bg-muted/40 p-2 rounded-md">
                  {selectedResume.content.slice(0, 200).replace(/\n+/g, " ")}...
                </p>
              </div>
            )}

            {selectedJob && (
              <div className="p-4 rounded-xl border border-accent/20 bg-card/60 shadow-sm text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
                    <FileText className="h-4 w-4 text-accent" />
                    {selectedJob.name}
                  </span>
                  {selectedJob.category && (
                    <Badge variant="outline" className="text-[10px] py-0 border-accent/30 text-accent">
                      {selectedJob.category}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground line-clamp-2 leading-relaxed font-mono text-[11px] bg-muted/40 p-2 rounded-md">
                  {selectedJob.content.slice(0, 200).replace(/\n+/g, " ")}...
                </p>
              </div>
            )}
          </div>

          {/* Pipeline Active Progress Card */}
          {isAnalyzing && (
            <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 shadow-md">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-5 w-5 animate-pulse text-primary" />
                      <span className="text-sm font-semibold">Multi-Agent RAG Pipeline Executing...</span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      Stage {Math.min(currentStepIndex + 1, PIPELINE_STEPS.length)} of {PIPELINE_STEPS.length}
                    </span>
                  </div>

                  <Progress
                    value={Math.round(((currentStepIndex + 1) / PIPELINE_STEPS.length) * 100)}
                    className="w-full h-2.5"
                  />

                  {/* Stepper Dots */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
                    {PIPELINE_STEPS.map((step, idx) => {
                      const isPast = idx < currentStepIndex
                      const isCurrent = idx === currentStepIndex
                      return (
                        <div
                          key={step.id}
                          className={`p-2 rounded-lg border text-xs transition-all ${
                            isCurrent
                              ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                              : isPast
                                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700"
                                : "border-border text-muted-foreground opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            {isPast ? (
                              <CheckCircle className="h-3 w-3 text-emerald-600" />
                            ) : isCurrent ? (
                              <Loader2 className="h-3 w-3 animate-spin text-primary" />
                            ) : (
                              <span className="h-3 w-3 rounded-full border text-[9px] flex items-center justify-center">
                                {idx + 1}
                              </span>
                            )}
                            <span className="truncate">{step.label}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{step.desc}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Button */}
          <div className="mb-10 text-center">
            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={!selectedResumeId || !selectedJobId || isAnalyzing}
              className="min-w-[240px] h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Running Screening Pipeline...
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5 mr-2" />
                  Analyze with RAG + Multi-Agent
                </>
              )}
            </Button>
          </div>

          {/* Analysis Results */}
          {analysisResult && (
            <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
              {/* High-Level Score Gauges */}
              <div className="grid md:grid-cols-4 gap-6">
                <Card className="text-center border-2 border-primary/20 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-center space-x-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span>Grounded Match</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center space-y-2">
                      <CircularGauge value={analysisResult.matchScore} color="hsl(var(--primary))" />
                      <p className="text-xs text-muted-foreground font-medium">Deterministic Weighted Score</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="text-center border-2 border-accent/20 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-center space-x-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                      <Brain className="h-4 w-4 text-accent" />
                      <span>Dense Semantic</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center space-y-2">
                      <CircularGauge value={analysisResult.semanticScore} color="hsl(var(--accent))" />
                      <p className="text-xs text-muted-foreground font-medium">384d Vector Cosine Similarity</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="text-center border-2 border-border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-center space-x-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                      <FileText className="h-4 w-4 text-primary" />
                      <span>Lexical Keyword</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center space-y-2">
                      <CircularGauge value={analysisResult.keywordScore} color="hsl(var(--primary))" />
                      <p className="text-xs text-muted-foreground font-medium">Direct Technical Alignment</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Categorical Breakdown Summary */}
                <Card className="border-2 border-border shadow-sm flex flex-col justify-between">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-primary" />
                      <span>Verdict Counts</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-xs py-1 border-b">
                      <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                        <CheckCircle className="h-3.5 w-3.5" /> Matched
                      </span>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                        {analysisResult.screeningReport?.matchedCount ?? 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1 border-b">
                      <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                        <HelpCircle className="h-3.5 w-3.5" /> Partial
                      </span>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30">
                        {analysisResult.screeningReport?.partialCount ?? 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1 border-b">
                      <span className="flex items-center gap-1.5 text-rose-600 font-medium">
                        <XCircle className="h-3.5 w-3.5" /> Confirmed Gap
                      </span>
                      <Badge variant="outline" className="bg-rose-500/10 text-rose-700 border-rose-500/30">
                        {analysisResult.screeningReport?.gapCount ?? 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                        <Search className="h-3.5 w-3.5" /> Insufficient Evidence
                      </span>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/30">
                        {analysisResult.screeningReport?.insufficientEvidenceCount ?? 0}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Requirement-by-Requirement Grounded Breakdown */}
              <Card className="border-2 border-primary/20 shadow-md">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <span>Grounded Requirement Evaluation</span>
                      </CardTitle>
                      <CardDescription>
                        Every claim verified by the Grounding Judge against retrieved resume chunks
                      </CardDescription>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {(["all", "matched", "partial", "gap", "insufficient_evidence"] as const).map((tab) => {
                        const count =
                          tab === "all"
                            ? verdicts.length
                            : verdicts.filter((v) => v.status === tab).length
                        return (
                          <Button
                            key={tab}
                            size="sm"
                            variant={activeTab === tab ? "default" : "outline"}
                            onClick={() => setActiveTab(tab)}
                            className="text-xs h-8 capitalize"
                          >
                            {tab.replace("_", " ")} ({count})
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {filteredVerdicts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      No requirements match the selected &apos;{activeTab}&apos; filter.
                    </div>
                  ) : (
                    filteredVerdicts.map((verdict) => {
                      const statusColor =
                        verdict.status === "matched"
                          ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                          : verdict.status === "partial"
                            ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
                            : verdict.status === "gap"
                              ? "bg-rose-500/10 text-rose-700 border-rose-500/30"
                              : "bg-blue-500/10 text-blue-700 border-blue-500/30"

                      return (
                        <div
                          key={verdict.requirementId}
                          className="p-4 rounded-xl border bg-card hover:shadow-sm transition-all space-y-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="space-y-1 max-w-2xl">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                  {verdict.category || "Skill"}
                                </Badge>
                                {verdict.importance === "required" ? (
                                  <Badge variant="destructive" className="text-[10px] uppercase">
                                    Must-Have
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-[10px] uppercase">
                                    Preferred
                                  </Badge>
                                )}
                              </div>
                              <h4 className="text-base font-semibold leading-snug">{verdict.requirement}</h4>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`capitalize font-semibold text-xs px-2.5 py-1 ${statusColor}`}>
                                {verdict.status.replace("_", " ")}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px] capitalize font-mono">
                                {verdict.confidence} Confidence
                              </Badge>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground bg-muted/40 p-3 rounded-lg border">
                            {verdict.explanation}
                          </p>

                          {/* Grounded Citations Drawer */}
                          {verdict.evidence && verdict.evidence.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                                <Quote className="h-3 w-3 text-primary" /> Verified Citations from Source Resume:
                              </span>
                              <div className="grid gap-2">
                                {verdict.evidence.map((cit, idx) => (
                                  <div
                                    key={idx}
                                    className="text-xs bg-primary/5 border border-primary/15 rounded-md p-2.5 flex items-start justify-between gap-3 font-mono"
                                  >
                                    <div className="italic text-foreground/90">
                                      &ldquo;{cit.quote}&rdquo;
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                                      <Badge variant="outline" className="text-[10px]">
                                        Section: {cit.section}
                                      </Badge>
                                      <Badge variant="secondary" className="text-[10px]">
                                        Sim: {cit.score}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>

              {/* Observability Diagnostics Drawer */}
              {analysisResult.observability && (
                <Card className="border shadow-sm bg-muted/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-2 font-semibold">
                        <Activity className="h-4 w-4 text-primary" />
                        Pipeline Observability & Latency Telemetry
                      </span>
                      <span className="font-mono text-xs">ReqID: {analysisResult.requestId.slice(0, 8)}...</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
                      <div className="p-2.5 rounded-lg border bg-background">
                        <div className="text-[10px] text-muted-foreground uppercase font-mono">Model</div>
                        <div className="text-xs font-semibold truncate">{analysisResult.observability.model.split("/").pop()}</div>
                      </div>
                      <div className="p-2.5 rounded-lg border bg-background">
                        <div className="text-[10px] text-muted-foreground uppercase font-mono">Total Time</div>
                        <div className="text-xs font-semibold text-primary">{analysisResult.observability.totalMs}ms</div>
                      </div>
                      <div className="p-2.5 rounded-lg border bg-background">
                        <div className="text-[10px] text-muted-foreground uppercase font-mono">Doc Process</div>
                        <div className="text-xs font-mono">{analysisResult.observability.stageDurations["document-processingMs"] || 0}ms</div>
                      </div>
                      <div className="p-2.5 rounded-lg border bg-background">
                        <div className="text-[10px] text-muted-foreground uppercase font-mono">Req Extract</div>
                        <div className="text-xs font-mono">{analysisResult.observability.stageDurations["requirement-extractionMs"] || 0}ms</div>
                      </div>
                      <div className="p-2.5 rounded-lg border bg-background">
                        <div className="text-[10px] text-muted-foreground uppercase font-mono">RAG Search</div>
                        <div className="text-xs font-mono">{analysisResult.observability.stageDurations["evidence-retrievalMs"] || 0}ms</div>
                      </div>
                      <div className="p-2.5 rounded-lg border bg-background">
                        <div className="text-[10px] text-muted-foreground uppercase font-mono">Gap Eval</div>
                        <div className="text-xs font-mono">{analysisResult.observability.stageDurations["evidence-evaluationMs"] || 0}ms</div>
                      </div>
                      <div className="p-2.5 rounded-lg border bg-background">
                        <div className="text-[10px] text-muted-foreground uppercase font-mono">Judge Audit</div>
                        <div className="text-xs font-mono">{analysisResult.observability.stageDurations["grounding-validationMs"] || 0}ms</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Legacy Keyword Alignment (Strengths & Missing Skills) */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="border-2 border-emerald-500/20 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-emerald-600 text-base">
                      <CheckCircle className="h-5 w-5" />
                      <span>Extracted Strengths ({analysisResult.matchingSkills.length})</span>
                    </CardTitle>
                    <CardDescription>Direct technical keywords confirmed in both documents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.matchingSkills.length > 0 ? (
                        analysisResult.matchingSkills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="default"
                            className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                          >
                            ✓ {skill}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm">No direct matching skills found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-rose-500/20 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-rose-600 text-base">
                      <TrendingDown className="h-5 w-5" />
                      <span>Missing Keywords ({analysisResult.missingSkills.length})</span>
                    </CardTitle>
                    <CardDescription>Keywords mentioned in job description not found in resume</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.missingSkills.length > 0 ? (
                        analysisResult.missingSkills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/30"
                          >
                            ✗ {skill}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm">All required keywords found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

