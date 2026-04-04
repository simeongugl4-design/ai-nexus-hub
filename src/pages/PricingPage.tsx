import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Crown, Rocket, Sparkles, ArrowRight } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with AI-powered tools at no cost",
    icon: Zap,
    color: "border-muted",
    bgGlow: "",
    features: [
      "50 AI messages/day",
      "Basic research queries",
      "Code assistant (limited)",
      "Math solver (limited)",
      "Community support",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$8",
    period: "/month",
    description: "Unlimited power for individuals and creators",
    icon: Sparkles,
    color: "border-primary/60",
    bgGlow: "glow-primary",
    features: [
      "Unlimited AI messages",
      "GPT-5, GPT-5.2 & Gemini Pro",
      "Deep Research with citations",
      "Advanced code assistant",
      "Math solver — all features",
      "Document AI analysis",
      "Image AI generation",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Team",
    price: "$16",
    period: "/month per user",
    description: "Collaborate with your team on AI workflows",
    icon: Crown,
    color: "border-secondary/60",
    bgGlow: "glow-secondary",
    features: [
      "Everything in Pro",
      "Team workspace & sharing",
      "Knowledge base collaboration",
      "Admin dashboard & analytics",
      "API access",
      "Custom integrations",
      "Dedicated support",
    ],
    cta: "Start Team Trial",
    popular: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Tailored solutions for large organizations",
    icon: Rocket,
    color: "border-[hsl(150,80%,50%)]/40",
    bgGlow: "",
    features: [
      "Everything in Team",
      "Unlimited users",
      "Custom AI model fine-tuning",
      "On-premise deployment option",
      "SSO & advanced security",
      "SLA guarantee",
      "24/7 priority support",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const comparisons = [
  { feature: "AI Chat", megakumul: "$8/mo", chatgpt: "$20/mo", perplexity: "$20/mo" },
  { feature: "Deep Research", megakumul: "Included", chatgpt: "$200/mo", perplexity: "$20/mo" },
  { feature: "Code Assistant", megakumul: "Included", chatgpt: "$20/mo", perplexity: "N/A" },
  { feature: "Math Solver", megakumul: "Included", chatgpt: "$20/mo", perplexity: "N/A" },
  { feature: "Image AI", megakumul: "Included", chatgpt: "$20/mo", perplexity: "N/A" },
  { feature: "Document AI", megakumul: "Included", chatgpt: "N/A", perplexity: "N/A" },
  { feature: "GPT-5 & Gemini Pro", megakumul: "✅", chatgpt: "GPT only", perplexity: "Limited" },
  { feature: "AI Diagrams", megakumul: "✅", chatgpt: "N/A", perplexity: "N/A" },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [selectedModel, setSelectedModel] = useState("research");
  const navigate = useNavigate();

  const getPrice = (plan: typeof plans[0]) => {
    if (plan.price === "$0" || plan.price === "Custom") return plan.price;
    const monthly = parseInt(plan.price.replace("$", ""));
    if (billing === "yearly") return `$${Math.round(monthly * 0.8)}`;
    return plan.price;
  };

  const handleSelect = (planName: string) => {
    if (planName === "Enterprise") {
      toast.info("Contact us at sales@megakumul.ai for enterprise pricing");
      return;
    }
    toast.success(`${planName} plan selected! Redirecting to setup...`);
    setTimeout(() => navigate("/settings"), 1000);
  };

  return (
    <div className="flex h-screen flex-col">
      <TopNav selectedModel={selectedModel} onModelChange={setSelectedModel} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-6xl px-4 py-12">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl font-heading font-bold gradient-text mb-3">
              Simple, Affordable Pricing
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              Get more AI power for less. All the tools ChatGPT and Perplexity offer — and more — at a fraction of the cost.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-3 rounded-xl border border-border bg-card p-1">
              <button
                onClick={() => setBilling("monthly")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${billing === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${billing === "yearly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Yearly <span className="text-xs opacity-80">(-20%)</span>
              </button>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl border ${plan.color} bg-card p-6 flex flex-col ${plan.popular ? plan.bgGlow : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <plan.icon className="h-5 w-5 text-primary" />
                  <h3 className="font-heading font-bold text-foreground">{plan.name}</h3>
                </div>
                <div className="mb-2">
                  <span className="text-3xl font-heading font-bold text-foreground">{getPrice(plan)}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelect(plan.name)}
                  className={`w-full rounded-xl py-2.5 text-sm font-medium transition-all ${plan.popular ? "bg-primary text-primary-foreground hover:opacity-90" : "border border-border text-foreground hover:bg-muted"}`}
                >
                  {plan.cta}
                  <ArrowRight className="inline ml-1 h-3.5 w-3.5" />
                </motion.button>
              </motion.div>
            ))}
          </div>

          {/* Comparison Table */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <h2 className="text-2xl font-heading font-bold text-center gradient-text mb-6">
              Why MegaKUMUL Wins
            </h2>
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-muted-foreground font-medium">Feature</th>
                    <th className="p-4 text-center font-heading font-bold text-primary">MegaKUMUL</th>
                    <th className="p-4 text-center text-muted-foreground">ChatGPT</th>
                    <th className="p-4 text-center text-muted-foreground">Perplexity</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((row, i) => (
                    <tr key={row.feature} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                      <td className="p-4 text-foreground font-medium">{row.feature}</td>
                      <td className="p-4 text-center text-primary font-semibold">{row.megakumul}</td>
                      <td className="p-4 text-center text-muted-foreground">{row.chatgpt}</td>
                      <td className="p-4 text-center text-muted-foreground">{row.perplexity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">
              * Prices as of 2025. All MegaKUMUL Pro features included at $8/mo vs $20–$200/mo for competitors.
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-center mt-12 mb-8">
            <h3 className="text-xl font-heading font-bold text-foreground mb-2">Ready to save 60%+ on AI tools?</h3>
            <p className="text-muted-foreground mb-4">Join thousands switching from overpriced AI subscriptions.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect("Pro")}
              className="rounded-xl bg-primary px-8 py-3 text-sm font-bold text-primary-foreground glow-primary hover:opacity-90"
            >
              Start Free — Upgrade Anytime <ArrowRight className="inline ml-1 h-4 w-4" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
