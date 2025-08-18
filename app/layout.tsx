import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

export const metadata: Metadata = {
  title: "AI Resume Screener - Smart Resume Analysis",
  description:
    "AI-powered resume screening with semantic analysis, skill matching, and comprehensive analytics dashboard.",
  keywords: ["AI", "resume", "screening", "job matching", "semantic analysis", "HR tech"],
  authors: [{ name: "AI Resume Screener Team" }],
  creator: "AI Resume Screener",
  publisher: "AI Resume Screener",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ai-resume-screener.vercel.app",
    title: "AI Resume Screener - Smart Resume Analysis",
    description: "Upload resumes and get AI-powered matching scores with detailed insights and analytics.",
    siteName: "AI Resume Screener",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Resume Screener - Smart Resume Analysis",
    description: "AI-powered resume screening with semantic analysis and comprehensive analytics.",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
