"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { subscription, pricingTiers } from "@/lib/mock-data"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Webhook,
  Wallet,
  Phone,
  Shield,
  CreditCard,
  Save,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [complianceSettings, setComplianceSettings] = useState({
    kycVerification: true,
    amlScreening: true,
    transactionMonitoring: true,
    dataRetention: true,
    consentManagement: false,
  })

  const handleSave = (section: string) => {
    toast.success(`${section} settings saved`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage integrations, credentials, and subscription
        </p>
      </div>

      <div className="space-y-6">
        {/* Webhook URLs */}
        <SettingsSection
          icon={Webhook}
          title="Webhook URLs"
          description="Configure callback URLs for agent integrations"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                WhatsApp Webhook URL
              </label>
              <Input
                className="bg-secondary border-border font-mono text-sm"
                defaultValue="https://api.bankvoiceai.com/webhook/whatsapp"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Voice Call Webhook URL
              </label>
              <Input
                className="bg-secondary border-border font-mono text-sm"
                defaultValue="https://api.bankvoiceai.com/webhook/voice"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Status Callback URL
              </label>
              <Input
                className="bg-secondary border-border font-mono text-sm"
                defaultValue="https://api.bankvoiceai.com/webhook/status"
              />
            </div>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleSave("Webhook")}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" /> Save Webhooks
            </Button>
          </div>
        </SettingsSection>

        {/* Wallet & Twilio */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SettingsSection
            icon={Wallet}
            title="FET Wallet"
            description="Your Fetch.ai wallet for subscription payments"
          >
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Wallet Address
                </label>
                <Input
                  className="bg-secondary border-border font-mono text-sm"
                  defaultValue={subscription.fet_wallet}
                />
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Current Balance</span>
                  <span className="text-sm font-bold text-foreground">2,450 FET</span>
                </div>
              </div>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => handleSave("Wallet")}
              >
                <Save className="mr-1.5 h-3.5 w-3.5" /> Update Wallet
              </Button>
            </div>
          </SettingsSection>

          <SettingsSection
            icon={Phone}
            title="Twilio Credentials"
            description="Voice call integration settings"
          >
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Account SID
                </label>
                <Input
                  className="bg-secondary border-border font-mono text-sm"
                  type="password"
                  defaultValue="AC7f8e9d2c4b1a3f5e6d7c8b9a0"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Auth Token
                </label>
                <Input
                  className="bg-secondary border-border font-mono text-sm"
                  type="password"
                  defaultValue="your-auth-token-here"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Phone Number
                </label>
                <Input
                  className="bg-secondary border-border text-sm"
                  defaultValue="+91-1800-XXX-XXXX"
                />
              </div>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => handleSave("Twilio")}
              >
                <Save className="mr-1.5 h-3.5 w-3.5" /> Save Credentials
              </Button>
            </div>
          </SettingsSection>
        </div>

        {/* RBI Compliance */}
        <SettingsSection
          icon={Shield}
          title="RBI Compliance Settings"
          description="Regulatory compliance controls for Indian banking"
        >
          <div className="space-y-4">
            {Object.entries(complianceSettings).map(([key, value]) => {
              const labels: Record<string, { title: string; desc: string }> = {
                kycVerification: { title: "KYC Verification", desc: "Require identity verification before account operations" },
                amlScreening: { title: "AML Screening", desc: "Anti-money laundering checks on all transactions" },
                transactionMonitoring: { title: "Transaction Monitoring", desc: "Real-time monitoring of suspicious patterns" },
                dataRetention: { title: "Data Retention Policy", desc: "Automatically purge data per RBI guidelines" },
                consentManagement: { title: "Consent Management", desc: "Explicit user consent for data processing" },
              }
              const label = labels[key]
              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg bg-secondary p-4"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{label.title}</p>
                    <p className="text-xs text-muted-foreground">{label.desc}</p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) =>
                      setComplianceSettings((prev) => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              )
            })}
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleSave("Compliance")}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" /> Save Compliance Settings
            </Button>
          </div>
        </SettingsSection>

        {/* Subscription Management */}
        <SettingsSection
          icon={CreditCard}
          title="Subscription Management"
          description="Manage your current plan and billing"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={cn(
                    "rounded-lg border p-4",
                    tier.name.toLowerCase() === subscription.tier
                      ? "border-primary bg-primary/5"
                      : "border-border bg-secondary"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{tier.name}</span>
                    {tier.name.toLowerCase() === subscription.tier && (
                      <Badge className="bg-primary/15 text-primary border-0 text-[10px]">Current</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xl font-bold text-foreground">${tier.price}<span className="text-sm text-muted-foreground font-normal">/mo</span></p>
                  <p className="text-xs text-muted-foreground">{tier.calls} calls/month</p>
                  {tier.name.toLowerCase() !== subscription.tier && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full border-border text-foreground hover:bg-card"
                      onClick={() => toast.success(`Upgrade to ${tier.name} initiated`)}
                    >
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                      {tier.price > (pricingTiers.find(t => t.name.toLowerCase() === subscription.tier)?.price || 0) ? "Upgrade" : "Downgrade"}
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4">
              <Button
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => setShowCancelDialog(true)}
              >
                <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                Cancel Subscription
              </Button>
            </div>
          </div>
        </SettingsSection>
      </div>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Cancel Subscription?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This will deactivate all agents and stop processing calls at the end of your current billing period ({subscription.expiry}).
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} className="border-border text-foreground hover:bg-secondary">
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowCancelDialog(false)
                toast("Subscription cancellation requested", {
                  description: `Active until ${subscription.expiry}`,
                })
              }}
            >
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
