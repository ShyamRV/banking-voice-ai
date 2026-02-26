"use client"

import { Phone, Bot, Activity, IndianRupee, TrendingUp } from "lucide-react"
import { agents, subscription } from "@/lib/mock-data"

const stats = [
  {
    label: "Total Calls Today",
    value: agents.reduce((sum, a) => sum + a.calls_today, 0).toLocaleString("en-IN"),
    change: "+12.4%",
    icon: Phone,
  },
  {
    label: "Active Agents",
    value: `${agents.filter((a) => a.status === "active").length}/${agents.length}`,
    change: "Healthy",
    icon: Bot,
  },
  {
    label: "Avg. Uptime",
    value: `${(agents.reduce((sum, a) => sum + a.uptime, 0) / agents.length).toFixed(1)}%`,
    change: "+0.3%",
    icon: Activity,
  },
  {
    label: "Cost Saved (MTD)",
    value: `$${(subscription.cost_saved / 100000).toFixed(1)}L`,
    change: "+18.2%",
    icon: IndianRupee,
  },
]

export function StatsRow() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <stat.icon className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-foreground">{stat.value}</div>
          <div className="mt-1 flex items-center gap-1 text-xs text-success">
            <TrendingUp className="h-3 w-3" />
            {stat.change}
          </div>
        </div>
      ))}
    </div>
  )
}
