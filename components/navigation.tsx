"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, BarChart3, Sparkles, Layers, Menu, X, ChevronRight } from "lucide-react"

export default function Navigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Close mobile menu whenever the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Close mobile menu on window resize to tablet/desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const navItems = [
    {
      href: "/",
      label: "Overview",
      description: "Architecture & pipeline overview",
      icon: Layers,
      isActive: pathname === "/",
    },
    {
      href: "/analyze",
      label: "Screener Studio",
      description: "Multi-agent candidate screening & citation audit",
      icon: Brain,
      isActive: pathname === "/analyze",
      badge: "Core App",
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      description: "Analytics telemetry & candidate export",
      icon: BarChart3,
      isActive: pathname === "/dashboard",
    },
  ]

  return (
    <nav className="border-b border-border/80 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50 transition-all">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between gap-2">
          {/* Logo / Brand */}
          <Link
            href="/"
            className="flex items-center space-x-2.5 sm:space-x-3 group min-w-0 shrink-0"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="relative p-2 rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-all duration-300 shrink-0">
              <Brain className="h-5 w-5 text-primary" />
              <Sparkles className="h-3 w-3 text-accent absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div className="flex items-center space-x-2 min-w-0">
              <span className="font-bold text-base sm:text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate">
                AI Resume Screener
              </span>
              <Badge
                variant="outline"
                className="hidden sm:inline-flex text-[10px] font-semibold border-primary/30 text-primary bg-primary/5 shrink-0"
              >
                Multi-Agent RAG
              </Badge>
            </div>
          </Link>

          {/* Desktop & Tablet Navigation (md and up: 768px+) */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon
              const isAnalyze = item.href === "/analyze"

              return (
                <Button
                  key={item.href}
                  variant={
                    item.isActive
                      ? isAnalyze
                        ? "default"
                        : "secondary"
                      : "ghost"
                  }
                  size="sm"
                  asChild
                  className={
                    item.isActive && isAnalyze
                      ? "bg-gradient-to-r from-primary to-accent text-white shadow-sm hover:from-primary/90 hover:to-accent/90 text-xs lg:text-sm font-medium px-2.5 lg:px-3.5"
                      : "hover:bg-primary/10 transition-colors text-xs lg:text-sm font-medium px-2.5 lg:px-3.5"
                  }
                >
                  <Link href={item.href} className="flex items-center gap-1.5 lg:gap-2">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </Button>
              )
            })}
          </div>

          {/* Mobile Hamburger Button (below md: < 768px) */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-foreground hover:text-primary hover:bg-primary/10 border border-border/40 hover:border-primary/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 transition-transform duration-200" />
              ) : (
                <Menu className="h-5 w-5 transition-transform duration-200" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 bg-background/60 backdrop-blur-xs md:hidden z-40 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Dropdown Panel */}
      {isMobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="relative z-50 md:hidden border-b border-border/80 bg-background/98 backdrop-blur-xl px-4 py-3 shadow-xl transition-all animate-in slide-in-from-top-2 duration-200"
        >
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                    item.isActive
                      ? "bg-primary/10 border border-primary/20 text-primary font-semibold shadow-xs"
                      : "hover:bg-muted/70 text-muted-foreground hover:text-foreground border border-transparent"
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        item.isActive
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-medium flex items-center gap-1.5">
                        <span className={item.isActive ? "text-foreground font-semibold" : "text-foreground"}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 shrink-0 transition-transform ${
                      item.isActive ? "text-primary translate-x-0.5" : "text-muted-foreground"
                    }`}
                  />
                </Link>
              )
            })}
          </div>

          {/* Mobile Menu Footer Info */}
          <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-accent" />
              Autonomous Multi-Agent RAG
            </span>
            <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-primary/30 text-primary bg-primary/5">
              Production
            </Badge>
          </div>
        </div>
      )}
    </nav>
  )
}
