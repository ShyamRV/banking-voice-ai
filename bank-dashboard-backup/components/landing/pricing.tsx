import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { pricingTiers } from "@/lib/mock-data"

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground lg:text-4xl text-balance">
            Transparent, Predictable Pricing
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Pay with FET tokens. No hidden fees. Scale as you grow.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative flex flex-col rounded-xl border p-8 transition-colors",
                tier.highlighted
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              {tier.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground border-0 px-3">
                  Most Popular
                </Badge>
              )}

              <h3 className="text-xl font-semibold text-foreground">{tier.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">${tier.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                ~{tier.fetPrice} FET tokens
              </p>
              <p className="mt-2 text-sm text-primary font-medium">
                {tier.calls} calls/month
              </p>

              <ul className="mt-8 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={cn(
                  "mt-8 w-full h-11",
                  tier.highlighted
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                )}
              >
                <Link href="/subscribe">Subscribe with FET</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
