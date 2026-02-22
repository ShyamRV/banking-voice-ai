"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003"

export default function LoginPage() {
  const router = useRouter()
  const [wallet, setWallet] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!wallet.startsWith("fetch1")) {
      toast.error("Invalid wallet", { description: "Must be a valid FET wallet address starting with fetch1" })
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_address: wallet }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error("Login failed", { description: data.detail || "Wallet not registered" })
        return
      }

      // Store token
      localStorage.setItem("bva_token", data.token)
      localStorage.setItem("bva_bank_name", data.bank_name)
      localStorage.setItem("bva_tier", data.tier)
      localStorage.setItem("bva_wallet", wallet)
      localStorage.setItem("token", data.token)
      localStorage.setItem("bank_name", data.bank_name)
      localStorage.setItem("tier", data.tier)

      toast.success(`Welcome, ${data.bank_name}!`)
      router.push("/dashboard")
    } catch (e) {
      toast.error("Connection error", { description: "Cannot reach API server" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 space-y-6">

        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
            <span className="text-2xl">🏦</span>
          </div>
          <h1 className="text-2xl font-bold">BankVoiceAI</h1>
          <p className="text-sm text-muted-foreground">Sign in with your FET wallet to access your dashboard</p>
        </div>

        {/* Login form */}
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">FET Wallet Address</label>
            <Input
              placeholder="fetch1..."
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="font-mono text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleLogin}
            disabled={loading || !wallet}
          >
            {loading ? "Verifying..." : "Sign In with Wallet"}
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">No account?</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Subscribe CTA */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/subscribe")}
        >
          Subscribe — Starting at $1,500/month
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Powered by Fetch.ai · US Banks Only · FDIC Compliant Ready
        </p>
      </div>
    </div>
  )
}
