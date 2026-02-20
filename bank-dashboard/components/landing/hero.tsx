"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Phone, Building2, IndianRupee } from "lucide-react"
import { Button } from "@/components/ui/button"

function AnimatedCounter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [target])

  return (
    <span>
      {prefix}{count.toLocaleString("en-IN")}{suffix}
    </span>
  )
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      <div className="absolute inset-0" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(14,165,233,0.08) 1px, transparent 0)",
        backgroundSize: "40px 40px",
      }} />

      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            Powered by Fetch.ai Agentverse
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-foreground lg:text-7xl text-balance">
            Replace your call center with{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI
            </span>
          </h1>

          <p className="mb-4 text-xl text-muted-foreground lg:text-2xl text-pretty">
            Save <span className="font-semibold text-foreground">{"$20 Cr/year"}</span> with intelligent banking agents
            deployed on decentralized infrastructure.
          </p>

          <p className="mb-10 text-base text-muted-foreground max-w-2xl mx-auto text-pretty">
            BankVoiceAI deploys autonomous AI agents that handle customer queries via voice,
            WhatsApp, and chat - with built-in RBI compliance and fraud detection.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base">
              <Link href="/subscribe">
                Subscribe with FET
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-border text-foreground hover:bg-secondary px-8 h-12 text-base">
              <Link href="/dashboard">
                View Dashboard Demo
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { icon: Phone, label: "Calls Handled", value: 2847000, suffix: "+", prefix: "" },
            { icon: Building2, label: "Banks Onboarded", value: 142, suffix: "", prefix: "" },
            { icon: IndianRupee, label: "Cost Saved", value: 185, suffix: " Cr", prefix: "$" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="group flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center transition-colors hover:border-primary/30"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
