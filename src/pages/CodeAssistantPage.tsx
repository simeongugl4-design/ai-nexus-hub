import { useState, useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Code, ArrowRight, Loader2, Copy, Check, RotateCcw } from "lucide-react";
import { useCodeAssistant } from "@/hooks/use-code-assistant";
import { TopNav } from "@/components/TopNav";
import { preprocessLatex } from "@/lib/latex-utils";
import { FollowUpOptions } from "@/components/FollowUpOptions";

const languages = ["Auto-detect", "Python", "JavaScript", "TypeScript", "Java", "C++", "Rust", "Go", "SQL"];
const actions = [
  { id: "generate", label: "Generate Code", desc: "Create code from a description" },
  { id: "debug", label: "Debug Code", desc: "Find and fix bugs" },
  { id: "explain", label: "Explain Code", desc: "Break down how code works" },
  { id: "optimize", label: "Optimize Code", desc: "Improve performance" },
];
const suggestions = ["Write a REST API with Express.js and MongoDB", "Create a binary search tree in Python", "Build a React custom hook for infinite scroll", "Write a SQL query to find the top 5 customers by revenue"];

export default function CodeAssistantPage() {
  const { content, isLoading, error, generate, clear } = useCodeAssistant();
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("Auto-detect");
  const [action, setAction] = useState("generate");
  const [selectedModel, setSelectedModel] = useState("coding");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => { e?.preventDefault(); if (!input.trim() || isLoading) return; generate(input.trim(), language, action, selectedModel); };
  const handleCopy = async () => { await navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleFollowUp = (prefix: string) => { setInput(prefix); generate(prefix, language, action, selectedModel); };
  const hasResults = content.length > 0 || isLoading;

  return (
    <div className="flex h-screen flex-col">
      <TopNav selectedModel={selectedModel} onModelChange={setSelectedModel} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {!hasResults ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 min-h-[calc(100vh-3.5rem)]">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-[hsl(150,80%,50%)] shadow-[0_0_20px_hsl(150,80%,50%,0.3)]"><Code className="h-10 w-10 text-background" /></motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-center mb-8">
              <h1 className="text-4xl font-heading font-bold gradient-text mb-3">Code Assistant</h1>
              <p className="max-w-lg text-muted-foreground">Generate, debug, explain, and optimize code with AI</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="flex flex-wrap justify-center gap-2 mb-6">
              {actions.map((a) => (<button key={a.id} onClick={() => setAction(a.id)} className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${action === a.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>{a.label}</button>))}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap justify-center gap-2 mb-8">
              {languages.map((l) => (<button key={l} onClick={() => setLanguage(l)} className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${language === l ? "border-[hsl(150,80%,50%)] bg-[hsl(150,80%,50%)]/10 text-[hsl(150,80%,50%)]" : "border-border text-muted-foreground hover:text-foreground"}`}>{l}</button>))}
            </motion.div>
            <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} onSubmit={handleSubmit} className="w-full max-w-2xl mb-8">
              <div className="rounded-2xl border border-border bg-card p-3 focus-within:border-[hsl(150,80%,50%)]/50">
                <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Describe what you want to ${action}...`} rows={4} className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none" onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }} />
                <div className="flex justify-between items-center mt-2"><span className="text-[10px] text-muted-foreground">Ctrl+Enter to submit</span><button type="submit" disabled={!input.trim()} className="rounded-xl px-5 py-2 text-sm font-medium bg-[hsl(150,80%,50%)] text-background transition-all disabled:opacity-30 hover:opacity-90"><ArrowRight className="h-4 w-4" /></button></div>
              </div>
            </motion.form>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="w-full max-w-2xl">
              <p className="text-center text-sm text-muted-foreground mb-4 font-medium">Try these:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestions.map((s, i) => (<motion.button key={s} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.07 }} whileHover={{ scale: 1.02 }} onClick={() => { setInput(s); generate(s, language, action); }} className="group flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-left text-sm text-muted-foreground transition-all hover:border-[hsl(150,80%,50%)]/50 hover:text-foreground"><Code className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(150,80%,50%)] opacity-60 group-hover:opacity-100" /><span className="line-clamp-2">{s}</span></motion.button>))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-sm"><Code className="h-4 w-4 text-[hsl(150,80%,50%)]" /><span className="text-muted-foreground">Code Assistant</span>{isLoading && <Loader2 className="h-3 w-3 animate-spin text-[hsl(150,80%,50%)]" />}</div>
              <div className="flex gap-2">
                <button onClick={handleCopy} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">{copied ? <Check className="h-3 w-3 text-[hsl(150,80%,50%)]" /> : <Copy className="h-3 w-3" />} {copied ? "Copied" : "Copy"}</button>
                <button onClick={() => { clear(); setInput(""); }} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"><RotateCcw className="h-3 w-3" /> New</button>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              {error ? <p className="text-destructive">⚠️ {error}</p> : <div className="prose prose-sm prose-invert max-w-none prose-headings:font-heading prose-code:text-[hsl(150,80%,50%)] prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl"><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{preprocessLatex(content)}</ReactMarkdown></div>}
            </div>

            {/* Follow-up options A-F */}
            {!isLoading && content && <FollowUpOptions type="code" onSelect={handleFollowUp} />}

            {/* Persistent input */}
            <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card p-2">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a follow-up or new code request..." rows={1} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }} />
              <button type="submit" disabled={!input.trim() || isLoading} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-[hsl(150,80%,50%)] text-background disabled:opacity-30">Go</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
