import { useState, useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { FileText, ArrowRight, Loader2, RotateCcw, Upload } from "lucide-react";
import { useDocumentAI } from "@/hooks/use-document-ai";
import { TopNav } from "@/components/TopNav";

const suggestions = ["Summarize a research paper about machine learning", "Extract key financial metrics from a report", "Create a study guide from textbook notes", "Analyze a legal contract and highlight important clauses"];

export default function DocumentsPage() {
  const { content, isLoading, error, query, clear } = useDocumentAI();
  const [input, setInput] = useState("");
  const [docContent, setDocContent] = useState("");
  const [selectedModel, setSelectedModel] = useState("expert");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => { e?.preventDefault(); if (!input.trim() || isLoading) return; query(input.trim(), docContent || undefined); };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const text = await file.text(); setDocContent(text); };
  const hasResults = content.length > 0 || isLoading;

  return (
    <div className="flex h-screen flex-col">
      <TopNav selectedModel={selectedModel} onModelChange={setSelectedModel} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {!hasResults ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 min-h-[calc(100vh-3.5rem)]">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-[hsl(30,90%,55%)] shadow-[0_0_20px_hsl(30,90%,55%,0.3)]"><FileText className="h-10 w-10 text-background" /></motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
              <h1 className="text-4xl font-heading font-bold gradient-text mb-3">Document Intelligence</h1>
              <p className="max-w-lg text-muted-foreground">Upload documents and chat with them</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl mb-6">
              <input ref={fileRef} type="file" accept=".txt,.md,.csv,.json" onChange={handleFileUpload} className="hidden" />
              <button onClick={() => fileRef.current?.click()} className={`w-full rounded-2xl border-2 border-dashed p-8 text-center transition-all hover:border-[hsl(30,90%,55%)]/50 ${docContent ? "border-[hsl(30,90%,55%)]/50 bg-[hsl(30,90%,55%)]/5" : "border-border"}`}>
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                {docContent ? <p className="text-sm text-[hsl(30,90%,55%)]">Document loaded ({docContent.length} chars)</p> : <p className="text-sm text-muted-foreground">Click to upload a text document</p>}
              </button>
            </motion.div>
            <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="w-full max-w-2xl mb-8">
              <div className="rounded-2xl border border-border bg-card p-3 focus-within:border-[hsl(30,90%,55%)]/50">
                <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your document..." rows={3} className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none" onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }} />
                <div className="flex justify-end mt-2"><button type="submit" disabled={!input.trim()} className="rounded-xl px-5 py-2 text-sm font-medium bg-[hsl(30,90%,55%)] text-background transition-all disabled:opacity-30 hover:opacity-90"><ArrowRight className="h-4 w-4" /></button></div>
              </div>
            </motion.form>
            <div className="w-full max-w-2xl"><p className="text-center text-sm text-muted-foreground mb-4">Try these:</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{suggestions.map((s) => (<button key={s} onClick={() => { setInput(s); query(s); }} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-left text-sm text-muted-foreground hover:border-[hsl(30,90%,55%)]/50 hover:text-foreground"><FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(30,90%,55%)]" /><span>{s}</span></button>))}</div></div>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-[hsl(30,90%,55%)]" /><span className="text-muted-foreground">Document Intelligence</span>{isLoading && <Loader2 className="h-3 w-3 animate-spin" />}</div>
              <button onClick={() => { clear(); setInput(""); setDocContent(""); }} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"><RotateCcw className="h-3 w-3" /> New</button>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              {error ? <p className="text-destructive">⚠️ {error}</p> : <div className="prose prose-sm prose-invert max-w-none prose-headings:font-heading"><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{content}</ReactMarkdown></div>}
            </div>
            {!isLoading && <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card p-2"><textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a follow-up..." rows={1} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }} /><button type="submit" disabled={!input.trim()} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-[hsl(30,90%,55%)] text-background disabled:opacity-30">Go</button></form>}
          </div>
        )}
      </div>
    </div>
  );
}
