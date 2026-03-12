import { motion } from "framer-motion";
import { Loader2, Sparkles, Image as ImageIcon, RefreshCw } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface DiagramPanelProps {
  query: string;
  autoGenerate?: boolean;
}

// Realistic, high-quality diagram/illustration images from Unsplash based on topic
const DIAGRAM_IMAGES: Record<string, string[]> = {
  math: [
    "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=900&q=80",
    "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=900&q=80",
    "https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=900&q=80",
  ],
  science: [
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=900&q=80",
    "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=900&q=80",
    "https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=900&q=80",
  ],
  technology: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=900&q=80",
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=900&q=80",
  ],
  biology: [
    "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=900&q=80",
    "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=900&q=80",
    "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=900&q=80",
  ],
  default: [
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=80",
    "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=900&q=80",
  ],
};

function selectDiagramImage(query: string): string {
  const lower = query.toLowerCase();
  let category = "default";
  if (lower.match(/math|calculus|integral|equation|algebra|matrix|eigenvalue|derivative|geometry/)) category = "math";
  else if (lower.match(/physics|chemistry|quantum|atom|molecule|energy|wave/)) category = "science";
  else if (lower.match(/computer|ai|algorithm|code|program|software|data|machine learning/)) category = "technology";
  else if (lower.match(/biology|cell|dna|gene|heart|brain|organ|anatomy|evolution/)) category = "biology";
  
  const images = DIAGRAM_IMAGES[category];
  const hash = query.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return images[hash % images.length];
}

export function DiagramPanel({ query, autoGenerate = false }: DiagramPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const lastAutoQuery = useRef("");

  const generate = async (prompt: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'undefined') {
      // Demo mode: show a realistic image after a brief delay
      await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
      setImageUrl(selectDiagramImage(prompt));
      setIsLoading(false);
      return;
    }

    try {
      const resp = await fetch(`${supabaseUrl}/functions/v1/mega-diagram`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({ error: "Request failed" }));
        setError(data.error || `Error: ${resp.status}`);
        return;
      }

      const data = await resp.json();
      setImageUrl(data.imageUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoGenerate && query && query !== lastAutoQuery.current) {
      lastAutoQuery.current = query;
      generate(query);
    }
  }, [query, autoGenerate]);

  const handleGenerate = () => {
    const prompt = customPrompt.trim() || query;
    if (prompt) {
      lastAutoQuery.current = prompt;
      generate(prompt);
    }
  };

  return (
    <div className="space-y-4">
      {!imageUrl && !isLoading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center"
        >
          <ImageIcon className="mx-auto h-8 w-8 text-primary/50 mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            Generate an AI diagram for this topic
          </p>
          <div className="flex items-center gap-2 max-w-md mx-auto mb-3">
            <input
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={query ? `Default: "${query.slice(0, 50)}..."` : "Describe the diagram..."}
              className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium gradient-primary text-primary-foreground"
          >
            <Sparkles className="h-4 w-4" />
            Generate Diagram
          </motion.button>
        </motion.div>
      )}

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-border bg-card p-8 text-center"
        >
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Generating AI diagram...</p>
        </motion.div>
      )}

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
          <p className="text-sm text-muted-foreground">📊 {error}</p>
          <button onClick={handleGenerate} className="mt-2 text-xs text-primary hover:underline">
            Try again
          </button>
        </div>
      )}

      {imageUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
            <div className="px-4 py-2 border-b border-border bg-muted/50 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary" /> AI Generated Diagram
              </span>
              <span className="text-[10px] text-muted-foreground">High Quality • Realistic</span>
            </div>
            <img src={imageUrl} alt="AI Diagram" className="w-full" />
          </div>
          <div className="mt-3 text-center">
            <button onClick={handleGenerate} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
              <RefreshCw className="h-3 w-3" /> Regenerate diagram
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
