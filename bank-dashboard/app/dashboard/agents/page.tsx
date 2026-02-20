"use client"

import { useState } from "react"
import { agents, type Agent, type AgentStatus } from "@/lib/mock-data"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Activity,
  Copy,
  Rocket,
  Settings,
  Shield,
  Phone,
  MessageSquare,
  Bot,
  Search as SearchIcon,
} from "lucide-react"

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

const agentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  core: Bot,
  whatsapp: MessageSquare,
  voice: Phone,
  compliance: Shield,
  fraud: SearchIcon,
}

function AgentDetailPanel({ agent }: { agent: Agent }) {
  const [enabled, setEnabled] = useState(agent.status !== "inactive")
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingState, setPendingState] = useState(false)

  const Icon = agentIcons[agent.id] || Bot

  const handleToggle = (checked: boolean) => {
    if (!checked) {
      setPendingState(false)
      setShowConfirm(true)
    } else {
      setEnabled(true)
      toast.success(`${agent.name} started`, { description: "Agent is now accepting requests" })
    }
  }

  const confirmStop = () => {
    setEnabled(false)
    setShowConfirm(false)
    toast(`${agent.name} stopped`, { description: "Agent has been safely shut down" })
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{agent.name}</h3>
              <p className="text-xs text-muted-foreground">{agent.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <StatusDot status={enabled ? agent.status : "inactive"} />
            <Switch checked={enabled} onCheckedChange={handleToggle} />
          </div>
        </div>

        <Tabs defaultValue="overview" className="p-0">
          <TabsList className="mx-5 mt-4 bg-secondary">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="deploy">Deploy</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-5 pt-4">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-lg bg-secondary p-4">
                <p className="text-[10px] text-muted-foreground">Calls Today</p>
                <p className="text-xl font-bold text-foreground">{agent.calls_today.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-secondary p-4">
                <p className="text-[10px] text-muted-foreground">Uptime</p>
                <p className="text-xl font-bold text-foreground">{agent.uptime}%</p>
              </div>
              <div className="rounded-lg bg-secondary p-4">
                <p className="text-[10px] text-muted-foreground">Health Score</p>
                <p className={cn(
                  "text-xl font-bold",
                  agent.health_score >= 90 ? "text-success" :
                  agent.health_score >= 70 ? "text-warning" : "text-destructive"
                )}>
                  {agent.health_score}/100
                </p>
              </div>
              <div className="rounded-lg bg-secondary p-4">
                <p className="text-[10px] text-muted-foreground">Last Active</p>
                <p className="text-xl font-bold text-foreground">{agent.last_active}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                <div>
                  <p className="text-[10px] text-muted-foreground">Agent Address (Agentverse)</p>
                  <p className="font-mono text-sm text-foreground">{agent.address}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border text-foreground hover:bg-card"
                  onClick={() => {
                    navigator.clipboard.writeText(agent.address)
                    toast.success("Address copied")
                  }}
                >
                  <Copy className="mr-1.5 h-3 w-3" /> Copy
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                <div>
                  <p className="text-[10px] text-muted-foreground">Fetch Wallet Address</p>
                  <p className="font-mono text-sm text-foreground">{agent.fetchAddress}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border text-foreground hover:bg-card"
                  onClick={() => {
                    navigator.clipboard.writeText(agent.fetchAddress)
                    toast.success("Address copied")
                  }}
                >
                  <Copy className="mr-1.5 h-3 w-3" /> Copy
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="config" className="p-5 pt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">System Prompt</label>
              <Textarea
                className="bg-secondary border-border font-mono text-sm min-h-[120px]"
                defaultValue={`You are ${agent.name}, an AI banking assistant. Respond professionally and accurately to customer queries. Always verify identity before sharing account details.`}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Response Timeout (ms)</label>
                <Input className="bg-secondary border-border text-sm" defaultValue="5000" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Max Retries</label>
                <Input className="bg-secondary border-border text-sm" defaultValue="3" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Confidence Threshold</label>
                <Input className="bg-secondary border-border text-sm" defaultValue="0.85" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Escalation Threshold</label>
                <Input className="bg-secondary border-border text-sm" defaultValue="0.60" />
              </div>
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => toast.success("Configuration saved")}>
              <Settings className="mr-1.5 h-3.5 w-3.5" /> Save Configuration
            </Button>
          </TabsContent>

          <TabsContent value="deploy" className="p-5 pt-4">
            <div className="rounded-lg border border-border bg-secondary p-6 text-center">
              <Rocket className="mx-auto mb-3 h-8 w-8 text-primary" />
              <h4 className="mb-1 font-semibold text-foreground">Deploy to Agentverse</h4>
              <p className="mb-4 text-sm text-muted-foreground">
                Push the latest configuration to the Fetch.ai Agentverse network
              </p>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => toast.success("Deployment initiated", { description: "Agent will be live in ~30 seconds" })}>
                <Rocket className="mr-1.5 h-3.5 w-3.5" /> Deploy Now
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Stop {agent.name}?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This will stop the agent from processing any new requests. Active sessions will be gracefully terminated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="border-border text-foreground hover:bg-secondary">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmStop}>
              Stop Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function AgentControlPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Agent Control</h1>
        <p className="text-sm text-muted-foreground">
          Manage, configure, and deploy your AI banking agents
        </p>
      </div>

      <div className="space-y-6">
        {agents.map((agent) => (
          <AgentDetailPanel key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  )
}
