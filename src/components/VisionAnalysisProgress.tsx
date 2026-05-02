import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  ScanSearch,
  Brain,
  Layers,
  Sparkles,
  Image as ImageIcon,
  Cpu,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface VisionAnalysisProgressProps {
  imageUrls: string[];
  model?: string; // vision model id, e.g. google/gemini-2.5-pro
  streaming: boolean; // true once first delta starts arriving
}

type Stage = {
  id: string;
  label: string;
  icon: typeof Eye;
  /** approx ms each stage is "active" before progressing if no real signal */
  duration: number;
};

const STAGES: Stage[] = [
  { id: "decode", label: "Decoding image data", icon: ImageIcon, duration: 500 },
  { id: "preprocess", label: "Preprocessing pixels & normalizing", icon: Layers, duration: 700 },
  { id: "vision", label: "Running vision encoder", icon: ScanSearch, duration: 1500 },
  { id: "reason", label: "Cross-modal reasoning", icon: Brain, duration: 2200 },
  { id: "compose", label: "Composing detailed analysis", icon: Sparkles, duration: 1800 },
];

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  return `${s}.${tenths}s`;
}

function modelLabel(model?: string) {
  if (!model) return "Vision Model";
  if (model.includes("gemini-2.5-pro")) return "Gemini 2.5 Pro Vision";
  if (model.includes("gemini-3.1-pro")) return "Gemini 3.1 Pro Vision";
  if (model.includes("gemini-3-flash")) return "Gemini 3 Flash Vision";
  if (model.includes("gpt-5.2")) return "GPT-5.2 Vision";
  if (model.includes("gpt-5")) return "GPT-5 Vision";
  return model;
}

export function VisionAnalysisProgress({ imageUrls, model, streaming }: VisionAnalysisProgressProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(Date.now());

  // Drive elapsed timer
  useEffect(() => {
    startRef.current = Date.now();
    const i = setInterval(() => setElapsed(Date.now() - startRef.current), 100);
    return () => clearInterval(i);
  }, []);

  // Walk through stages until streaming begins; then jump to last (compose)
  useEffect(() => {
    if (streaming) {
      setStageIndex(STAGES.length - 1);
      return;
    }
    if (stageIndex >= STAGES.length - 2) return; // hold on "reason" until streaming
    const t = setTimeout(() => setStageIndex((i) => Math.min(i + 1, STAGES.length - 2)), STAGES[stageIndex].duration);
    return () => clearTimeout(t);
  }, [stageIndex, streaming]);

  const progressPct = useMemo(() => {
    if (streaming) return 92;
    return Math.round(((stageIndex + 1) / STAGES.length) * 80);
  }, [stageIndex, streaming]);

  const totalImages = imageUrls.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4 }}
      className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-4 shadow-[0_0_30px_hsl(195,100%,50%,0.15)]"
    >
      {/* Animated scan beam overlay */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-70"
        initial={{ y: 0 }}
        animate={{ y: [0, 80, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Eye className="h-4 w-4" />
            <motion.span
              className="absolute inset-0 rounded-xl border border-primary/40"
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground flex items-center gap-2">
              Analyzing {totalImages > 1 ? `${totalImages} images` : "image"}
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Cpu className="h-3 w-3" />
              {modelLabel(model)}
              <span className="opacity-50">•</span>
              <span className="tabular-nums">{formatElapsed(elapsed)}</span>
            </div>
          </div>
        </div>

        {/* Image thumbnails strip */}
        <div className="flex -space-x-2">
          {imageUrls.slice(0, 4).map((url, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative h-9 w-9 overflow-hidden rounded-lg border-2 border-card ring-1 ring-primary/30"
            >
              <img src={url} alt={`analyzing ${i + 1}`} className="h-full w-full object-cover" />
              <motion.div
                className="absolute inset-0 bg-primary/20"
                animate={{ opacity: [0, 0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              />
            </motion.div>
          ))}
          {totalImages > 4 && (
            <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-lg border-2 border-card bg-muted text-[10px] font-semibold text-muted-foreground ring-1 ring-border">
              +{totalImages - 4}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%`, backgroundPosition: ["0% 0%", "200% 0%"] }}
          transition={{
            width: { duration: 0.6, ease: "easeOut" },
            backgroundPosition: { duration: 2, repeat: Infinity, ease: "linear" },
          }}
        />
      </div>

      {/* Stages */}
      <ol className="space-y-1.5">
        <AnimatePresence initial={false}>
          {STAGES.map((stage, idx) => {
            const status = idx < stageIndex ? "done" : idx === stageIndex ? "active" : "pending";
            if (status === "pending") return null;
            const Icon = stage.icon;
            return (
              <motion.li
                key={stage.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2.5 text-xs"
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                    status === "done"
                      ? "bg-[hsl(150,80%,50%)]/15 text-[hsl(150,80%,50%)]"
                      : "bg-primary/15 text-primary"
                  }`}
                >
                  {status === "done" ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <Icon className="h-3 w-3 animate-pulse" />
                  )}
                </span>
                <span className={status === "done" ? "text-muted-foreground line-through decoration-muted-foreground/40" : "text-foreground"}>
                  {stage.label}
                </span>
                {status === "active" && (
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-primary">
                    <span className="h-1 w-1 rounded-full bg-primary typing-dot" />
                    <span className="h-1 w-1 rounded-full bg-primary typing-dot" />
                    <span className="h-1 w-1 rounded-full bg-primary typing-dot" />
                  </span>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </motion.div>
  );
}
