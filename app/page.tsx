"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Navigation from "@/components/navigation"
import {
  Brain,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  BarChart3,
  ArrowRight,
  Database,
  Terminal,
  Zap,
  Quote,
  Target,
  Users,
} from "lucide-react"

const PIPELINE_STAGES = [
  {
    step: "01",
    name: "Requirement Extraction Agent",
    tag: "Atomic Decomposition",
    desc: "Deconstructs unstructured job descriptions into individual, unambiguous criteria categorized by type, importance, and minimum years of experience.",
    icon: Target,
    color: "from-blue-500/20 to-cyan-500/20 text-blue-500",
  },
  {
    step: "02",
    name: "Semantic Section Chunking",
    tag: "Contextual Parsing",
    desc: "Parses candidate resumes into clean semantic partitions (Summary, Skills, Experience, Education) and generates dense vector embeddings.",
    icon: Database,
    color: "from-purple-500/20 to-pink-500/20 text-purple-500",
  },
  {
    step: "03",
    name: "Dense RAG Retrieval",
    tag: "Vector Search",
    desc: "Retrieves the top-k most relevant resume evidence blocks for each atomic requirement using cosine semantic similarity.",
    icon: Search,
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-500",
  },
  {
    step: "04",
    name: "Evidence & Gap Agent",
    tag: "Batch Synthesis",
    desc: "Executes batch evaluation across all requirements in a single pass, categorizing verdicts into matched, partial, gap, or insufficient evidence with exact citations.",
    icon: Cpu,
    color: "from-amber-500/20 to-orange-500/20 text-amber-500",
  },
  {
    step: "05",
    name: "Grounding Judge Agent",
    tag: "Anti-Hallucination",
    desc: "Strictly audits every cited quote against retrieved resume chunks. Automatically strips ungrounded claims and downgrades suspect verdicts.",
    icon: ShieldCheck,
    color: "from-red-500/20 to-rose-500/20 text-rose-500",
  },
  {
    step: "06",
    name: "Deterministic Scoring Engine",
    tag: "Mathematical Accuracy",
    desc: "Calculates overall compatibility using deterministic formula-based weighting, eliminating arbitrary LLM score drift completely.",
    icon: BarChart3,
    color: "from-primary/20 to-accent/20 text-primary",
  },
]

