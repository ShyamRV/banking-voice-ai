"use client"

import dynamic from "next/dynamic"
import { Toaster } from "@/components/ui/sonner"

const DashboardSidebar = dynamic(
  () => import("@/components/dashboard-sidebar").then((mod) => mod.DashboardSidebar),
  { ssr: false }
)

const DashboardHeader = dynamic(
  () => import("@/components/dashboard-header").then((mod) => mod.DashboardHeader),
  { ssr: false }
)

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardSidebar />
      <div className="ml-64 min-h-screen">
        <DashboardHeader />
        <main className="p-6">{children}</main>
      </div>
      <Toaster />
    </>
  )
}
