import { useState, useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Calculator, ArrowRight, Loader2, RotateCcw, Copy, Check, Plus } from "lucide-react";
import { useMathSolver } from "@/hooks/use-math-solver";
import { TopNav } from "@/components/TopNav";
import { DiagramPanel } from "@/components/DiagramPanel";
import { preprocessLatex } from "@/lib/latex-utils";
import { FollowUpOptions } from "@/components/FollowUpOptions";

const suggestions = ["Solve the integral ∫(x³ + 2x)dx from 0 to 3", "Find the eigenvalues of the matrix [[3,1],[1,3]]", "Solve the differential equation dy/dx = 2xy with y(0) = 1", "Prove that √2 is irrational", "Find the area between y = x² and y = 2x", "Solve the system: 3x + 2y = 7, x - y = 1"];

export default function MathSolverPage() {
  const { content, isLoading, error, solve, clear } = useMathSolver();
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("expert");
  const [copied, setCopied] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const [diagramCount, setDiagramCount] = useState(1);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => { e?.preventDefault(); if (!input.trim() || isLoading) return; setLastQuery(input.trim()); setDiagramCount(1); solve(input.trim(), selectedModel); };
  const handleCopy = async () => { await navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleFollowUp = (prefix: string) => { setInput(prefix); setLastQuery(prefix); setDiagramCount(1); solve(prefix, selectedModel); };
  const hasResults = content.length > 0 || isLoading;

  return (
    <div className="flex h-screen flex-col">
      <TopNav selectedModel={selectedModel} onModelChange={setSelectedModel} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {!hasResults ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 min-h-[calc(100vh-3.5rem)]">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary glow-primary"><Calculator className="h-10 w-10 text-primary-foreground" /></motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-center mb-8">
              <h1 className="text-4xl font-heading font-bold gradient-text mb-3">Math Solver</h1>
              <p className="max-w-lg text-muted-foreground">Step-by-step solutions with LaTeX rendering</p>
            </motion.div>
            <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} onSubmit={handleSubmit} className="w-full max-w-2xl mb-10">
              <div className="rounded-2xl border border-border bg-card p-3 focus-within:border-primary/50 focus-within:glow-primary">
                <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a math problem... e.g. 'Solve ∫ x²sin(x) dx'" rows={4} className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none" onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }} />
                <div className="flex justify-between items-center mt-2"><span className="text-[10px] text-muted-foreground">Ctrl+Enter to submit</span><button type="submit" disabled={!input.trim()} className="rounded-xl px-5 py-2 text-sm font-medium gradient-primary text-primary-foreground transition-all disabled:opacity-30 hover:opacity-90">Solve <ArrowRight className="inline h-4 w-4 ml-1" /></button></div>
              </div>
            </motion.form>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="w-full max-w-2xl">
              <p className="text-center text-sm text-muted-foreground mb-4 font-medium">Try a problem:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestions.map((s, i) => (<motion.button key={s} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.07 }} whileHover={{ scale: 1.02 }} onClick={() => { setInput(s); setLastQuery(s); solve(s); }} className="group flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-left text-sm text-muted-foreground transition-all hover:border-primary/50 hover:text-foreground"><Calculator className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary opacity-60 group-hover:opacity-100" /><span className="line-clamp-2">{s}</span></motion.button>))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-sm"><Calculator className="h-4 w-4 text-primary" /><span className="text-muted-foreground">Math Solver</span>{isLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}</div>
              <div className="flex gap-2">
                <button onClick={handleCopy} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">{copied ? <Check className="h-3 w-3 text-[hsl(150,80%,50%)]" /> : <Copy className="h-3 w-3" />} {copied ? "Copied" : "Copy"}</button>
                <button onClick={() => { clear(); setInput(""); setLastQuery(""); setDiagramCount(1); }} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"><RotateCcw className="h-3 w-3" /> New Problem</button>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 mb-6">
              {error ? <p className="text-destructive">⚠️ {error}</p> : <div className="prose prose-sm prose-invert max-w-none prose-headings:font-heading prose-headings:gradient-text prose-code:text-primary prose-pre:bg-muted prose-pre:border prose-pre:border-border"><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{preprocessLatex(content)}</ReactMarkdown></div>}
            </div>

            {/* Follow-up options A-F */}
            {!isLoading && content && <FollowUpOptions type="math" onSelect={handleFollowUp} context={lastQuery} />}

            {/* Multiple diagrams */}
            {lastQuery && !isLoading && content && (
              <div className="mt-6 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-heading font-semibold text-foreground flex items-center gap-2"><span className="text-primary">📐</span> AI Diagrams</h3>
                  <button onClick={() => setDiagramCount(c => c + 1)} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"><Plus className="h-3 w-3" /> Add Diagram</button>
                </div>
                <div className="space-y-4">
                  {Array.from({ length: diagramCount }).map((_, i) => (
                    <DiagramPanel key={`diagram-${i}-${lastQuery}`} query={i === 0 ? lastQuery : `${lastQuery} - visualization ${i + 1}`} autoGenerate />
                  ))}
                </div>
              </div>
            )}

            {/* Persistent input */}
            <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card p-2">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a follow-up or new problem..." rows={1} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }} />
              <button type="submit" disabled={!input.trim() || isLoading} className="rounded-lg px-3 py-1.5 text-xs font-medium gradient-primary text-primary-foreground disabled:opacity-30">Solve</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
