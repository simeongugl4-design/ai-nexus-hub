import { useState, useCallback } from "react";
import { readSSEStream } from "@/lib/stream-utils";
import { addToHistory } from "@/pages/HistoryPage";

export function useImageAI() {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (prompt: string, action: string = "generate") => {
    setContent("");
    setImageUrl(null);
    setIsLoading(true);
    setError(null);

    addToHistory({ query: prompt, source: "image", preview: action });

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (action === "analyze") {
      let accumulated = "";
      await readSSEStream({
        url: `${supabaseUrl}/functions/v1/mega-image`,
        body: { prompt, action },
        onDelta: (chunk) => {
          accumulated += chunk;
          setContent(accumulated);
        },
        onDone: () => setIsLoading(false),
        onError: (err) => {
          setIsLoading(false);
          setError(err);
        },
      });
    } else {
      try {
        const resp = await fetch(`${supabaseUrl}/functions/v1/mega-image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ prompt, action }),
        });

        if (!resp.ok) {
          const data = await resp.json().catch(() => ({ error: "Request failed" }));
          setError(data.error || `Error: ${resp.status}`);
          setIsLoading(false);
          return;
        }

        const data = await resp.json();
        setImageUrl(data.imageUrl);
        setContent(data.text || "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Connection failed");
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  const clear = useCallback(() => {
    setContent("");
    setImageUrl(null);
    setError(null);
  }, []);

  return { content, imageUrl, isLoading, error, generate, clear };
}
