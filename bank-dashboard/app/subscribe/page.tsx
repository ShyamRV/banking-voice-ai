"use client"

import { useState } from "react"
import Link from "next/link"
import { Shield, Check, ArrowRight, Wallet, Loader2, CheckCircle2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { pricingTiers } from "@/lib/mock-data"

type PaymentStatus = "idle" | "pending" | "verified" | "activated"

export default function SubscribePage() {
  const [walletAddress, setWalletAddress] = useState("")
  const [selectedTier, setSelectedTier] = useState<string>("Professional")
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle")

  const handlePayment = () => {
    if (!walletAddress) return
    setPaymentStatus("pending")
    setTimeout(() => setPaymentStatus("verified"), 2000)
    setTimeout(() => setPaymentStatus("activated"), 4000)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-semibold text-foreground">BankVoiceAI</span>
          </Link>
          <Button asChild variant="outline" size="sm" className="border-border text-foreground hover:bg-secondary">
            <Link href="/dashboard">Skip to Dashboard</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-3 text-3xl font-bold text-foreground lg:text-4xl text-balance">
            Subscribe to BankVoiceAI
          </h1>
          <p className="text-muted-foreground text-pretty">
            Connect your FET wallet, select a plan, and activate your AI banking agents.
          </p>
        </div>

        {/* Step 1: Wallet */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              1
            </div>
            <h2 className="text-lg font-semibold text-foreground">Connect FET Wallet</h2>
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Wallet className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="fetch1mnu8eq5kzr3v..."
                className="bg-secondary border-border pl-10 font-mono text-sm"
              />
            </div>
            <Button
              variant="outline"
              className="border-border text-foreground hover:bg-secondary"
              onClick={() => setWalletAddress("fetch1mnu8eq5kzr3v" + Math.random().toString(36).slice(2, 8))}
            >
              Generate Test Wallet
            </Button>
          </div>
        </div>

        {/* Step 2: Select tier */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              2
            </div>
            <h2 className="text-lg font-semibold text-foreground">Select Plan</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {pricingTiers.map((tier) => (
              <button
                key={tier.name}
                onClick={() => setSelectedTier(tier.name)}
                className={cn(
                  "flex flex-col rounded-lg border p-5 text-left transition-all",
                  selectedTier === tier.name
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-secondary hover:border-primary/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{tier.name}</span>
                  {selectedTier === tier.name && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">${tier.price}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <span className="mt-1 text-xs text-muted-foreground">~{tier.fetPrice} FET</span>
                <ul className="mt-4 space-y-2">
                  {tier.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Payment */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              3
            </div>
            <h2 className="text-lg font-semibold text-foreground">Complete Payment</h2>
          </div>

          {paymentStatus === "idle" && (
            <Button
              onClick={handlePayment}
              disabled={!walletAddress}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8"
            >
              Pay with FET
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {paymentStatus !== "idle" && (
            <div className="space-y-4">
              {(["pending", "verified", "activated"] as PaymentStatus[]).map((step) => {
                const isComplete = (
                  step === "pending" ? ["verified", "activated"].includes(paymentStatus) :
                  step === "verified" ? paymentStatus === "activated" :
                  false
                )
                const isCurrent = paymentStatus === step
                return (
                  <div key={step} className="flex items-center gap-3">
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : isCurrent ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      isComplete ? "text-success" : isCurrent ? "text-primary" : "text-muted-foreground"
                    )}>
                      {step === "pending" && "Processing payment via payment_proto..."}
                      {step === "verified" && "Verifying transaction on Fetch.ai network..."}
                      {step === "activated" && "Subscription activated!"}
                    </span>
                    {isComplete && <Badge className="bg-success/15 text-success border-0 text-[10px]">Done</Badge>}
                  </div>
                )
              })}

              {paymentStatus === "activated" && (
                <Button asChild className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
