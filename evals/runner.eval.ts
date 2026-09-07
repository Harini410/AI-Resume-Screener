import { describe, it, expect, beforeAll } from "vitest"
import fs from "fs"
import path from "path"
import { runMultiAgentScreening } from "../lib/agents/orchestrator"
import { auditGrounding } from "../lib/agents/grounding-agent"
import { calculateFinalScore } from "../lib/agents/scoring-agent"
import { extractRequirements } from "../lib/agents/requirement-agent"
import { processDocument } from "../lib/document-processor"
import { LocalVectorStore } from "../lib/vector-store"
import { generateBatchEmbeddings } from "../lib/embeddings"
import { retrieveEvidence } from "../lib/agents/evidence-agent"
import type { RequirementVerdict } from "../lib/schemas"

interface EvalDataset {
  id: string
  name: string
  scenario: string
  description: string
  jobDescription: string
  resumeText: string
  expected: {
    minScore?: number
    maxScore?: number
    expectedDominantStatus?: string
    requiredSkills?: string[]
  }
}

interface MetricSummary {
  totalScenarios: number
  totalRequirementsExtracted: number
  totalRetrievals: number
  totalCitationsEvaluated: number
  totalVerifiedCitations: number
  totalHallucinationsRejected: number
  averagePipelineLatencyMs: number
  scoreDeterminismVariance: number
  groundingAccuracyRate: number
}

