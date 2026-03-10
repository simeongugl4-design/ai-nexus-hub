import { motion } from "framer-motion";
import { Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface DiagramPanelProps {
  query: string;
  autoGenerate?: boolean;
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

    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'undefined') {
      setError("Diagram generation requires a connected backend. Running in demo mode.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setImageUrl(null);

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
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <img src={imageUrl} alt="AI Diagram" className="w-full" />
          </div>
          <div className="mt-3 text-center">
            <button onClick={handleGenerate} className="text-xs text-primary hover:underline">
              Regenerate diagram
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