const DOMAIN_CATEGORIES = [
  {
    category: "Frontend & Mobile",
    roles: ["React / Next.js", "Vue / Nuxt", "Angular Enterprise", "iOS (Swift)", "Android (Kotlin)", "React Native"],
  },
  {
    category: "Backend & Systems",
    roles: ["Go Distributed Systems", "Python FastAPI", "Java Spring Boot", "Rust Systems", "Node.js Microservices", "C++ Low-Latency"],
  },
  {
    category: "Cloud & DevOps",
    roles: ["AWS Platform / Terraform", "Kubernetes SRE", "Azure Cloud Infrastructure", "GCP Data Platform"],
  },
  {
    category: "AI, ML & Data",
    roles: ["MLOps & PyTorch", "LLM / GenAI Engineer", "Computer Vision", "Data Engineering (Spark/Snowflake)", "Analytics (dbt/SQL)"],
  },
  {
    category: "Security & QA",
    roles: ["Cloud Security Architect", "Application Security", "SDET Automation", "Performance Engineer"],
  },
  {
    category: "Product & Architecture",
    roles: ["Technical Product Manager", "Enterprise Solutions Architect", "B2B SaaS PM", "Healthcare Systems"],
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <Navigation />

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto text-center relative pt-8 pb-16">
          <div className="animated-gradient absolute inset-0 rounded-3xl opacity-15 blur-3xl pointer-events-none"></div>

          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-6 shadow-sm max-w-full">
            <Sparkles className="h-3.5 w-3.5 animate-pulse shrink-0" />
            <span>Autonomous Multi-Agent RAG Pipeline</span>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <span className="hidden sm:inline">Comprehensive Multi-Domain Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            Precision AI Resume Screening <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Powered by Multi-Agent RAG
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Eliminate subjective recruiting and LLM hallucinations. Our pipeline breaks job descriptions into atomic criteria,
            searches semantic resume chunks using dense vector embeddings, and validates every qualification with deterministic citation auditing.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 h-12 text-base font-semibold"
              asChild
            >
              <Link href="/analyze">
                <Brain className="h-5 w-5 mr-2" />
                Launch Screener Studio
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 h-12 text-base font-medium px-6 bg-background/50"
              asChild
            >
              <Link href="/dashboard">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                View Analytics Dashboard
              </Link>
            </Button>
          </div>

          {/* Core Pipeline Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm shadow-sm max-w-4xl mx-auto">
            <div className="p-3 text-center border-r border-border/40 last:border-0">
              <div className="text-2xl lg:text-3xl font-bold text-primary">Dense RAG</div>
              <div className="text-xs text-muted-foreground font-medium mt-0.5">Semantic Vector Embeddings</div>
            </div>
            <div className="p-3 text-center border-r border-border/40 last:border-0">
              <div className="text-2xl lg:text-3xl font-bold text-accent">Atomic</div>
              <div className="text-xs text-muted-foreground font-medium mt-0.5">Criteria Decomposition</div>
            </div>
            <div className="p-3 text-center border-r border-border/40 last:border-0">
              <div className="text-2xl lg:text-3xl font-bold text-primary">Audited</div>
              <div className="text-xs text-muted-foreground font-medium mt-0.5">Verbatim Citations</div>
            </div>
            <div className="p-3 text-center">
              <div className="text-2xl lg:text-3xl font-bold text-emerald-500">Zero Drift</div>
              <div className="text-xs text-muted-foreground font-medium mt-0.5">Deterministic Scoring</div>
            </div>
          </div>
        </section>

        {/* Multi-Agent Pipeline Architecture */}
        <section className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-12">
            <Badge variant="outline" className="text-xs border-primary/30 text-primary mb-3">
              Core Architecture
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight mb-3">The 5-Stage Multi-Agent Pipeline</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              Each specialized agent performs a discrete, auditable role to prevent single-prompt hallucinations and ensure mathematical reliability.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PIPELINE_STAGES.map((st) => {
              const IconComponent = st.icon
              return (
                <Card
                  key={st.step}
                  className="border-2 border-border/60 hover:border-primary/30 transition-all duration-300 hover:shadow-md bg-card/60 backdrop-blur-sm relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-4 font-mono text-3xl font-black text-muted/20 group-hover:text-primary/20 transition-colors">
                    {st.step}
                  </div>
                  <CardHeader className="pb-3">
                    <div className={`p-3 rounded-xl w-fit mb-3 bg-gradient-to-br ${st.color}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <Badge variant="secondary" className="text-[10px] font-semibold tracking-wide uppercase">
                        {st.tag}
                      </Badge>
                      <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                        {st.name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {st.desc}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Why Multi-Agent RAG vs Naive LLM */}
        <section className="max-w-5xl mx-auto mb-20">
          <div className="p-8 sm:p-10 rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 shadow-sm">
            <div className="text-center mb-10">
              <Badge variant="outline" className="text-xs border-accent/40 text-accent mb-3">
                Benchmark Comparison
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                Why Multi-Agent RAG Outperforms Traditional LLM Prompting
              </h2>
              <p className="text-muted-foreground text-sm max-w-xl mx-auto">
                Comparing single-prompt ChatGPT resume evaluation against our grounded multi-agent screening system.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Naive LLM */}
              <div className="p-6 rounded-2xl border border-destructive/20 bg-destructive/5 space-y-4">
                <div className="flex items-center space-x-2 text-destructive font-bold text-base">
                  <XCircle className="h-5 w-5" />
                  <span>Naive Single-Prompt LLM Screening</span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start space-x-2">
                    <span className="text-destructive font-bold">•</span>
                    <span><strong>Hallucinates Skills:</strong> Invents candidate skills or tools not present in the resume.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-destructive font-bold">•</span>
                    <span><strong>Compound Bundling:</strong> Groups multiple skills together (e.g. Docker + Kubernetes + AWS) into vague all-or-nothing scores.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-destructive font-bold">•</span>
                    <span><strong>Subjective Score Drift:</strong> Generates different arbitrary scores (e.g., 78% vs 89%) for the exact same input.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-destructive font-bold">•</span>
                    <span><strong>Token Exhaustion:</strong> Long resumes truncate or hit token limits, skipping vital background experience.</span>
                  </li>
                </ul>
              </div>

              {/* Multi-Agent RAG */}
              <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-4">
                <div className="flex items-center space-x-2 text-emerald-600 font-bold text-base">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Our Multi-Agent RAG System</span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>Audited Grounding:</strong> Substring-checks every cited sentence; ungrounded quotes are strictly removed.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>Atomic Criteria:</strong> Deconstructs JDs into distinct requirement objects with dedicated evidence retrieval.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>Deterministic Scoring:</strong> Mathematical weighted formula guarantees 100% score repeatability and transparency.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>Dense Semantic Retrieval:</strong> Isolated vector search pinpoints exact evidence chunks regardless of document length.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Multi-Domain Coverage Catalog */}
        <section className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-10">
            <Badge variant="outline" className="text-xs border-primary/30 text-primary mb-3">
              Comprehensive Coverage
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight mb-3">Multi-Domain Tech Intelligence</h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
              Test candidate-job matches across software engineering, cloud architecture, AI systems, security, and product management.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {DOMAIN_CATEGORIES.map((dc) => (
              <Card key={dc.category} className="border border-border/70 hover:border-primary/30 transition-all bg-card/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center justify-between">
                    <span>{dc.category}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      Specializations
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {dc.roles.map((r) => (
                      <span
                        key={r}
                        className="text-[11px] px-2.5 py-1 rounded-md bg-muted/60 border border-border/40 text-muted-foreground"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <section className="max-w-4xl mx-auto text-center mb-12">
          <Card className="p-8 sm:p-12 relative overflow-hidden border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-background to-accent/10 shadow-lg">
            <div className="relative z-10 space-y-6">
              <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary">
                <Brain className="h-8 w-8 animate-pulse" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">Ready to Experience Grounded AI Screening?</h2>
              <p className="text-muted-foreground text-base max-w-xl mx-auto">
                Select any candidate profile and job posting from our pre-indexed library to watch the multi-agent RAG pipeline execute in real-time.
              </p>
              <div className="flex flex-wrap gap-4 justify-center pt-2">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-md hover:shadow-lg font-semibold px-8"
                  asChild
                >
                  <Link href="/analyze">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Enter Screener Studio
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border border-border/80 hover:bg-muted font-medium bg-background/60"
                  asChild
                >
                  <Link href="/dashboard">View Candidate Analytics</Link>
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  )
}
