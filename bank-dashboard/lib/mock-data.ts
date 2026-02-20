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
}

export interface LogEntry {
  id: string
  timestamp: string
  agent_id: string
  agent_name: string
  level: "INFO" | "WARN" | "ERROR"
  message: string
}

export const agents: Agent[] = [
  {
    id: "core",
    name: "BankVoiceAI Core",
    address: "agent1qgvr77f4xk2e9pq3yh8t6z...",
    fetchAddress: "fetch1mnu8eq5kzr3v...",
    status: "active",
    calls_today: 1472,
    uptime: 99.8,
    last_active: "2 mins ago",
    tier_required: "starter",
    health_score: 98,
    description: "Primary AI banking agent handling core query routing and response generation",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Agent",
    address: "agent1qw8p3xn7vfd9e2k...",
    fetchAddress: "fetch1xkp92fm3c...",
    status: "active",
    calls_today: 834,
    uptime: 99.5,
    last_active: "1 min ago",
    tier_required: "professional",
    health_score: 96,
    description: "Handles WhatsApp Business API interactions and message routing",
  },
  {
    id: "voice",
    name: "Voice Call Agent",
    address: "agent1qm4h7r2nxcv5d8j...",
    fetchAddress: "fetch1nmw73kd9v...",
    status: "active",
    calls_today: 621,
    uptime: 98.9,
    last_active: "5 mins ago",
    tier_required: "professional",
    health_score: 94,
    description: "Manages Twilio voice calls with real-time speech-to-text and TTS",
  },
  {
    id: "compliance",
    name: "Compliance Agent",
    address: "agent1qj6t9x3kpw8m7f2...",
    fetchAddress: "fetch1vbd82nkp3...",
    status: "degraded",
    calls_today: 289,
    uptime: 95.2,
    last_active: "12 mins ago",
    tier_required: "enterprise",
    health_score: 78,
    description: "RBI compliance monitoring and regulatory adherence verification",
  },
  {
    id: "fraud",
    name: "Fraud Detection Agent",
    address: "agent1qp2v8n5xwk3r6y9...",
    fetchAddress: "fetch1qrt45jm2v...",
    status: "active",
    calls_today: 156,
    uptime: 99.9,
    last_active: "30 secs ago",
    tier_required: "enterprise",
    health_score: 99,
    description: "Real-time fraud detection using ML models on transaction patterns",
  },
]

export const subscription: Subscription = {
  tier: "professional",
  bank_name: "National Banking Corp",
  calls_used: 3420,
  calls_limit: 15000,
  expiry: "2026-03-21",
  fet_wallet: "fetch1mnu8eq5kzr3v...",
  active_agents: 4,
  cost_saved: 18500000,
}

