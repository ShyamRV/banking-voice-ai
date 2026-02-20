import { Bot, Phone, MessageSquare, ShieldCheck, Search, BarChart3 } from "lucide-react"

const features = [
  {
    icon: Bot,
    title: "Autonomous AI Agents",
    description: "Deploy intelligent agents on Fetch.ai Agentverse that handle banking queries autonomously 24/7.",
  },
  {
    icon: Phone,
    title: "Voice Call Integration",
    description: "Twilio-powered voice agents with real-time STT/TTS supporting Hindi, English, and 10+ regional languages.",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Business",
    description: "Full WhatsApp Business API integration for handling customer queries, statements, and transactions.",
  },
  {
    icon: ShieldCheck,
    title: "RBI Compliance",
    description: "Built-in regulatory compliance checks aligned with RBI circulars and AML/KYC requirements.",
  },
  {
    icon: Search,
    title: "Fraud Detection",
    description: "ML-powered real-time fraud detection analyzing transaction patterns and behavioral anomalies.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Bloomberg-grade analytics with real-time call metrics, agent performance, and cost savings tracking.",
  },
]

export function Features() {
  return (
    <section className="py-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground lg:text-4xl text-balance">
            Enterprise-Grade Banking AI
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Purpose-built for Indian banking infrastructure with regulatory compliance at its core.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
