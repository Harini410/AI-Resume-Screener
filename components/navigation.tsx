import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, BarChart3, Upload, Sparkles } from "lucide-react"

export default function Navigation() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <FileText className="h-6 w-6 text-primary floating-animation" />
              <Sparkles className="h-3 w-3 text-accent absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="font-bold text-lg gradient-text">AI Resume Screener</span>
          </Link>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              asChild
              className="interactive-element focus-ring hover:bg-primary/10 hover:text-primary transition-all duration-300"
            >
              <Link href="/analyze" className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Analyze</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="interactive-element focus-ring hover:bg-accent/10 hover:text-accent transition-all duration-300"
            >
              <Link href="/dashboard" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
