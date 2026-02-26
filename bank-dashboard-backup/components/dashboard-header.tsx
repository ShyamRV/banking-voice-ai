"use client"

import { Badge } from "@/components/ui/badge"
import { Bell, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { subscription } from "@/lib/mock-data"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-foreground">{subscription.bank_name}</h2>
        <Badge className="bg-primary/15 text-primary border-primary/20 text-[10px]">
          {subscription.tier.toUpperCase()}
        </Badge>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search agents, logs..."
            className="w-64 bg-secondary border-border pl-9 text-sm h-9"
          />
        </div>
        <button className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          NB
        </div>
      </div>
    </header>
  )
}
