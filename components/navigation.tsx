"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, BarChart3, Sparkles, Layers, ShieldCheck } from "lucide-react"

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative p-2 rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-all duration-300">
              <Brain className="h-5 w-5 text-primary" />
              <Sparkles className="h-3 w-3 text-accent absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI Resume Screener
              </span>
              <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-semibold border-primary/30 text-primary bg-primary/5">
                Multi-Agent RAG
              </Badge>
            </div>
          </Link>

          <div className="flex items-center space-x-2">
            <Button
              variant={pathname === "/" ? "secondary" : "ghost"}
              asChild
              className="text-sm font-medium hover:bg-primary/10 transition-colors"
            >
              <Link href="/" className="flex items-center space-x-2">
                <Layers className="h-4 w-4" />
                <span>Overview</span>
              </Link>
            </Button>

            <Button
              variant={pathname === "/analyze" ? "default" : "ghost"}
              asChild
              className={pathname === "/analyze" ? "bg-gradient-to-r from-primary to-accent text-white shadow-sm" : "hover:bg-primary/10 transition-colors"}
            >
              <Link href="/analyze" className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span>Screener Studio</span>
              </Link>
            </Button>

            <Button
              variant={pathname === "/dashboard" ? "secondary" : "ghost"}
              asChild
              className="hover:bg-accent/10 transition-colors"
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
