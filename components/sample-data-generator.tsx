"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Briefcase } from "lucide-react"
import { sampleResumes, sampleJobDescriptions } from "/sample-data/sample-resume-content"

interface SampleDataGeneratorProps {
  onSelectSample: (resumeContent: string, jobDescription: string) => void
}

export function SampleDataGenerator({ onSelectSample }: SampleDataGeneratorProps) {
  const [selectedSample, setSelectedSample] = useState<string | null>(null)

  const samples = [
    {
      id: "softwareDeveloper",
      title: "Software Developer",
      description: "Full-stack developer with React, Node.js, and AWS experience",
      icon: <FileText className="h-5 w-5" />,
      skills: sampleResumes.softwareDeveloper.skills.slice(0, 5),
    },
    {
      id: "dataScientist",
      title: "Data Scientist",
      description: "ML engineer with Python, TensorFlow, and cloud platforms",
      icon: <FileText className="h-5 w-5" />,
      skills: sampleResumes.dataScientist.skills.slice(0, 5),
    },
    {
      id: "productManager",
      title: "Product Manager",
      description: "B2B SaaS product manager with agile and analytics experience",
      icon: <Briefcase className="h-5 w-5" />,
      skills: sampleResumes.productManager.skills.slice(0, 5),
    },
  ]

  const generatePDF = (content: string, filename: string) => {
    // Create a simple HTML document that can be printed to PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
            h1 { color: #333; border-bottom: 2px solid #333; }
            h2 { color: #666; margin-top: 30px; }
            .contact { margin-bottom: 20px; }
            .section { margin-bottom: 25px; }
          </style>
        </head>
        <body>
          ${content
            .split("\n")
            .map((line) => {
              if (line.trim() === "") return "<br>"
              if (line.match(/^[A-Z\s]+$/)) return `<h1>${line.trim()}</h1>`
              if (line.includes("|") && line.includes("@")) return `<div class="contact">${line}</div>`
              if (line.match(/^[A-Z][A-Z\s&]+$/)) return `<h2>${line}</h2>`
              if (line.includes("•")) return `<li>${line.replace("•", "").trim()}</li>`
              return `<p>${line}</p>`
            })
            .join("")}
        </body>
      </html>
    `

    const blob = new Blob([htmlContent], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleUseSample = (sampleId: string) => {
    const resumeContent = sampleResumes[sampleId as keyof typeof sampleResumes].content
    const jobDescription = sampleJobDescriptions[sampleId as keyof typeof sampleJobDescriptions]
    onSelectSample(resumeContent, jobDescription)
    setSelectedSample(sampleId)
  }

  const handleDownloadResume = (sampleId: string) => {
    const sample = sampleResumes[sampleId as keyof typeof sampleResumes]
    generatePDF(sample.content, `${sample.name.replace(" ", "_")}_Resume`)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Try Sample Data</h3>
        <p className="text-sm text-muted-foreground">
          Use pre-built resume and job description pairs to test the AI analysis
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {samples.map((sample) => (
          <Card
            key={sample.id}
            className={`cursor-pointer transition-all ${selectedSample === sample.id ? "ring-2 ring-primary" : ""}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {sample.icon}
                <CardTitle className="text-base">{sample.title}</CardTitle>
              </div>
              <CardDescription className="text-xs">{sample.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1">
                {sample.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleUseSample(sample.id)} className="flex-1">
                  Use Sample
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDownloadResume(sample.id)}>
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedSample && (
        <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300">
            ✓ Sample data loaded! You can now analyze the resume or upload your own PDF.
          </p>
        </div>
      )}
    </div>
  )
}