export const generateLogs = (): LogEntry[] => {
  const messages: Record<string, { level: LogEntry["level"]; message: string }[]> = {
    core: [
      { level: "INFO", message: "Query processed: Account balance inquiry for customer #48291" },
      { level: "INFO", message: "Response generated in 0.23s - confidence: 0.97" },
      { level: "WARN", message: "High latency detected: 1.2s response time for loan eligibility query" },
      { level: "INFO", message: "Session started: Customer #91827 - Language: Hindi" },
      { level: "ERROR", message: "Failed to connect to NLP service - retrying in 5s" },
      { level: "INFO", message: "Routing query to specialized loan agent - category: home_loan" },
    ],
    whatsapp: [
      { level: "INFO", message: "Message received from +91-98765-XXXXX - parsing intent" },
      { level: "INFO", message: "WhatsApp template message sent: account_statement_monthly" },
      { level: "WARN", message: "Rate limit approaching: 892/1000 messages this hour" },
      { level: "INFO", message: "Media attachment processed: cheque image for deposit" },
      { level: "INFO", message: "Conversation ended - satisfaction score: 4.8/5" },
    ],
    voice: [
      { level: "INFO", message: "Inbound call connected: Twilio SID CA7f8e9... from +91-87654-XXXXX" },
      { level: "INFO", message: "STT transcription: 'I want to check my fixed deposit maturity date'" },
      { level: "WARN", message: "Background noise level high - switching to enhanced STT model" },
      { level: "INFO", message: "TTS response delivered in 0.8s - Hindi voice model" },
      { level: "ERROR", message: "Twilio webhook timeout - call routing to fallback IVR" },
    ],
    compliance: [
      { level: "INFO", message: "KYC verification completed for customer #38291 - status: APPROVED" },
      { level: "WARN", message: "Suspicious transaction pattern detected - flagging for review" },
      { level: "INFO", message: "RBI circular RBI/2025-26/42 compliance check: PASS" },
      { level: "ERROR", message: "AML screening service unavailable - queuing 12 pending checks" },
      { level: "WARN", message: "Customer data retention policy expiring for batch #7291" },
    ],
    fraud: [
      { level: "INFO", message: "Transaction scan: INR 2,50,000 - risk score: 0.12 (LOW)" },
      { level: "WARN", message: "Anomaly detected: Multiple login attempts from new device for account #67234" },
      { level: "INFO", message: "Geo-velocity check passed: Transaction from Mumbai (consistent with history)" },
      { level: "INFO", message: "ML model v3.2.1 prediction: legitimate - confidence: 0.994" },
      { level: "ERROR", message: "High-risk transaction blocked: INR 15,00,000 to unverified account" },
    ],
  }

  const allLogs: LogEntry[] = []
  const agentNames: Record<string, string> = {
    core: "BankVoiceAI Core",
    whatsapp: "WhatsApp Agent",
    voice: "Voice Call Agent",
    compliance: "Compliance Agent",
    fraud: "Fraud Detection Agent",
  }

  let id = 1
  const now = Date.now()

  for (const [agentId, msgs] of Object.entries(messages)) {
    for (let i = 0; i < msgs.length; i++) {
      const timeOffset = Math.floor(Math.random() * 3600000)
      allLogs.push({
        id: String(id++),
        timestamp: new Date(now - timeOffset).toISOString(),
        agent_id: agentId,
        agent_name: agentNames[agentId],
        level: msgs[i].level,
        message: msgs[i].message,
      })
    }
  }

  return allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export const analyticsData = {
  callsOverTime: [
    { date: "Mon", calls: 1820, previous: 1540 },
    { date: "Tue", calls: 2140, previous: 1780 },
    { date: "Wed", calls: 1960, previous: 1690 },
    { date: "Thu", calls: 2380, previous: 2010 },
    { date: "Fri", calls: 2720, previous: 2340 },
    { date: "Sat", calls: 1480, previous: 1280 },
    { date: "Sun", calls: 980, previous: 840 },
  ],
  callsPerAgent: [
    { name: "Core", calls: 1472, fill: "#0ea5e9" },
    { name: "WhatsApp", calls: 834, fill: "#06b6d4" },
    { name: "Voice", calls: 621, fill: "#22d3ee" },
    { name: "Compliance", calls: 289, fill: "#38bdf8" },
    { name: "Fraud", calls: 156, fill: "#67e8f9" },
  ],
  queryCategories: [
    { name: "Balance Inquiry", value: 35, fill: "#0ea5e9" },
    { name: "Loan Queries", value: 25, fill: "#06b6d4" },
    { name: "Fraud Alerts", value: 15, fill: "#22d3ee" },
    { name: "Account Services", value: 15, fill: "#38bdf8" },
    { name: "General Banking", value: 10, fill: "#67e8f9" },
  ],
  topQueries: [
    { query: "Check account balance", count: 4821, avg_response: "0.18s", escalation: "2.1%" },
    { query: "Loan EMI status", count: 3294, avg_response: "0.34s", escalation: "5.4%" },
    { query: "Fund transfer status", count: 2847, avg_response: "0.22s", escalation: "3.2%" },
    { query: "Fixed deposit rates", count: 2156, avg_response: "0.15s", escalation: "1.8%" },
    { query: "Credit card bill payment", count: 1893, avg_response: "0.41s", escalation: "6.7%" },
    { query: "Block lost card", count: 1672, avg_response: "0.12s", escalation: "8.3%" },
    { query: "KYC document update", count: 1234, avg_response: "0.56s", escalation: "12.1%" },
    { query: "Cheque book request", count: 987, avg_response: "0.28s", escalation: "2.9%" },
  ],
}

export const pricingTiers = [
  {
    name: "Starter",
    price: 1500,
    fetPrice: 450,
    calls: "5,000",
    features: [
      "BankVoiceAI Core Agent",
      "Basic analytics dashboard",
      "Email support",
      "5,000 calls/month",
      "Standard response time",
      "Basic compliance checks",
    ],
    highlighted: false,
  },
  {
    name: "Professional",
    price: 3000,
    fetPrice: 900,
    calls: "15,000",
    features: [
      "All Starter features",
      "WhatsApp Agent",
      "Voice Call Agent",
      "Advanced analytics",
      "15,000 calls/month",
      "Priority support",
      "Custom prompts",
      "Webhook integrations",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: 6000,
    fetPrice: 1800,
    calls: "Unlimited",
    features: [
      "All Professional features",
      "Compliance Agent",
      "Fraud Detection Agent",
      "Unlimited calls",
      "Dedicated account manager",
      "Custom SLA",
      "RBI compliance suite",
      "On-premise deployment option",
      "24/7 phone support",
    ],
    highlighted: false,
  },
]
