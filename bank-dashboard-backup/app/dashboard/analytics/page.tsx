"use client"

import { analyticsData } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts"
import { TrendingUp, Calculator } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const COLORS = ["#0ea5e9", "#06b6d4", "#22d3ee", "#38bdf8", "#67e8f9"]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
      <p className="mb-1 text-xs font-medium text-foreground">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

function CostSavingsCalculator() {
  const [humanAgents, setHumanAgents] = useState(50)
  const costPerHumanAgent = 35000 // INR per month
  const aiCostPerMonth = 3000 // USD (professional tier)
  const humanCost = humanAgents * costPerHumanAgent
  const savings = humanCost - (aiCostPerMonth * 83) // approximate INR conversion
  const savingsPercent = ((savings / humanCost) * 100).toFixed(1)

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Calculator className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Cost Savings Calculator</h3>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Number of Human Agents
          </label>
          <Input
            type="number"
            value={humanAgents}
            onChange={(e) => setHumanAgents(Number(e.target.value))}
            className="bg-secondary border-border text-sm"
          />
          <p className="mt-1 text-[10px] text-muted-foreground">
            Avg cost: INR {costPerHumanAgent.toLocaleString("en-IN")}/agent/month
          </p>
        </div>
        <div className="rounded-lg bg-secondary p-4">
          <p className="text-[10px] text-muted-foreground">Human Agent Cost (Monthly)</p>
          <p className="text-2xl font-bold text-foreground">
            INR {humanCost.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-lg bg-primary/10 p-4">
          <p className="text-[10px] text-muted-foreground">Estimated Savings</p>
          <p className="text-2xl font-bold text-success">
            INR {savings > 0 ? savings.toLocaleString("en-IN") : 0}
          </p>
          <p className="mt-1 text-xs text-success">
            {Number(savingsPercent) > 0 ? `${savingsPercent}% cost reduction` : "Add more agents to see savings"}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Performance metrics and insights across all agents
          </p>
        </div>
        <Badge className="bg-primary/15 text-primary border-0">
          <TrendingUp className="mr-1 h-3 w-3" /> This Week
        </Badge>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Calls over time */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 font-semibold text-foreground">Calls Over Time</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={analyticsData.callsOverTime}>
              <defs>
                <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "#1e293b" }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "#1e293b" }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="calls"
                stroke="#0ea5e9"
                strokeWidth={2}
                fill="url(#callsGradient)"
                name="This Week"
              />
              <Line
                type="monotone"
                dataKey="previous"
                stroke="#64748b"
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
                name="Previous Week"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Calls per agent */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 font-semibold text-foreground">Calls per Agent</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analyticsData.callsPerAgent}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "#1e293b" }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "#1e293b" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="calls" radius={[4, 4, 0, 0]} name="Calls">
                {analyticsData.callsPerAgent.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Query categories pie chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 font-semibold text-foreground">Query Categories</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={analyticsData.queryCategories}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {analyticsData.queryCategories.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {analyticsData.queryCategories.map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-muted-foreground">{cat.name}</span>
                </div>
                <span className="font-medium text-foreground">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top queries table */}
        <div className="col-span-1 lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-semibold text-foreground">Top Queries</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Query</th>
                  <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Count</th>
                  <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Avg Response</th>
                  <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Escalation</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.topQueries.map((q) => (
                  <tr key={q.query} className="border-b border-border/50 transition-colors hover:bg-secondary/50">
                    <td className="px-5 py-3 text-sm text-foreground">{q.query}</td>
                    <td className="px-5 py-3 text-right text-sm font-mono text-foreground">{q.count.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-sm font-mono text-muted-foreground">{q.avg_response}</td>
                    <td className="px-5 py-3 text-right">
                      <Badge
                        className={`text-[10px] border-0 ${
                          parseFloat(q.escalation) > 8
                            ? "bg-destructive/15 text-destructive"
                            : parseFloat(q.escalation) > 5
                            ? "bg-warning/15 text-warning"
                            : "bg-success/15 text-success"
                        }`}
                      >
                        {q.escalation}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cost savings calculator */}
      <CostSavingsCalculator />
    </div>
  )
}
