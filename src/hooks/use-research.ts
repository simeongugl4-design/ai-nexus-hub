import { useState, useCallback } from "react";
import { streamResearch, parseResearchResponse, ResearchSource } from "@/lib/research-api";
import { addToHistory } from "@/pages/HistoryPage";

export function useResearch() {
  const [rawContent, setRawContent] = useState("");
  const [content, setContent] = useState("");
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const research = useCallback(async (searchQuery: string, model?: string) => {
    setRawContent("");
    setContent("");
    setSources([]);
    setIsLoading(true);
    setIsComplete(false);
    setQuery(searchQuery);
    setError(null);

    addToHistory({ query: searchQuery, source: "research", preview: "" });

    let accumulated = "";

    await streamResearch({
      query: searchQuery,
      model,
      onDelta: (chunk) => {
        accumulated += chunk;
        setRawContent(accumulated);
        const parsed = parseResearchResponse(accumulated);
        setContent(parsed.content);
        setSources(parsed.sources);
      },
      onDone: () => {
        setIsLoading(false);
        setIsComplete(true);
        const parsed = parseResearchResponse(accumulated);
        setContent(parsed.content);
        setSources(parsed.sources);
      },
      onError: (err) => {
        setIsLoading(false);
        setError(err);
      },
    });
  }, []);

  const clear = useCallback(() => {
    setRawContent("");
    setContent("");
    setSources([]);
    setIsLoading(false);
    setIsComplete(false);
    setQuery("");
    setError(null);
  }, []);

  return { content, sources, isLoading, isComplete, query, error, research, clear };
}
