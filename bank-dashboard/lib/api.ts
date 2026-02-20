/**
 * BankVoiceAI API Client
 * Replace mock-data imports with these real API calls
 * Place this file at: lib/api.ts
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003"

// ─── TYPES (same as mock-data.ts) ─────────────────────────────────────────────

export type AgentStatus = "active" | "inactive" | "degraded"

export interface Agent {
  id: string
  name: string
  address: string
  fetchAddress: string
  status: AgentStatus
  calls_today: number
  uptime: number
  last_active: string
  tier_required: string
  health_score: number
  description: string
}

export interface Subscription {
  tier: "starter" | "professional" | "enterprise"
  bank_name: string
  calls_used: number
  calls_limit: number
  expiry: string
  fet_wallet: string
  active_agents: number
  cost_saved: number
  active: boolean
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
  active_agents: number
  total_agents: number
  avg_uptime: number
  cost_saved_inr: number
  calls_this_month: number
}

// ─── AGENT NAMES & DESCRIPTIONS ───────────────────────────────────────────────

const agentMeta: Record<string, { name: string; description: string; tier_required: string; fetchAddress: string }> = {
  core: {
    name: "BankVoiceAI Core",
    description: "Primary AI banking agent handling core query routing and response generation",
    tier_required: "starter",
    fetchAddress: "fetch1mnusswylz6smcx59jtvem2vyxruw6mjkhppyph",
  },
  whatsapp: {
    name: "WhatsApp Agent",
    description: "Handles WhatsApp Business API interactions and message routing",
    tier_required: "professional",
    fetchAddress: "fetch1_whatsapp_address",
  },
  voice: {
    name: "Voice Call Agent",
    description: "Manages Twilio voice calls with real-time speech-to-text and TTS",
    tier_required: "professional",
    fetchAddress: "fetch1_voice_address",
  },
  compliance: {
    name: "Compliance Agent",
    description: "RBI compliance monitoring and regulatory adherence verification",
    tier_required: "enterprise",
    fetchAddress: "fetch1_compliance_address",
  },
  fraud: {
    name: "Fraud Detection Agent",
    description: "Real-time fraud detection using ML models on transaction patterns",
    tier_required: "enterprise",
    fetchAddress: "fetch1_fraud_address",
  },
}

// ─── API FUNCTIONS ─────────────────────────────────────────────────────────────

export async function getAgents(): Promise<Agent[]> {
  const res = await fetch(`${API_BASE}/api/agents`, { cache: "no-store" })
  const data = await res.json()
  return data.map((a: any) => ({
    ...a,
    ...agentMeta[a.id],
    last_active: new Date(a.last_active).toLocaleTimeString(),
  }))
}

export async function getSubscription(walletAddress: string): Promise<Subscription> {
  const res = await fetch(`${API_BASE}/api/subscription/${walletAddress}`, { cache: "no-store" })
  return res.json()
}

export async function getStats(): Promise<Stats> {
  const res = await fetch(`${API_BASE}/api/stats`, { cache: "no-store" })
  return res.json()
}

export async function getLogs(agentId?: string, level?: string): Promise<LogEntry[]> {
  const params = new URLSearchParams()
  if (agentId && agentId !== "all") params.set("agent_id", agentId)
  if (level && level !== "all") params.set("level", level)
  const res = await fetch(`${API_BASE}/api/logs?${params}`, { cache: "no-store" })
  return res.json()
}

export async function startAgent(agentId: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/api/agent/${agentId}/start`, { method: "POST" })
  return res.json()
}

export async function stopAgent(agentId: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/api/agent/${agentId}/stop`, { method: "POST" })
  return res.json()
}

export async function requestPayment(tier: string, walletAddress: string) {
  const res = await fetch(`${API_BASE}/api/payment/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier, wallet_address: walletAddress }),
  })
  return res.json()
}

// ─── WEBSOCKET FOR LIVE LOGS ──────────────────────────────────────────────────

export function createLogStream(
  onLog: (log: LogEntry) => void,
  onError?: (e: Event) => void
): () => void {
  const ws = new WebSocket(`${API_BASE.replace("http", "ws")}/ws/logs`)

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === "ping") return
    onLog(data as LogEntry)
  }

  ws.onerror = (e) => {
    console.error("Log stream error:", e)
    onError?.(e)
  }

  // Return cleanup function
  return () => ws.close()
}

// ─── POLLING HOOK HELPER ──────────────────────────────────────────────────────

export function startPolling(fn: () => void, intervalMs: number = 30000): () => void {
  fn() // call immediately
  const id = setInterval(fn, intervalMs)
  return () => clearInterval(id)
}
