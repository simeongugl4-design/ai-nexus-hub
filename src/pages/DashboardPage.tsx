import { motion } from "framer-motion";
import { MessageSquare, Search, Code, FileText, ArrowRight, Sparkles, Brain, Globe, Shield, Calculator, ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TopNav } from "@/components/TopNav";
import { useState } from "react";
import megakumulLogo from "@/assets/megakumul-logo.png";

const features = [
  { icon: MessageSquare, title: "AI Chat", desc: "Conversational intelligence powered by advanced AI models", url: "/chat", gradient: "from-[hsl(195,100%,50%)] to-[hsl(210,100%,60%)]" },
  { icon: Search, title: "Deep Research", desc: "Real-time web research with citations and sources", url: "/research", gradient: "from-[hsl(270,60%,55%)] to-[hsl(290,60%,60%)]" },
  { icon: Code, title: "Code Assistant", desc: "Generate, debug, and explain code in any language", url: "/code", gradient: "from-[hsl(150,80%,40%)] to-[hsl(170,70%,50%)]" },
  { icon: FileText, title: "Document Intelligence", desc: "Upload and chat with your documents and papers", url: "/documents", gradient: "from-[hsl(30,90%,55%)] to-[hsl(45,90%,55%)]" },
  { icon: Calculator, title: "Math Solver", desc: "Step-by-step math solutions with LaTeX rendering", url: "/math", gradient: "from-[hsl(195,100%,50%)] to-[hsl(220,80%,60%)]" },
  { icon: ImageIcon, title: "Image AI", desc: "Generate stunning AI images from text descriptions", url: "/image-ai", gradient: "from-[hsl(45,90%,55%)] to-[hsl(30,90%,55%)]" },
];

const capabilities = [
  { icon: Sparkles, label: "Multi-Model AI", desc: "Switch between 5+ AI models" },
  { icon: Brain, label: "Deep Reasoning", desc: "Complex problem-solving" },
  { icon: Globe, label: "100+ Languages", desc: "Multilingual support" },
  { icon: Shield, label: "Private & Secure", desc: "Your data stays yours" },
];

const stats = [
  { value: "5+", label: "AI Models" },
  { value: "100+", label: "Languages" },
  { value: "Real-time", label: "Research" },
  { value: "∞", label: "Possibilities" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = useState("creative");
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <div className="flex h-screen flex-col">
      <TopNav selectedModel={selectedModel} onModelChange={setSelectedModel} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Hero */}
        <div className="relative min-h-[70vh] w-full overflow-hidden flex items-center justify-center bg-gradient-to-b from-background/80 via-card/60 to-background/80">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(195,100%,50%,0.1),transparent_70%)]" />
          </div>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-20 text-center px-6 py-20">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }} className="mx-auto mb-8">
              <img src={megakumulLogo} alt="MegaKUMUL" className="h-24 w-24 mx-auto rounded-3xl object-cover shadow-[0_0_40px_hsl(195,100%,50%,0.3)]" />
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-4 text-6xl sm:text-7xl font-heading font-bold leading-tight">
              <span className="gradient-text glow-text">MegaKUMUL</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mx-auto mb-10 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
              AI Research & Intelligence Platform — combining conversational AI, real-time research, code generation, and document intelligence.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="flex flex-wrap items-center justify-center gap-4">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/chat")} className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 font-semibold text-lg transition-all gradient-primary glow-primary text-primary-foreground">
                Start Chatting <ArrowRight className="h-5 w-5" />
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/research")} className="inline-flex items-center gap-2 rounded-2xl border border-border px-8 py-4 font-semibold text-lg text-foreground transition-all hover:bg-surface-elevated hover:border-primary/40">
                <Search className="h-5 w-5" /> Deep Research
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        <div className="mx-auto max-w-5xl px-6 pb-16">
          {/* Capabilities */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 -mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {capabilities.map((cap, i) => (
              <motion.div key={cap.label} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ scale: 1.05, y: -4 }} className="group cursor-default rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-5 text-center transition-colors hover:border-primary/30">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary transition-all group-hover:glow-primary"><cap.icon className="h-5 w-5" /></div>
                <div className="font-heading font-semibold text-sm text-foreground">{cap.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{cap.desc}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 + i * 0.1 }} whileHover={{ scale: 1.05 }} className="rounded-xl border border-border bg-card p-6 text-center cursor-default transition-all hover:border-primary/30 hover:glow-primary">
                <div className="text-3xl font-heading font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Features */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feat, i) => (
              <motion.button key={feat.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }} onHoverStart={() => setHoveredFeature(i)} onHoverEnd={() => setHoveredFeature(null)} onClick={() => navigate(feat.url)} className="group relative flex items-start gap-4 overflow-hidden rounded-2xl border border-border bg-card p-6 text-left transition-all hover:border-primary/40">
                <motion.div className={`absolute inset-0 bg-gradient-to-br ${feat.gradient} opacity-0 transition-opacity`} animate={{ opacity: hoveredFeature === i ? 0.05 : 0 }} />
                <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${feat.gradient} shadow-lg`}>
                  <feat.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="relative">
                  <h3 className="font-heading text-lg font-semibold text-foreground">{feat.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{feat.desc}</p>
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: hoveredFeature === i ? 1 : 0, x: hoveredFeature === i ? 0 : -10 }} className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
                    Explore <ArrowRight className="h-3 w-3" />
                  </motion.div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
