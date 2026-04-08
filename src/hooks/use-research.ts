import { useState, useCallback, useEffect } from "react";
import { streamResearch, parseResearchResponse, ResearchSource } from "@/lib/research-api";
import { addToHistory } from "@/pages/HistoryPage";
import {
  AISession, getSessions, createSession, updateSessionTitle,
  deleteSession as delSession, getSessionEntries, saveSessionEntry, truncateTitle,
} from "@/lib/ai-sessions";

export function useResearch() {
  const [rawContent, setRawContent] = useState("");
  const [content, setContent] = useState("");
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<AISession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ query: string; content: string; sources: ResearchSource[] }[]>([]);

  useEffect(() => {
    getSessions("research").then(setSessions).catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeSessionId) { setHistory([]); setContent(""); setSources([]); setQuery(""); setIsComplete(false); return; }
    getSessionEntries(activeSessionId).then((entries) => {
      const h = entries.map((e) => {
        const parsed = parseResearchResponse(e.response);
        return { query: e.query, content: parsed.content, sources: parsed.sources };
      });
      setHistory(h);
      if (h.length > 0) {
        const last = h[h.length - 1];
        setContent(last.content);
        setSources(last.sources);
        setQuery(last.query);
        setIsComplete(true);
      }
    });
  }, [activeSessionId]);

  const research = useCallback(async (searchQuery: string, model?: string) => {
    setRawContent("");
    setContent("");
    setSources([]);
    setIsLoading(true);
    setIsComplete(false);
    setQuery(searchQuery);
    setError(null);

    addToHistory({ query: searchQuery, source: "research", preview: "" });

    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        const s = await createSession("research", truncateTitle(searchQuery), model || "research");
        sessionId = s.id;
        setActiveSessionId(sessionId);
        setSessions((prev) => [s, ...prev]);
      } catch { setIsLoading(false); return; }
    }

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
      onDone: async () => {
        setIsLoading(false);
        setIsComplete(true);
        const parsed = parseResearchResponse(accumulated);
        setContent(parsed.content);
        setSources(parsed.sources);
        if (sessionId) {
          await saveSessionEntry(sessionId, searchQuery, accumulated);
          setHistory((prev) => [...prev, { query: searchQuery, content: parsed.content, sources: parsed.sources }]);
        }
      },
      onError: (err) => { setIsLoading(false); setError(err); },
    });
  }, [activeSessionId]);

  const clear = useCallback(() => {
    setRawContent(""); setContent(""); setSources([]); setIsLoading(false);
    setIsComplete(false); setQuery(""); setError(null); setHistory([]);
    setActiveSessionId(null);
  }, []);

  const newSession = useCallback(() => { clear(); }, [clear]);

  const selectSession = useCallback((id: string) => { setActiveSessionId(id); }, []);

  const deleteSession = useCallback(async (id: string) => {
    await delSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) clear();
  }, [activeSessionId, clear]);

  const renameSession = useCallback(async (id: string, title: string) => {
    await updateSessionTitle(id, title);
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
  }, []);

  return {
    content, sources, isLoading, isComplete, query, error, research, clear, history,
    sessions, activeSessionId, newSession, selectSession, deleteSession, renameSession,
  };
}
