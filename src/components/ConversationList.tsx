import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Plus, Trash2, Pencil, Check, X, Download, FileDown,
  Search, ArrowDownAZ, Clock, Sparkles, Pin, PinOff, HelpCircle,
  CornerDownLeft, ArrowUp, ArrowDown, Command, CornerUpLeft, CornerUpRight,
} from "lucide-react";
import { Conversation } from "@/lib/conversations";
import { formatDistanceToNow } from "date-fns";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onExport?: (id: string) => void;
  onExportPdf?: (id: string) => void;
  className?: string;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onExport,
  onExportPdf,
  className,
}: ConversationListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [query, setQuery] = useState("");
  type SortKey = "updated" | "newest" | "title";
  const [sort, setSort] = useState<SortKey>(() => {
    if (typeof window === "undefined") return "updated";
    return (localStorage.getItem("conv-sort") as SortKey) || "updated";
  });
  const setSortKey = (k: SortKey) => {
    setSort(k);
    try { localStorage.setItem("conv-sort", k); } catch { /* noop */ }
  };

  const [pinned, setPinned] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("conv-pinned") || "[]"); } catch { return []; }
  });
  const isPinned = (id: string) => pinned.includes(id);
  const togglePin = (id: string) => {
    setPinned((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      try { localStorage.setItem("conv-pinned", JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? conversations.filter((c) => c.title?.toLowerCase().includes(q)) : conversations.slice();
    base.sort((a, b) => {
      if (sort === "title") return (a.title || "").localeCompare(b.title || "");
      const aT = new Date(sort === "newest" ? a.created_at : a.updated_at).getTime();
      const bT = new Date(sort === "newest" ? b.created_at : b.updated_at).getTime();
      return bT - aT;
    });
    base.sort((a, b) => {
      const ap = pinned.includes(a.id) ? 1 : 0;
      const bp = pinned.includes(b.id) ? 1 : 0;
      return bp - ap;
    });
    return base;
  }, [conversations, query, sort, pinned]);

  const startEdit = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const confirmEdit = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const searchRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Persisted highlight id (survives remounts, page switches, refreshes)
  const readStoredHighlightId = (): string | null => {
    if (typeof window === "undefined") return null;
    try { return localStorage.getItem("conv-highlight-id"); } catch { return null; }
  };
  const writeStoredHighlightId = (id: string | null) => {
    try {
      if (id) localStorage.setItem("conv-highlight-id", id);
      else localStorage.removeItem("conv-highlight-id");
    } catch { /* noop */ }
  };

  // Highlight history (ring buffer) — powers Alt+[ / Alt+] back/forward jumps
  const HISTORY_MAX = 25;
  const readStoredHistory = (): string[] => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("conv-highlight-history") || "[]"); } catch { return []; }
  };
  const historyRef = useRef<string[]>(readStoredHistory());
  const historyPosRef = useRef<number>(historyRef.current.length - 1);
  const suppressHistoryPushRef = useRef(false);
  const pushHistory = (id: string) => {
    if (suppressHistoryPushRef.current) { suppressHistoryPushRef.current = false; return; }
    const cur = historyRef.current;
    if (cur[historyPosRef.current] === id) return;
    const truncated = cur.slice(0, historyPosRef.current + 1);
    truncated.push(id);
    const trimmed = truncated.slice(-HISTORY_MAX);
    historyRef.current = trimmed;
    historyPosRef.current = trimmed.length - 1;
    try { localStorage.setItem("conv-highlight-history", JSON.stringify(trimmed)); } catch { /* noop */ }
  };

  // Initial highlight: stored id → active conversation → 0
  const computeInitialHighlight = () => {
    const storedId = readStoredHighlightId();
    if (storedId) {
      const idx = filtered.findIndex((c) => c.id === storedId);
      if (idx >= 0) return idx;
    }
    if (activeId) {
      const idx = filtered.findIndex((c) => c.id === activeId);
      if (idx >= 0) return idx;
    }
    return 0;
  };
  const [highlight, setHighlight] = useState(computeInitialHighlight);
  const highlightedIdRef = useRef<string | null>(readStoredHighlightId());
  const [showHelp, setShowHelp] = useState(false);

  // Track highlighted conversation by id, persist it, and record history
  useEffect(() => {
    const id = filtered[highlight]?.id ?? null;
    highlightedIdRef.current = id;
    writeStoredHighlightId(id);
    if (id) pushHistory(id);
  }, [highlight, filtered]);

  // When filtered list changes (search/sort/new chats loaded), keep highlight stable.
  const prevFilteredRef = useRef(filtered);
  useEffect(() => {
    const prev = prevFilteredRef.current;
    prevFilteredRef.current = filtered;
    if (filtered.length === 0) { setHighlight(0); return; }

    const targetId = highlightedIdRef.current;
    const newIdx = targetId ? filtered.findIndex((c) => c.id === targetId) : -1;
    if (newIdx >= 0) { setHighlight(newIdx); return; }

    // Walk highlight history backwards to find the most recent still-present chat
    for (let i = historyRef.current.length - 1; i >= 0; i--) {
      const found = filtered.findIndex((c) => c.id === historyRef.current[i]);
      if (found >= 0) { setHighlight(found); return; }
    }

    // Closest remaining neighbor from previous list
    if (targetId && prev.length) {
      const prevIdx = prev.findIndex((c) => c.id === targetId);
      if (prevIdx >= 0) {
        for (let dist = 1; dist < prev.length; dist++) {
          for (const probe of [prevIdx - dist, prevIdx + dist]) {
            if (probe < 0 || probe >= prev.length) continue;
            const found = filtered.findIndex((c) => c.id === prev[probe].id);
            if (found >= 0) { setHighlight(found); return; }
          }
        }
      }
    }
    setHighlight((h) => Math.min(h, filtered.length - 1));
  }, [filtered]);

  // Scroll highlighted item into view
  useEffect(() => {
    const el = itemRefs.current[highlight];
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlight]);

  // Global keyboard shortcuts (desktop-friendly, harmless on mobile)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTyping =
        tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable;

      // Cmd/Ctrl+K — focus search (works even while typing elsewhere)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }

      // Cmd/Ctrl+Shift+N — new chat
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        onNew();
        return;
      }

      if (isTyping && target !== searchRef.current) return;

      // Sorting: Alt+1/2/3
      if (e.altKey && !e.metaKey && !e.ctrlKey) {
        if (e.key === "1") { e.preventDefault(); setSortKey("updated"); return; }
        if (e.key === "2") { e.preventDefault(); setSortKey("newest"); return; }
        if (e.key === "3") { e.preventDefault(); setSortKey("title"); return; }
        // History navigation: Alt+[ back, Alt+] forward
        if (e.key === "[" || e.key === "]") {
          const dir = e.key === "[" ? -1 : 1;
          const nextPos = historyPosRef.current + dir;
          if (nextPos < 0 || nextPos >= historyRef.current.length) return;
          const targetId = historyRef.current[nextPos];
          const idx = filtered.findIndex((c) => c.id === targetId);
          if (idx >= 0) {
            e.preventDefault();
            historyPosRef.current = nextPos;
            suppressHistoryPushRef.current = true;
            setHighlight(idx);
          }
          return;
        }
      }

      // Navigation when search is focused or list is visible
      if (target === searchRef.current || !isTyping) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlight((h) => Math.min(h + 1, filtered.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlight((h) => Math.max(h - 1, 0));
        } else if (e.key === "Enter" && target === searchRef.current) {
          const conv = filtered[highlight];
          if (conv) {
            e.preventDefault();
            onSelect(conv.id);
          }
        } else if (e.key === "Escape" && target === searchRef.current) {
          if (query) { e.preventDefault(); setQuery(""); }
        } else if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          setShowHelp((s) => !s);
        } else if (e.key === "Escape" && showHelp) {
          e.preventDefault();
          setShowHelp(false);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filtered, highlight, onNew, onSelect, query, showHelp]);

  return (
    <div className={`flex h-full flex-col border-r border-border bg-card/50 w-64 ${className ?? ""}`}>
      <div className="flex items-center justify-between border-b border-border p-3">
        <h3 className="text-sm font-semibold text-foreground">Chats</h3>
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowHelp(true)}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Keyboard shortcuts (?)"
          >
            <HelpCircle className="h-4 w-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onNew}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="New Chat"
          >
            <Plus className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      <div className="border-b border-border p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats… (⌘/Ctrl+K)"
            className="w-full rounded-md bg-muted/40 border border-border pl-7 pr-7 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:bg-muted/70"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Clear"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="mt-2 flex items-center gap-1">
          {([
            { k: "updated" as const, label: "Recent", Icon: Clock },
            { k: "newest" as const, label: "Newest", Icon: Sparkles },
            { k: "title" as const, label: "A–Z", Icon: ArrowDownAZ },
          ]).map(({ k, label, Icon }) => (
            <button
              key={k}
              onClick={() => setSortKey(k)}
              className={`flex flex-1 items-center justify-center gap-1 rounded-md border px-1.5 py-1 text-[10px] font-medium transition-colors ${
                sort === k
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title={`Sort by ${label}`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        <AnimatePresence>
          {filtered.map((conv, idx) => (
            <motion.div
              key={conv.id}
              ref={(el) => { itemRefs.current[idx] = el; }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className={`group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                conv.id === activeId
                  ? "bg-primary/10 border border-primary/30 text-foreground"
                  : idx === highlight
                  ? "bg-muted/60 text-foreground ring-1 ring-primary/30"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              onMouseEnter={() => setHighlight(idx)}
              onClick={() => onSelect(conv.id)}
            >
              {isPinned(conv.id) ? (
                <Pin className="h-3.5 w-3.5 shrink-0 text-primary fill-current" />
              ) : (
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              )}

              {editingId === conv.id ? (
                <div className="flex flex-1 items-center gap-1">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && confirmEdit()}
                    className="flex-1 bg-transparent text-xs outline-none border-b border-primary"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button onClick={(e) => { e.stopPropagation(); confirmEdit(); }} className="text-primary">
                    <Check className="h-3 w-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="text-muted-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{conv.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex md:hidden md:group-hover:flex group-hover:flex items-center gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePin(conv.id); }}
                      className={`rounded p-1 hover:bg-muted ${isPinned(conv.id) ? "text-primary" : ""}`}
                      title={isPinned(conv.id) ? "Unpin" : "Pin to top"}
                    >
                      {isPinned(conv.id) ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                    </button>
                    {onExportPdf && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onExportPdf(conv.id); }}
                        className="rounded p-1 hover:bg-primary/15 text-primary"
                        title="Export as PDF"
                      >
                        <FileDown className="h-3 w-3" />
                      </button>
                    )}
                    {onExport && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onExport(conv.id); }}
                        className="rounded p-1 hover:bg-muted"
                        title="Export as Markdown"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(conv.id, conv.title); }}
                      className="rounded p-1 hover:bg-muted"
                      title="Rename"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                      className="rounded p-1 hover:bg-destructive/20 text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <p className="px-3 py-8 text-center text-xs text-muted-foreground">
            {conversations.length === 0 ? "No conversations yet. Start chatting!" : "No chats match your search."}
          </p>
        )}
      </div>

      {/* Keyboard Shortcuts Cheat Sheet */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowHelp(false)}
          >
            <div
              className="mt-8 w-full max-w-sm rounded-xl border border-border bg-card/95 shadow-2xl p-5 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Keyboard Shortcuts</h4>
                <button
                  onClick={() => setShowHelp(false)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="mb-1.5 font-medium text-primary">Navigation</p>
                  <div className="space-y-1.5 text-muted-foreground">
                    <ShortcutRow keys={[<ArrowUp className="h-3 w-3" />, <ArrowDown className="h-3 w-3" />]} label="Move highlight up / down" />
                    <ShortcutRow keys={[<CornerDownLeft className="h-3 w-3" />]} label="Open highlighted conversation" />
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 font-medium text-primary">Search & Sort</p>
                  <div className="space-y-1.5 text-muted-foreground">
                    <ShortcutRow keys={[<Command className="h-3 w-3" />, "K"]} label="Focus search" />
                    <ShortcutRow keys={["Esc"]} label="Clear search (when focused)" />
                    <ShortcutRow keys={["Alt", "1"]} label="Sort by Recent" />
                    <ShortcutRow keys={["Alt", "2"]} label="Sort by Newest" />
                    <ShortcutRow keys={["Alt", "3"]} label="Sort by Title (A–Z)" />
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 font-medium text-primary">Highlight History</p>
                  <div className="space-y-1.5 text-muted-foreground">
                    <ShortcutRow keys={["Alt", <CornerUpLeft className="h-3 w-3" />]} label="Jump to previous highlight" />
                    <ShortcutRow keys={["Alt", <CornerUpRight className="h-3 w-3" />]} label="Jump to next highlight" />
                  </div>
                  <p className="mt-2 leading-relaxed text-[11px] text-muted-foreground/70">
                    The last 25 highlighted conversations are remembered in order. Use
                    Alt+[ / Alt+] to travel back and forward through your highlight
                    history, even across searches, sorts, and page loads.
                  </p>
                </div>

                <div>
                  <p className="mb-1.5 font-medium text-primary">General</p>
                  <div className="space-y-1.5 text-muted-foreground">
                    <ShortcutRow keys={[<Command className="h-3 w-3" />, "Shift", "N"]} label="New chat" />
                    <ShortcutRow keys={["?"]} label="Toggle this cheat sheet" />
                    <ShortcutRow keys={["Esc"]} label="Close cheat sheet" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
