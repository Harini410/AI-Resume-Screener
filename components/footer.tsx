import Link from "next/link"
import { Brain, ShieldCheck, Heart } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/40 mt-auto py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Brain className="h-4 w-4" />
            </div>
            <span className="font-semibold text-sm bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI Resume Screener
            </span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-xs text-muted-foreground">Autonomous Multi-Agent RAG</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Overview</Link>
            <Link href="/analyze" className="hover:text-foreground transition-colors">Screener Studio</Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <a
              href="https://github.com/Harini410/AI-Resume-Screener"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>

          <div className="text-xs text-muted-foreground flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
            <span>License Harini Copyright 2026</span>
            <span className="hidden sm:inline">•</span>
            <span>All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
