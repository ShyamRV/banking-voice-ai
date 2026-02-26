"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getAgents, startAgent, stopAgent, type Agent, type AgentStatus } from "@/lib/api"
import { Activity, ExternalLink } from "lucide-react"
import { toast } from "sonner"

function StatusDot({ status }: { status: AgentStatus }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {status === "active" && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
      )}
      <span
        className={cn(
          "relative inline-flex h-2.5 w-2.5 rounded-full",
          status === "active" && "bg-success",
          status === "degraded" && "bg-warning",
          status === "inactive" && "bg-muted-foreground"
        )}
      />
    </span>
  )
}

function AgentCard({ agent, onToggle }: { agent: Agent; onToggle: (id: string, enabled: boolean) => void }) {
  const [enabled, setEnabled] = useState(agent.status !== "inactive")
  const [loading, setLoading] = useState(false)

  const handleToggle = async (checked: boolean) => {
    setLoading(true)
    try {
      if (checked) {
        await startAgent(agent.id)
        toast.success(`${agent.name} started`, {
          description: `Agent is now active at ${agent.address}`,
        })
      } else {
        await stopAgent(agent.id)
        toast(`${agent.name} stopped`, {
          description: "Agent has been safely shut down",
        })
      }
      setEnabled(checked)
      onToggle(agent.id, checked)
    } catch (e) {
      toast.error("Failed to update agent", { description: "Check API connection" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/20">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <StatusDot status={enabled ? agent.status : "inactive"} />
          <div>
            <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{agent.address}</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} disabled={loading} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4">
        <div>
          <p className="text-[10px] text-muted-foreground">Calls Today</p>
          <p className="text-lg font-bold text-foreground">{agent.calls_today.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Uptime</p>
          <p className="text-lg font-bold text-foreground">{agent.uptime}%</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Health</p>
          <p className={cn(
            "text-lg font-bold",
            agent.health_score >= 90 ? "text-success" :
            agent.health_score >= 70 ? "text-warning" : "text-destructive"
          )}>
            {agent.health_score}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Activity className="h-3 w-3" />
          Last active: {agent.last_active}
        </div>
        <Link
          href={`/dashboard/agents?id=${agent.id}`}
          className="flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
        >
          Details <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <Badge
        className={cn(
          "mt-3 text-[10px] border-0",
          agent.tier_required === "starter" && "bg-secondary text-muted-foreground",
          agent.tier_required === "professional" && "bg-primary/15 text-primary",
          agent.tier_required === "enterprise" && "bg-accent/15 text-accent"
        )}
      >
        {agent.tier_required}
      </Badge>
    </div>
  )
}

export function AgentGrid() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAgents = async () => {
    try {
      const data = await getAgents()
      setAgents(data)
    } catch (e) {
      toast.error("Failed to fetch agents", { description: "Is the API server running on port 8003?" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchAgents, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleToggle = (id: string, enabled: boolean) => {
    setAgents((prev) =>
      prev.map((a) => a.id === id ? { ...a, status: enabled ? "active" : "inactive" } : a)
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-48 rounded-xl border border-border bg-card animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Agent Status</h2>
        <Badge className="bg-success/15 text-success border-0 text-xs">
          {agents.filter((a) => a.status === "active").length} Active
        </Badge>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onToggle={handleToggle} />
        ))}
      </div>
    </div>
  )
}
