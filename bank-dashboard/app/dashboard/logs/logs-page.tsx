"use client"

import { useState, useEffect, useMemo } from "react"
import { getLogs, createLogStream, type LogEntry } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Download, Search, RefreshCw, Circle } from "lucide-react"
import { toast } from "sonner"

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [agentFilter, setAgentFilter] = useState("all")
  const [levelFilter, setLevelFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isStreaming, setIsStreaming] = useState(true)
  const [connected, setConnected] = useState(false)

  // Initial load
  useEffect(() => {
    getLogs().then(setLogs).catch(() => {
      toast.error("Failed to load logs", { description: "Is the API server running on port 8003?" })
    })
  }, [])

  // Live WebSocket stream
  useEffect(() => {
    if (!isStreaming) return

    const cleanup = createLogStream(
      (log) => {
        setConnected(true)
        setLogs((prev) => [log, ...prev].slice(0, 200))
      },
      () => setConnected(false)
    )

    return cleanup
  }, [isStreaming])

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (agentFilter !== "all" && log.agent_id !== agentFilter) return false
      if (levelFilter !== "all" && log.level !== levelFilter) return false
      if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [logs, agentFilter, levelFilter, searchQuery])

  const exportCSV = () => {
    const headers = "Timestamp,Agent,Level,Message\n"
    const rows = filteredLogs
      .map((log) => `"${log.timestamp}","${log.agent_name}","${log.level}","${log.message}"`)
      .join("\n")
    const blob = new Blob([headers + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "bankvoiceai-logs.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Logs exported")
  }

  const levelColors = {
    INFO: "text-sky-400",
    WARN: "text-yellow-400",
    ERROR: "text-red-400",
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Live Logs</h1>
          <p className="text-sm text-muted-foreground">Real-time agent activity stream</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border",
            connected ? "border-success/30 text-success bg-success/10" : "border-border text-muted-foreground"
          )}>
            <Circle className={cn("h-2 w-2 fill-current", connected ? "animate-pulse" : "")} />
            {connected ? "Live" : "Polling"}
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsStreaming(!isStreaming)}>
            <RefreshCw className={cn("h-3 w-3 mr-1", isStreaming && "animate-spin")} />
            {isStreaming ? "Pause" : "Resume"}
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-3 w-3 mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            className="pl-9 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="All Agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            <SelectItem value="core">Core Agent</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="voice">Voice</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
            <SelectItem value="fraud">Fraud Detection</SelectItem>
          </SelectContent>
        </Select>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-32 h-9">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="INFO">INFO</SelectItem>
            <SelectItem value="WARN">WARN</SelectItem>
            <SelectItem value="ERROR">ERROR</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="h-9 px-3 flex items-center">
          {filteredLogs.length} entries
        </Badge>
      </div>

      {/* Log stream */}
      <div className="rounded-xl border border-border bg-card font-mono text-xs overflow-hidden">
        <div className="h-[600px] overflow-y-auto p-4 space-y-1">
          {filteredLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No logs match your filters</p>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="flex gap-3 hover:bg-muted/30 px-1 py-0.5 rounded">
                <span className="text-muted-foreground shrink-0 w-20 text-[10px]">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className={cn("shrink-0 w-16 font-semibold", levelColors[log.level])}>
                  {log.level}
                </span>
                <span className="text-sky-500 shrink-0 w-24 truncate">{log.agent_name}</span>
                <span className="text-muted-foreground">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