describe("RAG & Multi-Agent Evaluation Suite", () => {
  const datasetDir = path.join(__dirname, "datasets")
  const datasetFiles = fs.readdirSync(datasetDir).filter((f) => f.endsWith(".json"))

  const loadedDatasets: EvalDataset[] = datasetFiles.map((file) => {
    const raw = fs.readFileSync(path.join(datasetDir, file), "utf-8")
    return JSON.parse(raw) as EvalDataset
  })

  beforeAll(() => {
    console.log(`\n======================================================`)
    console.log(`🎯 LAUNCHING AI RESUME SCREENER EVALUATION BENCHMARK`)
    console.log(`Found ${loadedDatasets.length} evaluation scenarios across datasets`)
    console.log(`======================================================\n`)
  })

  it("evaluates all 10 scenarios across the end-to-end pipeline", async () => {
    expect(loadedDatasets.length).toBe(10)

    const summary: MetricSummary = {
      totalScenarios: loadedDatasets.length,
      totalRequirementsExtracted: 0,
      totalRetrievals: 0,
      totalCitationsEvaluated: 0,
      totalVerifiedCitations: 0,
      totalHallucinationsRejected: 0,
      averagePipelineLatencyMs: 0,
      scoreDeterminismVariance: 0,
      groundingAccuracyRate: 1.0,
    }

    let totalDuration = 0
    const scenarioResults: Array<{
      id: string
      name: string
      scenario: string
      requirements: number
      score: number
      verdicts: { matched: number; partial: number; gap: number; insufficient: number }
      durationMs: number
    }> = []

    for (const data of loadedDatasets) {
      const startTime = Date.now()
      const { report, observability } = await runMultiAgentScreening(
        `eval-${data.id}`,
        data.resumeText,
        data.jobDescription
      )
      const durationMs = Date.now() - startTime
      totalDuration += durationMs

      summary.totalRequirementsExtracted += report.requirementResults.length
      summary.totalRetrievals += observability.retrievalCount

      const counts = {
        matched: report.matchedCount,
        partial: report.partialCount,
        gap: report.gapCount,
        insufficient: report.insufficientEvidenceCount,
      }

      scenarioResults.push({
        id: data.id,
        name: data.name,
        scenario: data.scenario,
        requirements: report.requirementResults.length,
        score: report.overallMatchScore,
        verdicts: counts,
        durationMs,
      })

      // Assertion 1: Requirements must be extracted and non-empty
      expect(report.requirementResults.length).toBeGreaterThanOrEqual(1)

      // Assertion 2: Score must fall within sensible bounds [0, 100]
      expect(report.overallMatchScore).toBeGreaterThanOrEqual(0)
      expect(report.overallMatchScore).toBeLessThanOrEqual(100)

      // Assertion 3: Scenario-specific sanity checks
      if (data.scenario === "strong_match") {
        expect(report.overallMatchScore).toBeGreaterThan(60)
        expect(report.matchedCount).toBeGreaterThan(0)
      } else if (data.scenario === "weak_match") {
        expect(report.overallMatchScore).toBeLessThan(45)
        expect(report.insufficientEvidenceCount + report.gapCount).toBeGreaterThan(0)
      } else if (data.scenario === "insufficient_evidence") {
        expect(report.insufficientEvidenceCount).toBeGreaterThan(0)
      } else if (data.scenario === "short_resume") {
        expect(report.overallMatchScore).toBeGreaterThan(50)
      }

      // Assertion 4: Observability metrics must be populated
      expect(observability.stages.length).toBeGreaterThanOrEqual(5)
      expect(observability.stageDurations.totalMs).toBeGreaterThan(0)
    }

    summary.averagePipelineLatencyMs = Math.round(totalDuration / loadedDatasets.length)

    // Print Formatted Evaluation Matrix
    console.log("\n📊 EVALUATION RUNNER BENCHMARK RESULTS MATRIX:")
    console.table(
      scenarioResults.map((r) => ({
        Scenario: r.id,
        Name: r.name.slice(0, 25),
        Type: r.scenario,
        Reqs: r.requirements,
        Score: `${r.score}%`,
        Matched: r.verdicts.matched,
        Partial: r.verdicts.partial,
        Gap: r.verdicts.gap,
        "No Evid": r.verdicts.insufficient,
        "Time (ms)": r.durationMs,
      }))
    )

    console.log(`\n✅ Pipeline Metrics Summary:`)
    console.log(`- Scenarios Evaluated: ${summary.totalScenarios}`)
    console.log(`- Total Atomic Requirements Processed: ${summary.totalRequirementsExtracted}`)
    console.log(`- Average Pipeline Latency: ${summary.averagePipelineLatencyMs}ms`)
  }, 120000)

  describe("Subsystem Quality & Grounding Audits", () => {
    it("Requirement Agent decomposes atomic criteria without compound bundling", async () => {
      const noisyJd = `We need a full-stack engineer who knows React, TypeScript, GraphQL, AWS DynamoDB, Docker, and Kubernetes.`
      const reqs = await extractRequirements(noisyJd)
      expect(reqs.length).toBeGreaterThanOrEqual(3)

      for (const req of reqs) {
        expect(req.requirement.length).toBeGreaterThan(3)
        // Ensure no massive multi-and sentences were left intact
        const andCount = (req.requirement.match(/\band\b/gi) || []).length
        expect(andCount).toBeLessThanOrEqual(2)
      }
    })

    it("Evidence Agent retrieves relevant chunks above similarity threshold", async () => {
      const resume = `
        Experience
        Senior Python Engineer at DataCo (2020-2024):
        - Built asynchronous FastAPI web services with PostgreSQL backend.
        - Deployed microservices on AWS Elastic Kubernetes Service.

        Education
        BS Computer Science, Stanford University.
      `
      const chunks = processDocument(resume, "resume-test")
      const vectors = await generateBatchEmbeddings(chunks.map((c) => c.text))
      const store = new LocalVectorStore()
      await store.addDocuments(
        chunks.map((c, i) => ({
          id: c.chunkId,
          text: c.text,
          metadata: { chunkId: c.chunkId, documentId: "resume-test", section: c.section },
          vector: vectors[i],
        }))
      )

      const results = await retrieveEvidence(
        [{ id: "r1", requirement: "FastAPI web services development", category: "skill", importance: "required" }],
        store,
        { topK: 2, minScoreThreshold: 0.1 }
      )

      expect(results.length).toBe(1)
      expect(results[0].evidence.length).toBeGreaterThan(0)
      expect(results[0].evidence[0].text.toLowerCase()).toContain("fastapi")
    })

    it("Grounding Agent catches and penalizes synthetic hallucinated citations", () => {
      const retrievedEvidence = [
        {
          requirementId: "req-1",
          evidence: [
            {
              chunkId: "c1",
              text: "Engineered scalable data ingestion pipelines using Apache Spark and Python.",
            },
          ],
        },
      ]

      const hallucinatedVerdict: RequirementVerdict[] = [
        {
          requirementId: "req-1",
          requirement: "Apache Spark streaming",
          category: "skill",
          importance: "required",
          status: "matched",
          confidence: "high",
          explanation: "Candidate claims extensive Spark streaming experience.",
          evidence: [
            {
              chunkId: "c1",
              section: "experience",
              quote: "Engineered scalable data ingestion pipelines using Apache Spark", // Grounded
              score: 0.9,
            },
            {
              chunkId: "c1",
              section: "experience",
              quote: "Invented new quantum streaming architecture at Google DeepMind", // Synthetic hallucination!
              score: 0.1,
            },
          ],
        },
      ]

      const audit = auditGrounding(hallucinatedVerdict, retrievedEvidence)

      expect(audit.totalCitations).toBe(2)
      expect(audit.verifiedCitations).toBe(1)
      expect(audit.rejectedCitations).toBe(1)
      expect(audit.groundingRatio).toBe(0.5)

      // Verified that confidence was downgraded and hallucination warning appended
      const auditedVerdict = audit.verdicts[0]
      expect(auditedVerdict.confidence).toBe("low")
      expect(auditedVerdict.evidence.length).toBe(1)
      expect(auditedVerdict.evidence[0].quote).toContain("Apache Spark")
      expect(auditedVerdict.explanation).toContain("[Judge: Hallucinated or ungrounded citations were removed.]")
    })

    it("Grounding Agent downgrades matched status to insufficient_evidence when all citations are ungrounded", () => {
      const retrievedEvidence = [
        {
          requirementId: "req-2",
          evidence: [
            {
              chunkId: "c2",
              text: "Designed customer logos and marketing flyers in Adobe Photoshop.",
            },
          ],
        },
      ]

      const completelyHallucinated: RequirementVerdict[] = [
        {
          requirementId: "req-2",
          requirement: "Kubernetes cluster administration",
          category: "skill",
          importance: "required",
          status: "matched",
          confidence: "high",
          explanation: "Candidate claims to manage production Kubernetes clusters.",
          evidence: [
            {
              chunkId: "c2",
              section: "experience",
              quote: "Managed 50-node Kubernetes cluster with automated zero-downtime failover", // Completely hallucinated!
              score: 0.2,
            },
          ],
        },
      ]

      const audit = auditGrounding(completelyHallucinated, retrievedEvidence)
      expect(audit.rejectedCitations).toBe(1)
      expect(audit.verdicts[0].status).toBe("insufficient_evidence")
      expect(audit.verdicts[0].confidence).toBe("low")
      expect(audit.verdicts[0].evidence.length).toBe(0)
    })

    it("Scoring Agent is 100% deterministic with zero variance across identical inputs", () => {
      const sampleVerdicts: RequirementVerdict[] = [
        {
          requirementId: "r1",
          requirement: "React",
          category: "skill",
          importance: "required",
          status: "matched",
          confidence: "high",
          explanation: "Found React",
          evidence: [{ chunkId: "c1", section: "skills", quote: "React", score: 0.9 }],
        },
        {
          requirementId: "r2",
          requirement: "Go",
          category: "skill",
          importance: "required",
          status: "partial",
          confidence: "medium",
          explanation: "Found basic Go",
          evidence: [{ chunkId: "c2", section: "skills", quote: "Go", score: 0.6 }],
        },
        {
          requirementId: "r3",
          requirement: "Kubernetes",
          category: "skill",
          importance: "preferred",
          status: "gap",
          confidence: "high",
          explanation: "No K8s",
          evidence: [],
        },
      ]

      const runs = Array.from({ length: 20 }, () => calculateFinalScore(sampleVerdicts))
      const firstScore = runs[0].overallMatchScore

      for (const run of runs) {
        expect(run.overallMatchScore).toBe(firstScore)
        expect(run.matchedCount).toBe(1)
        expect(run.partialCount).toBe(1)
        expect(run.gapCount).toBe(1)
      }
    })
  })
})
