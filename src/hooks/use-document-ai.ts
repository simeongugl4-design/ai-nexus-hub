import { useState, useCallback } from "react";
import { readSSEStream } from "@/lib/stream-utils";
import { addToHistory } from "@/pages/HistoryPage";

export function useDocumentAI() {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useCallback(async (prompt: string, documentContent?: string) => {
    setContent("");
    setIsLoading(true);
    setError(null);

    addToHistory({ query: prompt, source: "document", preview: documentContent?.slice(0, 50) || "" });

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    let accumulated = "";
    await readSSEStream({
      url: `${supabaseUrl}/functions/v1/mega-document`,
      body: { prompt, documentContent },
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
  }, []);

  const clear = useCallback(() => {
    setContent("");
    setError(null);
  }, []);

  return { content, isLoading, error, query, clear };
}
