import { useState, useCallback, useEffect } from "react";
import { readSSEStream } from "@/lib/stream-utils";
import { addToHistory } from "@/pages/HistoryPage";
import {
  AISession, getSessions, createSession, updateSessionTitle,
  deleteSession as delSession, getSessionEntries, saveSessionEntry, truncateTitle,
} from "@/lib/ai-sessions";

export function useCodeAssistant() {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<AISession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ query: string; response: string }[]>([]);

  useEffect(() => {
    getSessions("code").then(setSessions).catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeSessionId) { setHistory([]); setContent(""); return; }
    getSessionEntries(activeSessionId).then((entries) => {
      const h = entries.map((e) => ({ query: e.query, response: e.response }));
      setHistory(h);
      if (h.length > 0) { setContent(h[h.length - 1].response); }
    });
  }, [activeSessionId]);

  const generate = useCallback(async (prompt: string, language: string, action: string, model?: string) => {
    setContent("");
    setIsLoading(true);
    setError(null);

    addToHistory({ query: prompt, source: "code", preview: `${action} - ${language}` });

    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        const s = await createSession("code", truncateTitle(prompt), model || "coding", { language, action });
        sessionId = s.id;
        setActiveSessionId(sessionId);
        setSessions((prev) => [s, ...prev]);
      } catch { setIsLoading(false); return; }
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    let accumulated = "";
    await readSSEStream({
      url: `${supabaseUrl}/functions/v1/mega-code`,
      body: { prompt, language, action, model },
      onDelta: (chunk) => { accumulated += chunk; setContent(accumulated); },
      onDone: async () => {
        setIsLoading(false);
        if (sessionId) {
          await saveSessionEntry(sessionId, prompt, accumulated, { language, action });
          setHistory((prev) => [...prev, { query: prompt, response: accumulated }]);
        }
      },
      onError: (err) => { setIsLoading(false); setError(err); },
    });
  }, [activeSessionId]);

  const clear = useCallback(() => {
    setContent(""); setError(null); setHistory([]); setActiveSessionId(null);
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
    content, isLoading, error, generate, clear, history,
    sessions, activeSessionId, newSession, selectSession, deleteSession, renameSession,
  };
}
