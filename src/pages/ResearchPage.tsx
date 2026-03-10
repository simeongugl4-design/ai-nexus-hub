import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Search, ArrowRight, Globe, ExternalLink, BookOpen, Sparkles, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useResearch } from "@/hooks/use-research";
import { TopNav } from "@/components/TopNav";
import { ResearchSource } from "@/lib/research-api";
import { DiagramPanel } from "@/components/DiagramPanel";
import { preprocessLatex } from "@/lib/latex-utils";

const suggestedQueries = [
  "What are the latest breakthroughs in quantum computing?",
  "How does CRISPR gene editing work and what are its applications?",
  "Compare the economic impact of renewable energy vs fossil fuels",
  "What is the current state of artificial general intelligence research?",
];

function SourceCard({ source, index }: { source: ResearchSource; index: number }) {
  const colors = ["border-primary/40 bg-primary/5", "border-secondary/40 bg-secondary/5", "border-[hsl(150,80%,50%)]/40 bg-[hsl(150,80%,50%)]/5", "border-[hsl(30,90%,55%)]/40 bg-[hsl(30,90%,55%)]/5"];
  const colorClass = colors[index % colors.length];

  return (
    <motion.a href={source.url} target="_blank" rel="noopener noreferrer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} whileHover={{ scale: 1.02, y: -2 }} className={`group block rounded-xl border ${colorClass} p-4 transition-all hover:shadow-lg`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Globe className="h-3 w-3" /><span className="truncate">{source.domain}</span></div>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground shrink-0">{source.id}</span>
      </div>
      <h4 className="text-sm font-heading font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">{source.title}</h4>
      <p className="text-xs text-muted-foreground line-clamp-2">{source.description}</p>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity"><span>Open source</span><ExternalLink className="h-2.5 w-2.5" /></div>
    </motion.a>
  );
}

export default function ResearchPage() {
  const { content, sources, isLoading, isComplete, query, error, research, clear } = useResearch();
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("research");
  const [showAllSources, setShowAllSources] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => { e?.preventDefault(); const trimmed = input.trim(); if (!trimmed || isLoading) return; research(trimmed); };
  const handleSuggest = (q: string) => { setInput(q); research(q); };
  const handleNewResearch = () => { clear(); setInput(""); setTimeout(() => inputRef.current?.focus(), 100); };

  const hasResults = content.length > 0 || isLoading;
  const displayedSources = showAllSources ? sources : sources.slice(0, 4);

  return (
    <div className="flex h-screen flex-col">
      <TopNav selectedModel={selectedModel} onModelChange={setSelectedModel} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {!hasResults ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 min-h-[calc(100vh-3.5rem)]">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary glow-secondary"><BookOpen className="h-10 w-10 text-secondary-foreground" /></motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-center mb-10">
              <h1 className="text-4xl font-heading font-bold gradient-text mb-3">Deep Research</h1>
              <p className="max-w-lg text-muted-foreground">AI-powered research engine with citations.</p>
            </motion.div>
            <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} onSubmit={handleSubmit} className="w-full max-w-2xl mb-10">
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 transition-all focus-within:border-secondary/50 focus-within:glow-secondary">
                <Search className="ml-2 h-5 w-5 text-muted-foreground shrink-0" />
                <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a research question..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none py-2" />
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" disabled={!input.trim()} className="shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all disabled:opacity-30 bg-secondary text-secondary-foreground glow-secondary hover:opacity-90"><ArrowRight className="h-4 w-4" /></motion.button>
              </div>
            </motion.form>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="w-full max-w-2xl">
              <p className="text-center text-sm text-muted-foreground mb-4 font-medium">Try a research topic:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestedQueries.map((q, i) => (
                  <motion.button key={q} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.07 }} whileHover={{ scale: 1.02, y: -2 }} onClick={() => handleSuggest(q)} className="group flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-left text-sm text-muted-foreground transition-all hover:border-secondary/50 hover:bg-surface-elevated hover:text-foreground">
                    <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary opacity-60 group-hover:opacity-100" /><span className="line-clamp-2">{q}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl px-4 py-8">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <BookOpen className="h-3.5 w-3.5 text-secondary" /><span>Deep Research</span>
                  {isLoading && <span className="flex items-center gap-1 text-secondary"><Loader2 className="h-3 w-3 animate-spin" /> Researching...</span>}
                  {isComplete && <span className="flex items-center gap-1 text-[hsl(150,80%,50%)]"><Sparkles className="h-3 w-3" /> Complete</span>}
                </div>
                <h2 className="text-xl font-heading font-bold text-foreground">{query}</h2>
              </div>
              <motion.button whileHover={{ scale: 1.05 }} onClick={handleNewResearch} className="shrink-0 flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"><Search className="h-3 w-3" /> New Research</motion.button>
            </motion.div>

            {sources.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <h3 className="text-sm font-heading font-semibold text-foreground flex items-center gap-2 mb-3"><Globe className="h-4 w-4 text-secondary" />Sources<span className="rounded-full bg-secondary/20 px-2 py-0.5 text-[10px] text-secondary">{sources.length}</span></h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <AnimatePresence>{displayedSources.map((source, i) => <SourceCard key={source.id} source={source} index={i} />)}</AnimatePresence>
                </div>
                {sources.length > 4 && <button onClick={() => setShowAllSources(!showAllSources)} className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-border py-2 text-xs text-muted-foreground hover:bg-muted">{showAllSources ? <>Show less <ChevronUp className="h-3 w-3" /></> : <>Show {sources.length - 4} more <ChevronDown className="h-3 w-3" /></>}</button>}
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6 mb-6">
              {error ? <div className="text-center py-8"><p className="text-destructive mb-2">⚠️ {error}</p><button onClick={handleNewResearch} className="text-sm text-primary hover:underline">Try again</button></div>
                : content ? <div className="prose prose-sm prose-invert max-w-none prose-headings:font-heading prose-headings:gradient-text prose-code:text-primary prose-pre:bg-muted prose-pre:border prose-pre:border-border"><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{preprocessLatex(content)}</ReactMarkdown></div>
                : isLoading ? <div className="flex flex-col items-center py-12 gap-4"><Loader2 className="h-5 w-5 animate-spin text-secondary" /><div className="flex gap-1.5"><span className="h-2 w-2 rounded-full bg-secondary typing-dot" /><span className="h-2 w-2 rounded-full bg-secondary typing-dot" /><span className="h-2 w-2 rounded-full bg-secondary typing-dot" /></div></div> : null}
            </motion.div>

            {isComplete && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6"><h3 className="text-sm font-heading font-semibold text-foreground mb-3 flex items-center gap-2"><span className="text-secondary">📊</span> AI Diagram</h3><DiagramPanel query={query} autoGenerate /></motion.div>}

            {isComplete && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex items-center gap-2 rounded-xl border border-border bg-card p-2"><Search className="ml-2 h-4 w-4 text-muted-foreground" /><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a follow-up question..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none py-1" /><button type="submit" disabled={!input.trim() || isLoading} className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-30 bg-secondary text-secondary-foreground hover:opacity-90">Research</button></form></motion.div>}
          </div>
        )}
      </div>
    </div>
  );
}
