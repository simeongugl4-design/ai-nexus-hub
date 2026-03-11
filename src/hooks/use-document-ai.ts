import { useState, useCallback } from "react";
import { readSSEStream } from "@/lib/stream-utils";
import { addToHistory } from "@/pages/HistoryPage";

const DOC_DEMO_RESPONSES = [
  "# Document Analysis\n\n",
  "## Summary\n\n",
  "I've analyzed the provided content. Here are my findings:\n\n",
  "### Key Points\n\n",
  "1. **Main Theme**: The document discusses important concepts and methodologies.\n",
  "2. **Structure**: Well-organized with clear sections and supporting evidence.\n",
  "3. **Findings**: Multiple key insights were identified.\n\n",
  "### Detailed Analysis\n\n",
  "The document presents a comprehensive overview of the subject matter. ",
  "Key arguments are supported by data and citations from reputable sources.\n\n",
  "### Recommendations\n\n",
  "- Review the methodology section for potential improvements\n",
  "- Consider expanding the literature review\n",
  "- Strengthen the conclusion with actionable insights\n\n",
  "> **Demo Mode**: Connect a backend for real document analysis with AI.",
];

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
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'undefined') {
      let accumulated = "";
      for (const chunk of DOC_DEMO_RESPONSES) {
        await new Promise(r => setTimeout(r, 80 + Math.random() * 150));
        accumulated += chunk;
        setContent(accumulated);
      }
      setIsLoading(false);
      return;
    }

    let accumulated = "";
    const DOC_URL = `${supabaseUrl}/functions/v1/mega-document`;
    await readSSEStream({
      url: DOC_URL,
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
