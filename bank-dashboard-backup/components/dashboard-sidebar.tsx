"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Bot,
  ScrollText,
  BarChart3,
  Settings,
  Zap,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/agents", label: "Agent Control", icon: Bot },
  { href: "/dashboard/logs", label: "Live Logs", icon: ScrollText },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Shield className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-sidebar-foreground">BankVoiceAI</span>
          <span className="text-[10px] text-muted-foreground">Powered by Fetch.ai</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        <span className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Navigation
        </span>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
              {item.label === "Live Logs" && (
                <Badge className="ml-auto bg-primary/20 text-primary text-[10px] px-1.5 py-0 border-0">
                  LIVE
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-secondary p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-sidebar-foreground">Professional Tier</span>
          </div>
          <div className="mb-2">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>3,420 / 15,000 calls</span>
              <span>22.8%</span>
            </div>
            <div className="h-1.5 rounded-full bg-border">
              <div className="h-full w-[22.8%] rounded-full bg-primary" />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">Expires Mar 21, 2026</p>
        </div>
      </div>
    </aside>
  )
}
