"use client"

import { StatsRow } from "@/components/dashboard/stats-row"
import { AgentGrid } from "@/components/dashboard/agent-grid"
import { subscription } from "@/lib/mock-data"
import { Progress } from "@/components/ui/progress"

export default function DashboardPage() {
  const usagePercent = (subscription.calls_used / subscription.calls_limit) * 100

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time overview of your AI banking agents
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-6 rounded-xl border border-border bg-card px-5 py-3">
          <div>
            <p className="text-[10px] text-muted-foreground">Calls Used</p>
            <p className="text-sm font-bold text-foreground">
              {subscription.calls_used.toLocaleString()} / {subscription.calls_limit.toLocaleString()}
            </p>
          </div>
          <div className="w-32">
            <Progress value={usagePercent} className="h-2 bg-border [&>div]:bg-primary" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Wallet</p>
            <p className="text-sm font-mono text-foreground">{subscription.fet_wallet}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Expires</p>
            <p className="text-sm font-medium text-foreground">{subscription.expiry}</p>
          </div>
        </div>
      </div>

      <StatsRow />
      <AgentGrid />
    </div>
  )
}
