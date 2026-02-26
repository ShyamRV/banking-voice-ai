import Link from "next/link"
import { Shield, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { Pricing } from "@/components/landing/pricing"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-semibold text-foreground">BankVoiceAI</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </a>
            <Link href="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Dashboard
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="border-border text-foreground hover:bg-secondary">
              <Link href="/dashboard">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/subscribe">
                Get Started
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <Hero />
      <Features />
      <Pricing />

      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                <Shield className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">BankVoiceAI</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Built on Fetch.ai Agentverse. RBI Compliant. Enterprise Ready.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
