import { useState } from "react";
import { motion } from "framer-motion";
import { Box, ArrowRight, Loader2, RotateCcw, Sparkles, Download, ZoomIn, ZoomOut, Layers, Cpu, BookOpen, Heart } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { addToHistory } from "@/pages/HistoryPage";
import { addToGallery } from "@/lib/gallery";
import { toast } from "sonner";

const styles = [
  { id: "3d", label: "3D Render", icon: Box, desc: "Photorealistic 3D with lighting & shadows" },
  { id: "technical", label: "Technical", icon: Cpu, desc: "Clean engineering diagrams" },
  { id: "infographic", label: "Infographic", icon: Layers, desc: "Visual data & icon-based layouts" },
];

const suggestions = [
  { text: "Human heart anatomy with labeled chambers and blood flow", icon: "❤️" },
  { text: "Neural network architecture with layers and connections", icon: "🧠" },
  { text: "Solar system with planets, orbits, and relative sizes", icon: "🪐" },
  { text: "DNA double helix structure with base pairs labeled", icon: "🧬" },
  { text: "Computer CPU architecture with cache, ALU, and registers", icon: "💻" },
  { text: "Water cycle diagram with evaporation, condensation, precipitation", icon: "💧" },
];

export default function DiagramsPage() {
  const [input, setInput] = useState("");
  const [style, setStyle] = useState("3d");
  const [selectedModel, setSelectedModel] = useState("creative");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const generate = async (prompt: string) => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setImageUrl(null);
    setDescription("");
    setZoom(1);

    addToHistory({ query: prompt, source: "diagram", preview: style });

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    try {
      const resp = await fetch(`${supabaseUrl}/functions/v1/mega-diagram`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ prompt, style }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({ error: "Request failed" }));
        setError(data.error || `Error: ${resp.status}`);
        setIsLoading(false);
        return;
      }

      const data = await resp.json();
      setImageUrl(data.imageUrl);
      setDescription(data.text || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    generate(input.trim());
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `megakumul-diagram-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const hasResults = imageUrl || isLoading || error;

  return (
    <div className="flex h-screen flex-col">
      <TopNav selectedModel={selectedModel} onModelChange={setSelectedModel} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {!hasResults ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 min-h-[calc(100vh-3.5rem)]">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
              <Box className="h-10 w-10 text-primary-foreground" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
              <h1 className="text-4xl font-heading font-bold gradient-text mb-3">3D Diagrams</h1>
              <p className="max-w-lg text-muted-foreground">Generate stunning 3D diagrams, technical illustrations, and infographics with AI</p>
            </motion.div>

            {/* Style selector */}
            <div className="flex gap-3 mb-8 flex-wrap justify-center">
              {styles.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition-all ${
                    style === s.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <s.icon className="h-4 w-4" />
                  <div className="text-left">
                    <div>{s.label}</div>
                    <div className="text-[10px] opacity-70">{s.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-8">
              <div className="rounded-2xl border border-border bg-card p-3 focus-within:border-primary/50">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe the diagram you want to create..."
                  rows={3}
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
                />
                <div className="flex justify-end mt-2">
                  <button type="submit" disabled={!input.trim()} className="rounded-xl px-5 py-2 text-sm font-medium bg-primary text-primary-foreground disabled:opacity-30">
                    Generate <ArrowRight className="inline h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </form>

            {/* Suggestions */}
            <div className="w-full max-w-2xl">
              <p className="text-center text-sm text-muted-foreground mb-4 flex items-center justify-center gap-2">
                <BookOpen className="h-4 w-4" /> Try these examples:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestions.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => { setInput(s.text); generate(s.text); }}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-left text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                  >
                    <span className="text-lg">{s.icon}</span>
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-sm">
                <Box className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">3D Diagram</span>
                {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              </div>
              <button
                onClick={() => { setImageUrl(null); setDescription(""); setError(null); setInput(""); setZoom(1); }}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
              >
                <RotateCcw className="h-3 w-3" /> New
              </button>
            </div>

            {isLoading && (
              <div className="rounded-2xl border border-border bg-card p-12 text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Generating 3D diagram...</p>
                <p className="text-xs text-muted-foreground/60 mt-1">This may take 15-30 seconds for high-quality output</p>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
                <p className="text-destructive mb-2">⚠️ {error}</p>
                <button onClick={() => generate(input)} className="text-xs text-primary hover:underline">Try again</button>
              </div>
            )}

            {imageUrl && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-primary" /> AI Generated 3D Diagram
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="p-1.5 text-muted-foreground hover:text-foreground"><ZoomOut className="h-4 w-4" /></button>
                      <span className="text-xs text-muted-foreground min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
                      <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-1.5 text-muted-foreground hover:text-foreground"><ZoomIn className="h-4 w-4" /></button>
                      <button onClick={handleDownload} className="p-1.5 text-muted-foreground hover:text-foreground ml-2"><Download className="h-4 w-4" /></button>
                      <button onClick={() => { if (imageUrl) { addToGallery({ imageUrl, prompt: input, source: "diagram", style }); toast.success("Saved to Gallery!"); } }} className="p-1.5 text-muted-foreground hover:text-primary ml-1" title="Save to Gallery"><Heart className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="overflow-auto max-h-[600px] flex items-center justify-center p-4 bg-background">
                    <img src={imageUrl} alt="AI Generated 3D Diagram" className="rounded-lg transition-transform" style={{ transform: `scale(${zoom})` }} />
                  </div>
                </div>

                {description && (
                  <div className="mt-4 rounded-xl border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                )}

                <div className="mt-3 text-center">
                  <button onClick={() => generate(input)} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                    <RotateCcw className="h-3 w-3" /> Regenerate
                  </button>
                </div>
              </motion.div>
            )}

            {/* Input for another diagram */}
            <form onSubmit={handleSubmit} className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-card p-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe another diagram..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              />
              <button type="submit" disabled={!input.trim() || isLoading} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground disabled:opacity-30">
                Go
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
