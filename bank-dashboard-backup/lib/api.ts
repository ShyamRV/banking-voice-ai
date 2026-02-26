/**
 * BankVoiceAI API Client - Production Version
 * All calls include JWT auth token.
 * Place at: bank-dashboard/lib/api.ts
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003"

// ─── AUTH HELPERS ──────────────────────────────────────────────────────────────

function getToken(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("bva_token") || ""
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
    cache: "no-store",
  })

  if (res.status === 401) {
    // Token expired — redirect to login
    if (typeof window !== "undefined") {
      localStorage.clear()
      window.location.href = "/login"
    }
    throw new Error("Unauthorized")
  }

  return res.json()
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type AgentStatus = "active" | "inactive" | "degraded" | "locked"

export interface Agent {
  id: string
  name: string
  address: string
  description: string
  status: AgentStatus
  calls_today: number
  uptime: number
  last_active: string
  tier_required: string
  health_score: number
  accessible: boolean
}

export interface Subscription {
  active: boolean
  tier: string
  bank_name: string
  calls_used: number
  calls_limit: number
  active_agents: number
  onboarded: string
}

export interface LogEntry {
  id: string
  timestamp: string
  agent_id: string
  agent_name: string
  level: "INFO" | "WARN" | "ERROR"
  message: string
}

export interface Stats {
  total_calls_today: number
  total_calls_month: number
  active_agents: number
  total_agents: number
  avg_uptime: number
  cost_saved_usd: number
  calls_limit: number
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export async function loginWithWallet(walletAddress: string): Promise<{
  token: string
  bank_name: string
  tier: string
  bank_id: string
}> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet_address: walletAddress }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || "Login failed")
  }
  return res.json()
}

export function logout() {
  localStorage.clear()
  window.location.href = "/login"
}

export function isLoggedIn(): boolean {
  return !!getToken()
}

export function getBankName(): string {
  return localStorage.getItem("bva_bank_name") || "Your Bank"
}

export function getTier(): string {
  return localStorage.getItem("bva_tier") || "starter"
}

// ─── AGENTS ───────────────────────────────────────────────────────────────────

export async function getAgents(): Promise<Agent[]> {
  return apiFetch("/api/agents")
}

export async function startAgent(agentId: string): Promise<{ success: boolean }> {
  return apiFetch(`/api/agent/${agentId}/start`, { method: "POST" })
}

export async function stopAgent(agentId: string): Promise<{ success: boolean }> {
  return apiFetch(`/api/agent/${agentId}/stop`, { method: "POST" })
}

// ─── STATS ────────────────────────────────────────────────────────────────────

export async function getStats(): Promise<Stats> {
  return apiFetch("/api/stats")
}

export async function getSubscription(walletAddress: string): Promise<Subscription> {
  return apiFetch(`/api/subscription/${walletAddress}`)
}

// ─── LOGS ─────────────────────────────────────────────────────────────────────

export async function getLogs(agentId?: string, level?: string): Promise<LogEntry[]> {
  const params = new URLSearchParams()
  if (agentId && agentId !== "all") params.set("agent_id", agentId)
  if (level && level !== "all") params.set("level", level)
  return apiFetch(`/api/logs?${params}`)
}

export function createLogStream(
  onLog: (log: LogEntry) => void,
  onError?: (e: Event) => void
): () => void {
  const token = getToken()
  const wsUrl = `${API_BASE.replace("http", "ws")}/ws/logs?token=${token}`
  const ws = new WebSocket(wsUrl)

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === "ping") return
    onLog(data as LogEntry)
  }
  ws.onerror = (e) => {
    console.error("Log stream error:", e)
    onError?.(e)
  }

  return () => ws.close()
}

// ─── SUBSCRIBE ────────────────────────────────────────────────────────────────

export async function subscribeTier(
  walletAddress: string,
  tier: string,
  bankName: string,
  contactEmail: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/api/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet_address: walletAddress,
      tier,
      bank_name: bankName,
      contact_email: contactEmail,
    }),
  })
  return res.json()
}

// ─── POLLING HELPER ───────────────────────────────────────────────────────────

export function startPolling(fn: () => void, intervalMs = 30000): () => void {
  fn()
  const id = setInterval(fn, intervalMs)
  return () => clearInterval(id)
}