import { FileText, Sparkles, Code, Brain, PenTool, Globe, BarChart3, Share2 } from "lucide-react";
import { motion } from "framer-motion";

const tools = [
  { icon: FileText, label: "Summarize Article", prefix: "Summarize the following article or topic in clear bullet points: ", color: "text-primary" },
  { icon: Sparkles, label: "Generate Presentation", prefix: "Create a presentation outline with key slides about: ", color: "text-accent" },
  { icon: PenTool, label: "Write Blog Post", prefix: "Write a well-structured blog post about: ", color: "text-primary" },
  { icon: Code, label: "Create Code", prefix: "Write clean, well-commented code for: ", color: "text-accent" },
  { icon: BarChart3, label: "Business Plan", prefix: "Create a detailed business plan for: ", color: "text-primary" },
  { icon: Brain, label: "Explain Topic", prefix: "Explain this topic in depth with examples: ", color: "text-accent" },
  { icon: Globe, label: "Translate", prefix: "Translate the following text to English: ", color: "text-primary" },
  { icon: Share2, label: "Social Posts", prefix: "Create engaging social media posts for: ", color: "text-accent" },
];

interface ToolsPanelProps {
  onToolClick?: (prefix: string) => void;
}

export function ToolsPanel({ onToolClick }: ToolsPanelProps) {
  return (
    <div className="hidden w-64 border-l border-border bg-card p-4 xl:block">
      <h3 className="mb-4 text-sm font-heading font-semibold text-foreground">AI Tools</h3>
      <div className="space-y-2">
        {tools.map((tool, i) => (
          <motion.button
            key={tool.label}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onToolClick?.(tool.prefix)}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted p-3 text-left text-sm text-muted-foreground transition-all hover:border-primary/30 hover:bg-surface-elevated hover:text-foreground"
          >
            <tool.icon className={`h-4 w-4 shrink-0 ${tool.color}`} />
            <span>{tool.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
