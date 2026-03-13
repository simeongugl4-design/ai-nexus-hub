import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ImageIcon, ArrowRight, Loader2, RotateCcw, Sparkles, Eye, Download, ZoomIn, ZoomOut } from "lucide-react";
import { useImageAI } from "@/hooks/use-image-ai";
import { TopNav } from "@/components/TopNav";
import { FollowUpOptions } from "@/components/FollowUpOptions";

const actions = [{ id: "generate", label: "Generate Image", icon: Sparkles }, { id: "analyze", label: "Analyze Image", icon: Eye }];
const suggestions = ["A futuristic cyberpunk cityscape at night with neon lights", "A majestic eagle soaring over snow-capped mountains", "A 3D render of a crystal ball containing a miniature galaxy", "A photorealistic robot hand holding a delicate flower"];

export default function ImageAIPage() {
  const { content, imageUrl, isLoading, error, generate, clear } = useImageAI();
  const [input, setInput] = useState("");
  const [action, setAction] = useState("generate");
  const [selectedModel, setSelectedModel] = useState("creative");
  const [zoom, setZoom] = useState(1);

  const handleSubmit = (e?: React.FormEvent) => { e?.preventDefault(); if (!input.trim() || isLoading) return; setZoom(1); generate(input.trim(), action); };
  const handleDownload = () => { if (!imageUrl) return; const a = document.createElement("a"); a.href = imageUrl; a.download = `megakumul-image-${Date.now()}.png`; document.body.appendChild(a); a.click(); document.body.removeChild(a); };
  const handleFollowUp = (prefix: string) => { setInput(prefix); setZoom(1); generate(prefix, action); };
  const hasResults = content.length > 0 || imageUrl || isLoading;

  return (
    <div className="flex h-screen flex-col">
      <TopNav selectedModel={selectedModel} onModelChange={setSelectedModel} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {!hasResults ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 min-h-[calc(100vh-3.5rem)]">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-[hsl(45,90%,55%)] shadow-[0_0_20px_hsl(45,90%,55%,0.3)]"><ImageIcon className="h-10 w-10 text-background" /></motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8"><h1 className="text-4xl font-heading font-bold gradient-text mb-3">Image AI</h1><p className="max-w-lg text-muted-foreground">Generate stunning AI images or analyze visuals</p></motion.div>
            <div className="flex gap-3 mb-8">{actions.map((a) => (<button key={a.id} onClick={() => setAction(a.id)} className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition-all ${action === a.id ? "border-[hsl(45,90%,55%)] bg-[hsl(45,90%,55%)]/10 text-[hsl(45,90%,55%)]" : "border-border text-muted-foreground"}`}><a.icon className="h-4 w-4" /> {a.label}</button>))}</div>
            <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-8"><div className="rounded-2xl border border-border bg-card p-3 focus-within:border-[hsl(45,90%,55%)]/50"><textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe the image..." rows={3} className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none" onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }} /><div className="flex justify-end mt-2"><button type="submit" disabled={!input.trim()} className="rounded-xl px-5 py-2 text-sm font-medium bg-[hsl(45,90%,55%)] text-background disabled:opacity-30">{action === "generate" ? "Generate" : "Analyze"} <ArrowRight className="inline h-4 w-4 ml-1" /></button></div></div></form>
            <div className="w-full max-w-2xl"><p className="text-center text-sm text-muted-foreground mb-4">Try these:</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{suggestions.map((s) => (<button key={s} onClick={() => { setInput(s); setZoom(1); generate(s, action); }} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-left text-sm text-muted-foreground hover:border-[hsl(45,90%,55%)]/50 hover:text-foreground"><ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(45,90%,55%)]" /><span>{s}</span></button>))}</div></div>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-sm"><ImageIcon className="h-4 w-4 text-[hsl(45,90%,55%)]" /><span className="text-muted-foreground">Image AI</span>{isLoading && <Loader2 className="h-3 w-3 animate-spin" />}</div>
              <button onClick={() => { clear(); setInput(""); setZoom(1); }} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"><RotateCcw className="h-3 w-3" /> New</button>
            </div>
            {isLoading && !imageUrl && !content && <div className="rounded-2xl border border-border bg-card p-12 text-center"><Loader2 className="mx-auto h-10 w-10 animate-spin text-[hsl(45,90%,55%)] mb-4" /><p className="text-sm text-muted-foreground">Processing...</p></div>}
            {imageUrl && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6"><div className="rounded-2xl border border-border bg-card overflow-hidden"><div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50"><span className="text-xs font-medium text-muted-foreground">Generated Image</span><div className="flex items-center gap-1"><button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="p-1.5 text-muted-foreground hover:text-foreground"><ZoomOut className="h-4 w-4" /></button><span className="text-xs text-muted-foreground min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span><button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-1.5 text-muted-foreground hover:text-foreground"><ZoomIn className="h-4 w-4" /></button><button onClick={handleDownload} className="p-1.5 text-muted-foreground hover:text-foreground ml-2"><Download className="h-4 w-4" /></button></div></div><div className="overflow-auto max-h-[600px] flex items-center justify-center p-4 bg-background"><img src={imageUrl} alt="AI Generated" className="rounded-lg transition-transform" style={{ transform: `scale(${zoom})` }} /></div></div></motion.div>}
            {content && !imageUrl && <div className="rounded-2xl border border-border bg-card p-6">{error ? <p className="text-destructive">⚠️ {error}</p> : <div className="prose prose-sm prose-invert max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown></div>}</div>}
            {error && !content && <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center"><p className="text-destructive mb-2">⚠️ {error}</p></div>}

            {/* Follow-up options A-D */}
            {!isLoading && (imageUrl || content) && <FollowUpOptions type="image" onSelect={handleFollowUp} />}

            {/* Persistent input */}
            <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card p-2">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Generate another image or ask a follow-up..." rows={1} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }} />
              <button type="submit" disabled={!input.trim() || isLoading} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-[hsl(45,90%,55%)] text-background disabled:opacity-30">Go</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
