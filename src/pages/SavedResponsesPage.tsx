import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Trash2, Search, Copy, Check, X, MessageSquare, BookOpen, Code } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

export type SavedResponse = {
  id: string;
  title: string;
  content: string;
  source: string;
  savedAt: Date;
};

const SAVED_KEY = "megakumul-saved";

export function loadSaved(): SavedResponse[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((e: any) => ({ ...e, savedAt: new Date(e.savedAt) }));
  } catch { return []; }
}

export function saveResponse(resp: Omit<SavedResponse, "id" | "savedAt">) {
  const saved = loadSaved();
  const entry: SavedResponse = { ...resp, id: crypto.randomUUID(), savedAt: new Date() };
  const updated = [entry, ...saved];
  localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
  return entry;
}

const sourceIcons: Record<string, any> = {
  chat: MessageSquare, research: BookOpen, code: Code,
};

export default function SavedResponsesPage() {
  const [responses, setResponses] = useState<SavedResponse[]>(loadSaved);
  const [search, setSearch] = useState("");
  const [selectedModel, setSelectedModel] = useState("fast");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = responses.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.content.toLowerCase().includes(search.toLowerCase())
  );

  const deleteResponse = (id: string) => {
    const updated = responses.filter(r => r.id !== id);
    setResponses(updated);
    localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
    toast.success("Response removed");
  };

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-screen flex-col">
      <TopNav selectedModel={selectedModel} onModelChange={setSelectedModel} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-heading font-bold gradient-text mb-1">Saved Responses</h1>
          <p className="text-sm text-muted-foreground mb-6">Your bookmarked AI responses ({responses.length})</p>

          <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2 mb-6">
            <Search className="ml-2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search saved responses..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
            {search && <button onClick={() => setSearch("")} className="p-1 text-muted-foreground"><X className="h-3.5 w-3.5" /></button>}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Star className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">{responses.length === 0 ? "No saved responses yet. Star responses from chat to save them here!" : "No matching responses."}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filtered.map((resp, i) => {
                  const Icon = sourceIcons[resp.source] || Star;
                  const isExpanded = expandedId === resp.id;
                  return (
                    <motion.div key={resp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-border bg-card overflow-hidden group">
                      <div className="flex items-start justify-between p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : resp.id)}>
                        <div className="flex items-start gap-3 min-w-0">
                          <Star className="h-4 w-4 mt-0.5 shrink-0 text-[hsl(45,90%,55%)] fill-[hsl(45,90%,55%)]" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{resp.title}</p>
                            {!isExpanded && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{resp.content.slice(0, 120)}...</p>}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium capitalize text-primary">{resp.source}</span>
                              <span className="text-[10px] text-muted-foreground">{resp.savedAt.toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); handleCopy(resp.id, resp.content); }} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                            {copiedId === resp.id ? <Check className="h-3.5 w-3.5 text-[hsl(150,80%,50%)]" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); deleteResponse(resp.id); }} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border overflow-hidden">
                            <div className="p-4 prose prose-sm prose-invert max-w-none prose-headings:font-heading">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{resp.content}</ReactMarkdown>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
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
