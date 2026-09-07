import { z } from "zod"

// --- Requirement Schemas ---
export const StructuredRequirementSchema = z.object({
  id: z.string().min(1),
  requirement: z.string().min(1),
  category: z.enum(["skill", "experience", "education", "other"]).default("skill"),
  importance: z.enum(["required", "preferred"]).default("required"),
})

export const StructuredRequirementsSchema = z.object({
  requirements: z.array(StructuredRequirementSchema).min(1, "At least one requirement must be extracted from a valid job description."),
})

// --- Evidence & Retrieval Schemas ---
export const CitedEvidenceSchema = z.object({
  chunkId: z.string(),
  section: z.string(),
  quote: z.string(),
  score: z.number(),
})

export const RetrievalEvidenceItemSchema = z.object({
  chunkId: z.string(),
  documentId: z.string().optional().default("resume"),
  section: z.string(),
  text: z.string(),
  score: z.number(),
})

export const RetrievalResultSchema = z.object({
  requirementId: z.string(),
  requirement: z.string(),
  importance: z.enum(["required", "preferred"]).default("required"),
  evidence: z.array(RetrievalEvidenceItemSchema),
})

// --- Agent Evaluation & Gap Analysis Schemas ---
export const EvaluationStatusSchema = z.enum([
  "matched",
  "partial",
  "gap",
  "insufficient_evidence",
])

export const ConfidenceLevelSchema = z.enum(["low", "medium", "high"])

export const RawAgentEvaluationSchema = z.object({
  status: EvaluationStatusSchema,
  explanation: z.string().min(1),
  confidence: ConfidenceLevelSchema,
  citedQuotes: z.array(z.string()).default([]),
})

export const RequirementVerdictSchema = z.object({
  requirementId: z.string(),
  requirement: z.string(),
  category: z.enum(["skill", "experience", "education", "other"]).optional().default("skill"),
  importance: z.enum(["required", "preferred"]).optional().default("required"),
  status: EvaluationStatusSchema,
  evidence: z.array(CitedEvidenceSchema),
  explanation: z.string(),
  confidence: ConfidenceLevelSchema,
})

// --- Scoring & Observability Schemas ---
export const DeterministicScoreSchema = z.object({
  overallMatchScore: z.number().min(0).max(100),
  matchedCount: z.number().nonnegative(),
  partialCount: z.number().nonnegative(),
  gapCount: z.number().nonnegative(),
  insufficientEvidenceCount: z.number().nonnegative(),
})

export const StageMetricSchema = z.object({
  stage: z.string(),
  durationMs: z.number().nonnegative(),
  status: z.enum(["ok", "error"]),
  error: z.string().optional(),
})

export const ObservabilityReportSchema = z.object({
  requestId: z.string(),
  model: z.string(),
  requirementCount: z.number().nonnegative(),
  retrievalCount: z.number().nonnegative(),
  finalScore: z.number().min(0).max(100),
  status: z.enum(["completed", "failed", "degraded"]),
  stageDurations: z.record(z.string(), z.number()),
  totalMs: z.number().nonnegative(),
  stages: z.array(StageMetricSchema),
})

export const ScreeningReportSchema = z.object({
  requirementResults: z.array(RequirementVerdictSchema).min(1),
  overallMatchScore: z.number().min(0).max(100),
  matchedCount: z.number().nonnegative(),
  partialCount: z.number().nonnegative(),
  gapCount: z.number().nonnegative(),
  insufficientEvidenceCount: z.number().nonnegative(),
  observability: ObservabilityReportSchema.optional(),
})

// --- API Request Schema ---
export const AnalysisRequestSchema = z.object({
  resumeText: z.string().min(1, "Resume text cannot be empty").max(30000, "Resume text exceeds 30,000 characters limit"),
  jobDescription: z.string().min(1, "Job description cannot be empty").max(30000, "Job description exceeds 30,000 characters limit"),
  fileName: z.string().optional().default("Uploaded Resume"),
  jobDescriptionName: z.string().optional().default("Target Job Description"),
})

export type StructuredRequirement = z.infer<typeof StructuredRequirementSchema>
export type StructuredRequirements = z.infer<typeof StructuredRequirementsSchema>
export type CitedEvidence = z.infer<typeof CitedEvidenceSchema>
export type RetrievalEvidenceItem = z.infer<typeof RetrievalEvidenceItemSchema>
export type RetrievalResult = z.infer<typeof RetrievalResultSchema>
export type EvaluationStatus = z.infer<typeof EvaluationStatusSchema>
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>
export type RawAgentEvaluation = z.infer<typeof RawAgentEvaluationSchema>
export type RequirementVerdict = z.infer<typeof RequirementVerdictSchema>
export type DeterministicScore = z.infer<typeof DeterministicScoreSchema>
export type StageMetric = z.infer<typeof StageMetricSchema>
export type ObservabilityReport = z.infer<typeof ObservabilityReportSchema>
export type ScreeningReport = z.infer<typeof ScreeningReportSchema>
export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>

