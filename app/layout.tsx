import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import Footer from "@/components/footer"
import "./globals.css"

export const metadata: Metadata = {
  title: "AI Resume Screener - Autonomous Multi-Agent RAG Pipeline",
  description:
    "Enterprise-grade resume screening powered by atomic requirement extraction, dense vector RAG retrieval, grounded gap evaluation, and deterministic citation verification.",
  keywords: ["AI", "resume screening", "multi-agent", "RAG", "retrieval augmented generation", "Groq", "HR tech"],
  authors: [{ name: "Harini L" }],
  creator: "Harini L",
  publisher: "AI Resume Screener",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ai-resume-screener.vercel.app",
    title: "AI Resume Screener - Multi-Agent RAG Pipeline",
    description: "Multi-Agent RAG resume screening with grounded citation verification across candidate profiles and job descriptions.",
    siteName: "AI Resume Screener",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Resume Screener - Smart Resume Analysis",
    description: "AI-powered resume screening with semantic analysis and comprehensive analytics.",
  },
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased flex flex-col min-h-screen">
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  )
}