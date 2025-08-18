"use client"

import { Upload, FileText, BarChart3, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Navigation from "@/components/navigation"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 relative">
            <div className="animated-gradient absolute inset-0 rounded-3xl opacity-10 blur-3xl"></div>
            <div className="relative z-10 py-16">
              <div className="flex items-center justify-center mb-6">
                <Sparkles className="h-8 w-8 text-primary mr-3 animate-pulse" />
                <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  AI Resume Screener
                </h1>
                <Sparkles className="h-8 w-8 text-accent ml-3 animate-pulse" />
              </div>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Upload resumes and job descriptions to get AI-powered matching scores, identify missing skills, and
                discover candidate strengths with cutting-edge semantic analysis.
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                asChild
              >
                <Link href="/analyze">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Start AI Analysis
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-all duration-300 transform hover:scale-105 border-2 hover:border-primary/20">
              <CardHeader>
                <div className="p-3 bg-primary/10 rounded-full w-fit mb-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-primary">Upload & Analyze</CardTitle>
                <CardDescription>
                  Drag & drop PDF resumes and compare against job descriptions with instant processing
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 transform hover:scale-105 border-2 hover:border-accent/20">
              <CardHeader>
                <div className="p-3 bg-accent/10 rounded-full w-fit mb-4">
                  <FileText className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-accent">AI Matching</CardTitle>
                <CardDescription>
                  Get precise match scores using advanced sentence embeddings and semantic understanding
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 transform hover:scale-105 border-2 hover:border-primary/20">
              <CardHeader>
                <div className="p-3 bg-primary/10 rounded-full w-fit mb-4">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-primary">Dashboard</CardTitle>
                <CardDescription>
                  View all analyzed resumes with interactive charts, scores and detailed insights
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="text-center">
            <Card className="max-w-2xl mx-auto relative overflow-hidden border-2 border-primary/20">
              <div className="animated-gradient absolute inset-0 opacity-5"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="text-2xl">Ready to start screening?</CardTitle>
                <CardDescription className="text-lg">
                  Upload your first resume and job description to see the AI analysis in action
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="flex gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    asChild
                  >
                    <Link href="/analyze">Start Analysis</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 bg-transparent"
                    asChild
                  >
                    <Link href="/dashboard">View Dashboard</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
