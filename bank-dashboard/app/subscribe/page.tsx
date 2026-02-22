"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Check } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003"

const TIERS = [
  {
    id: "starter",
    name: "Starter",
    price_usd: 1500,
    price_fet: 5000,
    calls: "5,000",
    agents: ["BankVoiceAI Core"],
    features: ["AI chat & voice", "Basic analytics", "Email support", "FDIC compliant"],
  },
  {
    id: "professional",
    name: "Professional",
    price_usd: 3000,
    price_fet: 10000,
    calls: "15,000",
    agents: ["Core", "WhatsApp", "Voice Calls"],
    features: ["All Starter features", "WhatsApp Business", "Real phone calls", "Priority support", "Custom prompts"],
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price_usd: 6000,
    price_fet: 20000,
    calls: "40,000",
    agents: ["Core", "WhatsApp", "Voice", "Compliance", "Fraud"],
    features: ["All Professional", "Compliance monitoring", "Fraud detection", "Dedicated manager", "Custom SLA", "On-premise option"],
  },
]

export default function SubscribePage() {
  const router = useRouter()
  const [selectedTier, setSelectedTier] = useState("professional")
  const [step, setStep] = useState<"select" | "details" | "payment">("select")
  const [bankName, setBankName] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [paymentInstructions, setPaymentInstructions] = useState<any>(null)

  const tier = TIERS.find(t => t.id === selectedTier)!

  const handleSubscribe = async () => {
    if (!bankName || !walletAddress || !contactEmail) {
      toast.error("Please fill all fields")
      return
    }
    if (!walletAddress.startsWith("fetch1")) {
      toast.error("Invalid FET wallet address")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: walletAddress,
          tier: selectedTier,
          bank_name: bankName,
          contact_email: contactEmail,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error("Subscription failed", { description: data.detail })
        return
      }

      setPaymentInstructions(data.payment_instructions)
      setStep("payment")
      toast.success("Almost there! Complete payment to activate.")
    } catch (e) {
      toast.error("Connection error")
    } finally {
      setLoading(false)
    }
  }

  const checkPaymentStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/subscription/${walletAddress}`)
      const data = await res.json()

      if (data.active) {
        toast.success("Payment confirmed! Setting up your dashboard...")
  // Auto login immediately
        const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet_address: walletAddress }),
        })
        const loginData = await loginRes.json()
        localStorage.setItem("bva_token", loginData.token)
        localStorage.setItem("bva_bank_name", loginData.bank_name)
        localStorage.setItem("bva_tier", loginData.tier)
        localStorage.setItem("bva_wallet", walletAddress)
        localStorage.setItem("token", loginData.token)
        localStorage.setItem("bank_name", loginData.bank_name)
        localStorage.setItem("tier", loginData.tier)
        setTimeout(() => router.push("/dashboard"), 1500)
      }
        else {
        toast.error("Payment not detected yet", {
          description: "Please ensure you sent the exact FET amount. It may take 1-2 minutes.",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Step 1: Select Tier ──────────────────────────────────────────────────

  if (step === "select") return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <Badge className="bg-primary/10 text-primary border-0">US Banks Only</Badge>
          <h1 className="text-4xl font-bold">Replace Your Call Center with AI</h1>
          <p className="text-muted-foreground text-lg">Save $2–20M/year. Works 24/7. Answers in seconds.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TIERS.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedTier(t.id)}
              className={cn(
                "rounded-2xl border p-6 cursor-pointer transition-all space-y-5",
                selectedTier === t.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40",
                t.highlighted && selectedTier !== t.id && "border-primary/30"
              )}
            >
              {t.highlighted && (
                <Badge className="bg-primary text-primary-foreground border-0 text-xs">Most Popular</Badge>
              )}
              <div>
                <h2 className="text-xl font-bold">{t.name}</h2>
                <div className="mt-2">
                  <span className="text-3xl font-bold">${t.price_usd.toLocaleString()}</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t.price_fet.toLocaleString()} FET · {t.calls} calls</p>
              </div>

              <ul className="space-y-2">
                {t.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={selectedTier === t.id ? "default" : "outline"}
                onClick={() => { setSelectedTier(t.id); setStep("details") }}
              >
                {selectedTier === t.id ? "Selected" : "Select"}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Powered by Fetch.ai blockchain · Payments in FET · Cancel anytime
        </p>
      </div>
    </div>
  )

  // ── Step 2: Bank Details ─────────────────────────────────────────────────

  if (step === "details") return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold">Bank Details</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Setting up <span className="text-primary font-medium">{tier.name}</span> — {tier.price_fet.toLocaleString()} FET/month
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Bank Name</label>
            <Input
              placeholder="First National Bank"
              value={bankName}
              onChange={e => setBankName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Contact Email</label>
            <Input
              type="email"
              placeholder="admin@yourbank.com"
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">FET Wallet Address</label>
            <Input
              placeholder="fetch1..."
              value={walletAddress}
              onChange={e => setWalletAddress(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Get a FET wallet at <a href="https://fetch.ai/get-fetch-wallet" className="text-primary underline" target="_blank">fetch.ai</a>
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setStep("select")}>Back</Button>
          <Button className="flex-1" onClick={handleSubscribe} disabled={loading}>
            {loading ? "Setting up..." : "Continue to Payment"}
          </Button>
        </div>
      </div>
    </div>
  )

  // ── Step 3: Payment Instructions ─────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-3">💸</div>
          <h2 className="text-xl font-bold">Complete Payment</h2>
          <p className="text-sm text-muted-foreground mt-1">Send FET to activate your subscription</p>
        </div>

        <div className="rounded-xl bg-muted/50 p-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Send to wallet:</span>
            <span className="font-mono text-xs truncate max-w-[160px]">{paymentInstructions?.send_to_wallet}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-bold text-primary">{paymentInstructions?.amount_fet?.toLocaleString()} FET</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Memo:</span>
            <span className="font-mono text-xs">{paymentInstructions?.memo}</span>
          </div>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <p className="font-medium text-yellow-600">⚠️ Important</p>
          <p>Include the memo exactly as shown so we can identify your payment.</p>
          <p>Payment is processed on the Fetch.ai blockchain. Activation takes 1–2 minutes.</p>
        </div>

        <Button className="w-full" onClick={checkPaymentStatus} disabled={loading}>
          {loading ? "Checking..." : "I've Sent the Payment — Activate Now"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Need help? Email us at <a href="mailto:shyamjipandey211105@gmail.com" className="text-primary">shyamjipandey211105@gmail.com</a>
        </p>
      </div>
    </div>
  )
}
