import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Search, Trash2, MessageSquare, ArrowRight, X, BookOpen, Code, Calculator, FileText, ImageIcon } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { useNavigate } from "react-router-dom";

export type HistoryEntry = {
  id: string;
  query: string;
  source: string;
  timestamp: Date;
  preview?: string;
};

const HISTORY_KEY = "megakumul-history";

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((e: any) => ({ ...e, timestamp: new Date(e.timestamp) }));
  } catch { return []; }
}

export function addToHistory(entry: Omit<HistoryEntry, "id" | "timestamp">) {
  const history = loadHistory();
  const newEntry: HistoryEntry = { ...entry, id: crypto.randomUUID(), timestamp: new Date() };
  const updated = [newEntry, ...history].slice(0, 200);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

const sourceIcons: Record<string, any> = {
  chat: MessageSquare,
  research: BookOpen,
  code: Code,
  math: Calculator,
  document: FileText,
  image: ImageIcon,
};

const sourceColors: Record<string, string> = {
  chat: "text-primary",
  research: "text-secondary",
  code: "text-[hsl(150,80%,50%)]",
  math: "text-primary",
  document: "text-[hsl(30,90%,55%)]",
  image: "text-[hsl(45,90%,55%)]",
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const [search, setSearch] = useState("");
  const [selectedModel, setSelectedModel] = useState("fast");
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const navigate = useNavigate();

  const filtered = history.filter(h => {
    const matchSearch = h.query.toLowerCase().includes(search.toLowerCase());
    const matchSource = !filterSource || h.source === filterSource;
    return matchSearch && matchSource;
  });

  const deleteEntry = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const clearAll = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const sources = [...new Set(history.map(h => h.source))];

  const getRouteForSource = (source: string) => {
    const routes: Record<string, string> = { chat: "/chat", research: "/research", code: "/code", math: "/math", document: "/documents", image: "/image-ai" };
    return routes[source] || "/chat";
  };

  return (
    <div className="flex h-screen flex-col">
      <TopNav selectedModel={selectedModel} onModelChange={setSelectedModel} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-heading font-bold gradient-text">History</h1>
              <p className="text-sm text-muted-foreground">{history.length} queries recorded</p>
            </div>
            {history.length > 0 && (
              <button onClick={clearAll} className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/20">
                <Trash2 className="h-3 w-3" /> Clear All
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2 mb-4">
            <Search className="ml-2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search history..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
            {search && <button onClick={() => setSearch("")} className="p-1 text-muted-foreground"><X className="h-3.5 w-3.5" /></button>}
          </div>

          {sources.length > 0 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              <button onClick={() => setFilterSource(null)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${!filterSource ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>All</button>
              {sources.map(source => {
                const Icon = sourceIcons[source] || MessageSquare;
                return (
                  <button key={source} onClick={() => setFilterSource(filterSource === source ? null : source)} className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-all ${filterSource === source ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                    <Icon className="h-3 w-3" /> {source}
                  </button>
                );
              })}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">{history.length === 0 ? "No history yet. Start using MegaKUMUL to see your queries here!" : "No matching results."}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {filtered.map((entry, i) => {
                  const Icon = sourceIcons[entry.source] || MessageSquare;
                  const color = sourceColors[entry.source] || "text-primary";
                  return (
                    <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }} transition={{ delay: i * 0.03 }} className="group rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{entry.query}</p>
                            {entry.preview && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{entry.preview}</p>}
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize bg-muted ${color}`}>{entry.source}</span>
                              <span className="text-[10px] text-muted-foreground">{entry.timestamp.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => navigate(getRouteForSource(entry.source))} className="rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground"><ArrowRight className="h-3.5 w-3.5" /></button>
                          <button onClick={() => deleteEntry(entry.id)} className="rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
