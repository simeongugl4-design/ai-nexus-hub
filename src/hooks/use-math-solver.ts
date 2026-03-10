import { useState, useCallback } from "react";
import { readSSEStream } from "@/lib/stream-utils";

const MATH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mega-math`;

export function useMathSolver() {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const solve = useCallback(async (prompt: string) => {
    setContent("");
    setIsLoading(true);
    setError(null);
    let accumulated = "";

    await readSSEStream({
      url: MATH_URL,
      body: { prompt },
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

  return { content, isLoading, error, solve, clear };
}
