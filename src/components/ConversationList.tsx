import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Plus, Trash2, Pencil, Check, X, Download, FileDown,
  Search, ArrowDownAZ, Clock, Sparkles, Pin, PinOff, HelpCircle,
  CornerDownLeft, ArrowUp, ArrowDown, Command, CornerUpLeft, CornerUpRight,
  CheckSquare, Square, Zap, ChevronsUp, ChevronsDown, Hash,
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

function ShortcutRow({ keys, label }: { keys: (string | React.ReactNode)[]; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className="inline-flex items-center justify-center rounded border border-border bg-muted/60 px-1 py-0.5 min-w-[1.25rem] text-[10px] font-mono text-foreground shadow-sm"
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}

// Fuzzy subsequence match with positional scoring.
// Returns { score, matches } where higher score = better match. null if no match.
function fuzzyMatch(needle: string, haystack: string): { score: number; matches: number[] } | null {
  if (!needle) return { score: 0, matches: [] };
  const n = needle.toLowerCase();
  const h = haystack.toLowerCase();
  let hi = 0;
  let score = 0;
  let streak = 0;
  let lastIdx = -2;
  const matches: number[] = [];
  for (let ni = 0; ni < n.length; ni++) {
    const c = n[ni];
    let found = -1;
    while (hi < h.length) {
      if (h[hi] === c) { found = hi; break; }
      hi++;
    }
    if (found === -1) return null;
    matches.push(found);
    // bonus: consecutive chars, start-of-word, start-of-string
    if (found === lastIdx + 1) { streak++; score += 5 + streak * 2; }
    else { streak = 0; score += 1; }
    if (found === 0) score += 8;
    else if (haystack[found - 1] === " " || haystack[found - 1] === "-" || haystack[found - 1] === "_") score += 4;
    lastIdx = found;
    hi++;
  }
  // shorter haystack = more relevant
  score -= Math.max(0, haystack.length - n.length) * 0.05;
  return { score, matches };
}

function HighlightedTitle({ text, matches }: { text: string; matches: number[] }) {
  if (!matches.length) return <>{text}</>;
  const set = new Set(matches);
  return (
    <>
      {text.split("").map((ch, i) =>
        set.has(i) ? (
          <span key={i} className="text-primary font-semibold">{ch}</span>
        ) : (
          <span key={i}>{ch}</span>
        )
      )}
    </>
  );
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
  const SORT_CYCLE: SortKey[] = ["updated", "newest", "title"];
  const [sort, setSort] = useState<SortKey>(() => {
    if (typeof window === "undefined") return "updated";
    return (localStorage.getItem("conv-sort") as SortKey) || "updated";
  });
  const setSortKey = (k: SortKey) => {
    setSort(k);
    try { localStorage.setItem("conv-sort", k); } catch { /* noop */ }
  };
  const cycleSort = () => setSortKey(SORT_CYCLE[(SORT_CYCLE.indexOf(sort) + 1) % SORT_CYCLE.length]);

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

  // Multi-select set
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const clearSelection = () => setSelected(new Set());

  // Compute filtered + sorted + fuzzy-matched list
  const { filtered, matchMap } = useMemo(() => {
    const q = query.trim();
    const matchMap = new Map<string, number[]>();
    let base: Conversation[];
    if (q) {
      const scored = conversations
        .map((c) => ({ c, m: fuzzyMatch(q, c.title || "") }))
        .filter((x) => x.m !== null) as { c: Conversation; m: { score: number; matches: number[] } }[];
      scored.sort((a, b) => b.m.score - a.m.score);
      scored.forEach((x) => matchMap.set(x.c.id, x.m.matches));
      base = scored.map((x) => x.c);
    } else {
      base = conversations.slice();
      base.sort((a, b) => {
        if (sort === "title") return (a.title || "").localeCompare(b.title || "");
        const aT = new Date(sort === "newest" ? a.created_at : a.updated_at).getTime();
        const bT = new Date(sort === "newest" ? b.created_at : b.updated_at).getTime();
        return bT - aT;
      });
    }
    base.sort((a, b) => {
      const ap = pinned.includes(a.id) ? 1 : 0;
      const bp = pinned.includes(b.id) ? 1 : 0;
      return bp - ap;
    });
    return { filtered: base, matchMap };
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
  const paletteRef = useRef<HTMLInputElement>(null);

  // Persisted highlight id
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

  // Highlight history ring buffer
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
  const [showPalette, setShowPalette] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [paletteIdx, setPaletteIdx] = useState(0);

  // Track highlighted conversation
  useEffect(() => {
    const id = filtered[highlight]?.id ?? null;
    highlightedIdRef.current = id;
    writeStoredHighlightId(id);
    if (id) pushHistory(id);
  }, [highlight, filtered]);

  const prevFilteredRef = useRef(filtered);
  useEffect(() => {
    const prev = prevFilteredRef.current;
    prevFilteredRef.current = filtered;
    if (filtered.length === 0) { setHighlight(0); return; }
    const targetId = highlightedIdRef.current;
    const newIdx = targetId ? filtered.findIndex((c) => c.id === targetId) : -1;
    if (newIdx >= 0) { setHighlight(newIdx); return; }
    for (let i = historyRef.current.length - 1; i >= 0; i--) {
      const found = filtered.findIndex((c) => c.id === historyRef.current[i]);
      if (found >= 0) { setHighlight(found); return; }
    }
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

  useEffect(() => {
    const el = itemRefs.current[highlight];
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlight]);

  // Palette results
  const paletteResults = useMemo(() => {
    const q = paletteQuery.trim();
    if (!q) return conversations.slice(0, 20).map((c) => ({ c, matches: [] as number[], score: 0 }));
    const scored = conversations
      .map((c) => ({ c, m: fuzzyMatch(q, c.title || "") }))
      .filter((x) => x.m !== null) as { c: Conversation; m: { score: number; matches: number[] } }[];
    scored.sort((a, b) => b.m.score - a.m.score);
    return scored.slice(0, 30).map((x) => ({ c: x.c, matches: x.m.matches, score: x.m.score }));
  }, [paletteQuery, conversations]);

  useEffect(() => { setPaletteIdx(0); }, [paletteQuery, showPalette]);

  // Bulk delete confirmation
  const bulkDelete = useCallback(() => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} conversation${selected.size > 1 ? "s" : ""}? This cannot be undone.`)) return;
    selected.forEach((id) => onDelete(id));
    clearSelection();
  }, [selected, onDelete]);

  // Leader-key state for vim-style sequences: gg, dd, g+number
  const leaderRef = useRef<{ key: string; t: number } | null>(null);
  const LEADER_WINDOW = 800;
  const setLeader = (k: string) => { leaderRef.current = { key: k, t: Date.now() }; };
  const consumeLeader = (k: string): boolean => {
    const l = leaderRef.current;
    if (!l || l.key !== k || Date.now() - l.t > LEADER_WINDOW) return false;
    leaderRef.current = null;
    return true;
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable;

      // ===== Always-available =====
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setShowPalette((s) => !s);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        onNew();
        return;
      }

      // ===== Palette is open =====
      if (showPalette) {
        if (e.key === "Escape") { e.preventDefault(); setShowPalette(false); return; }
        if (e.key === "ArrowDown") { e.preventDefault(); setPaletteIdx((i) => Math.min(i + 1, paletteResults.length - 1)); return; }
        if (e.key === "ArrowUp") { e.preventDefault(); setPaletteIdx((i) => Math.max(i - 1, 0)); return; }
        if (e.key === "Enter") {
          const r = paletteResults[paletteIdx];
          if (r) { e.preventDefault(); onSelect(r.c.id); setShowPalette(false); setPaletteQuery(""); }
          return;
        }
        return;
      }

      // Cheat sheet close
      if (showHelp && e.key === "Escape") { e.preventDefault(); setShowHelp(false); return; }

      // Allow ? when typing in search
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping) {
        e.preventDefault();
        setShowHelp((s) => !s);
        return;
      }

      // Alt sort & history (work even while typing in search)
      if (e.altKey && !e.metaKey && !e.ctrlKey) {
        if (e.key === "1") { e.preventDefault(); setSortKey("updated"); return; }
        if (e.key === "2") { e.preventDefault(); setSortKey("newest"); return; }
        if (e.key === "3") { e.preventDefault(); setSortKey("title"); return; }
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

      // Bulk delete
      if (e.shiftKey && (e.key === "Delete" || e.key === "Backspace") && selected.size > 0) {
        e.preventDefault();
        bulkDelete();
        return;
      }

      // Search-focused: Enter opens, Esc clears
      if (target === searchRef.current) {
        if (e.key === "Enter") {
          const conv = filtered[highlight];
          if (conv) { e.preventDefault(); onSelect(conv.id); }
          return;
        }
        if (e.key === "Escape") {
          if (query) { e.preventDefault(); setQuery(""); }
          else { e.preventDefault(); searchRef.current?.blur(); }
          return;
        }
      }

      // Arrows work in search and list
      if (e.key === "ArrowDown" && (target === searchRef.current || !isTyping)) {
        e.preventDefault();
        setHighlight((h) => Math.min(h + 1, filtered.length - 1));
        return;
      }
      if (e.key === "ArrowUp" && (target === searchRef.current || !isTyping)) {
        e.preventDefault();
        setHighlight((h) => Math.max(h - 1, 0));
        return;
      }
      if (e.key === "PageDown" && !isTyping) {
        e.preventDefault();
        setHighlight((h) => Math.min(h + 10, filtered.length - 1));
        return;
      }
      if (e.key === "PageUp" && !isTyping) {
        e.preventDefault();
        setHighlight((h) => Math.max(h - 10, 0));
        return;
      }
      if (e.key === "Home" && !isTyping) {
        e.preventDefault();
        setHighlight(0);
        return;
      }
      if (e.key === "End" && !isTyping) {
        e.preventDefault();
        setHighlight(Math.max(0, filtered.length - 1));
        return;
      }

      // ===== Single-key power shortcuts (only when NOT typing) =====
      if (isTyping) return;

      const cur = filtered[highlight];

      // Vim-style j/k navigation
      if (e.key === "j") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, filtered.length - 1)); return; }
      if (e.key === "k") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); return; }

      // gg → top, G → bottom
      if (e.key === "g" && !e.shiftKey) {
        if (consumeLeader("g")) { e.preventDefault(); setHighlight(0); return; }
        setLeader("g");
        return;
      }
      if (e.key === "G") { e.preventDefault(); setHighlight(Math.max(0, filtered.length - 1)); return; }

      // g+number jump (1-9): use leader g then digit
      if (/^[1-9]$/.test(e.key) && consumeLeader("g")) {
        e.preventDefault();
        const n = parseInt(e.key, 10) - 1;
        setHighlight(Math.min(n, filtered.length - 1));
        return;
      }

      // Enter to open
      if (e.key === "Enter" && cur) { e.preventDefault(); onSelect(cur.id); return; }

      // dd → delete highlighted
      if (e.key === "d") {
        if (consumeLeader("d")) {
          if (cur) { e.preventDefault(); onDelete(cur.id); }
          return;
        }
        setLeader("d");
        return;
      }

      // p → toggle pin
      if (e.key === "p" && cur) { e.preventDefault(); togglePin(cur.id); return; }
      // r → rename
      if (e.key === "r" && cur) { e.preventDefault(); startEdit(cur.id, cur.title); return; }
      // e → export markdown, E → export pdf
      if (e.key === "e" && cur && onExport) { e.preventDefault(); onExport(cur.id); return; }
      if (e.key === "E" && cur && onExportPdf) { e.preventDefault(); onExportPdf(cur.id); return; }
      // s → cycle sort
      if (e.key === "s") { e.preventDefault(); cycleSort(); return; }
      // n → new chat
      if (e.key === "n") { e.preventDefault(); onNew(); return; }
      // x → toggle select
      if (e.key === "x" && cur) { e.preventDefault(); toggleSelect(cur.id); return; }
      // a → select all (toggle)
      if (e.key === "a") {
        e.preventDefault();
        if (selected.size === filtered.length) clearSelection();
        else setSelected(new Set(filtered.map((c) => c.id)));
        return;
      }
      // / → focus search
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }
      // Esc → clear selection
      if (e.key === "Escape") {
        if (selected.size) { e.preventDefault(); clearSelection(); }
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filtered, highlight, onNew, onSelect, onDelete, onExport, onExportPdf, query, showHelp, showPalette, paletteResults, paletteIdx, selected, sort, bulkDelete]);

  // Focus palette input when opened
  useEffect(() => {
    if (showPalette) {
      setTimeout(() => paletteRef.current?.focus(), 10);
    }
  }, [showPalette]);

  const sortLabel = sort === "updated" ? "Recent" : sort === "newest" ? "Newest" : "A–Z";

  return (
    <div className={`relative flex h-full flex-col border-r border-border bg-card/50 w-64 ${className ?? ""}`}>
      <div className="flex items-center justify-between border-b border-border p-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          Chats
          <Zap className="h-3 w-3 text-primary" />
        </h3>
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowPalette(true)}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Command palette (⌘/Ctrl+P)"
          >
            <Command className="h-4 w-4" />
          </motion.button>
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
            title="New Chat (n or ⌘/Ctrl+Shift+N)"
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
            placeholder="Fuzzy search… (/, ⌘K)"
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

      {/* Multi-select action bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between gap-2 border-b border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px]"
          >
            <span className="text-primary font-medium">{selected.size} selected</span>
            <div className="flex items-center gap-1">
              <button
                onClick={bulkDelete}
                className="rounded px-2 py-0.5 text-destructive hover:bg-destructive/15"
                title="Delete selected (Shift+Del)"
              >
                Delete
              </button>
              <button
                onClick={clearSelection}
                className="rounded px-2 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Clear selection (Esc)"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        <AnimatePresence>
          {filtered.map((conv, idx) => {
            const matches = matchMap.get(conv.id) || [];
            const isSel = selected.has(conv.id);
            return (
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
                } ${isSel ? "ring-1 ring-primary/60 bg-primary/5" : ""}`}
                onMouseEnter={() => setHighlight(idx)}
                onClick={(e) => {
                  if (e.shiftKey || e.metaKey || e.ctrlKey) { toggleSelect(conv.id); return; }
                  onSelect(conv.id);
                }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSelect(conv.id); }}
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Select (x)"
                >
                  {isSel ? <CheckSquare className="h-3.5 w-3.5 text-primary" /> : <Square className="h-3.5 w-3.5" />}
                </button>

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
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
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
                      <p className="text-xs font-medium truncate">
                        <HighlightedTitle text={conv.title} matches={matches} />
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex md:hidden md:group-hover:flex group-hover:flex items-center gap-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePin(conv.id); }}
                        className={`rounded p-1 hover:bg-muted ${isPinned(conv.id) ? "text-primary" : ""}`}
                        title={isPinned(conv.id) ? "Unpin (p)" : "Pin to top (p)"}
                      >
                        {isPinned(conv.id) ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                      </button>
                      {onExportPdf && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onExportPdf(conv.id); }}
                          className="rounded p-1 hover:bg-primary/15 text-primary"
                          title="Export as PDF (Shift+E)"
                        >
                          <FileDown className="h-3 w-3" />
                        </button>
                      )}
                      {onExport && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onExport(conv.id); }}
                          className="rounded p-1 hover:bg-muted"
                          title="Export as Markdown (e)"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); startEdit(conv.id, conv.title); }}
                        className="rounded p-1 hover:bg-muted"
                        title="Rename (r)"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                        className="rounded p-1 hover:bg-destructive/20 text-destructive"
                        title="Delete (dd)"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <p className="px-3 py-8 text-center text-xs text-muted-foreground">
            {conversations.length === 0 ? "No conversations yet. Start chatting!" : "No chats match your search."}
          </p>
        )}
      </div>

      {/* Status footer */}
      <div className="border-t border-border bg-muted/20 px-3 py-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Hash className="h-2.5 w-2.5" />
          {filtered.length > 0 ? `${highlight + 1}/${filtered.length}` : "0/0"}
          {conversations.length !== filtered.length && (
            <span className="text-muted-foreground/60">of {conversations.length}</span>
          )}
        </span>
        <span className="flex items-center gap-1">
          <span className="text-primary/70">{sortLabel}</span>
          <span>· press</span>
          <kbd className="rounded border border-border bg-muted px-1 text-[9px] font-mono">?</kbd>
        </span>
      </div>

      {/* Command Palette */}
      <AnimatePresence>
        {showPalette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-[15vh]"
            onClick={() => setShowPalette(false)}
          >
            <motion.div
              initial={{ y: -8, scale: 0.97 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-lg rounded-xl border border-border bg-card/95 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
                <Command className="h-4 w-4 text-primary shrink-0" />
                <input
                  ref={paletteRef}
                  value={paletteQuery}
                  onChange={(e) => setPaletteQuery(e.target.value)}
                  placeholder="Jump to any conversation… (fuzzy)"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">Esc</kbd>
              </div>
              <div className="max-h-[50vh] overflow-y-auto scrollbar-thin py-1">
                {paletteResults.length === 0 && (
                  <p className="px-4 py-6 text-center text-xs text-muted-foreground">No matches</p>
                )}
                {paletteResults.map((r, i) => (
                  <button
                    key={r.c.id}
                    onMouseEnter={() => setPaletteIdx(i)}
                    onClick={() => { onSelect(r.c.id); setShowPalette(false); setPaletteQuery(""); }}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                      i === paletteIdx
                        ? "bg-primary/15 text-foreground"
                        : "text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    {pinned.includes(r.c.id) ? (
                      <Pin className="h-3 w-3 text-primary fill-current shrink-0" />
                    ) : (
                      <MessageSquare className="h-3 w-3 shrink-0" />
                    )}
                    <span className="flex-1 truncate">
                      <HighlightedTitle text={r.c.title} matches={r.matches} />
                    </span>
                    <span className="text-[10px] text-muted-foreground/70 shrink-0">
                      {formatDistanceToNow(new Date(r.c.updated_at), { addSuffix: true })}
                    </span>
                    {i === paletteIdx && <CornerDownLeft className="h-3 w-3 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/20 px-3 py-1.5 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="flex items-center gap-1"><ArrowUp className="h-2.5 w-2.5" /><ArrowDown className="h-2.5 w-2.5" /> navigate</span>
                  <span className="flex items-center gap-1"><CornerDownLeft className="h-2.5 w-2.5" /> open</span>
                </span>
                <span>{paletteResults.length} result{paletteResults.length === 1 ? "" : "s"}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Cheat Sheet */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={() => setShowHelp(false)}
          >
            <div
              className="mt-4 w-full max-w-sm rounded-xl border border-border bg-card/95 shadow-2xl p-5 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  Power Shortcuts
                </h4>
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
                    <ShortcutRow keys={[<ArrowUp className="h-3 w-3" />, <ArrowDown className="h-3 w-3" />]} label="Move up / down" />
                    <ShortcutRow keys={["j", "k"]} label="Vim-style up / down" />
                    <ShortcutRow keys={[<ChevronsUp className="h-3 w-3" />]} label="PageUp / PageDown — ±10" />
                    <ShortcutRow keys={["g", "g"]} label="Jump to top" />
                    <ShortcutRow keys={["G"]} label="Jump to bottom" />
                    <ShortcutRow keys={["g", "1–9"]} label="Jump to index 1–9" />
                    <ShortcutRow keys={[<CornerDownLeft className="h-3 w-3" />]} label="Open highlighted" />
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 font-medium text-primary">Command Palette & Search</p>
                  <div className="space-y-1.5 text-muted-foreground">
                    <ShortcutRow keys={[<Command className="h-3 w-3" />, "P"]} label="Open command palette (fuzzy)" />
                    <ShortcutRow keys={[<Command className="h-3 w-3" />, "K"]} label="Focus search" />
                    <ShortcutRow keys={["/"]} label="Focus search (vim)" />
                    <ShortcutRow keys={["Esc"]} label="Clear search / close" />
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 font-medium text-primary">Item Actions</p>
                  <div className="space-y-1.5 text-muted-foreground">
                    <ShortcutRow keys={["p"]} label="Pin / unpin" />
                    <ShortcutRow keys={["r"]} label="Rename" />
                    <ShortcutRow keys={["e"]} label="Export Markdown" />
                    <ShortcutRow keys={["Shift", "E"]} label="Export PDF" />
                    <ShortcutRow keys={["d", "d"]} label="Delete (vim)" />
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 font-medium text-primary">Multi-select</p>
                  <div className="space-y-1.5 text-muted-foreground">
                    <ShortcutRow keys={["x"]} label="Toggle select on highlighted" />
                    <ShortcutRow keys={["a"]} label="Select all (toggle)" />
                    <ShortcutRow keys={["Shift", "Del"]} label="Bulk delete selected" />
                    <ShortcutRow keys={["Shift", "Click"]} label="Toggle select on click" />
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 font-medium text-primary">Sort & New</p>
                  <div className="space-y-1.5 text-muted-foreground">
                    <ShortcutRow keys={["s"]} label="Cycle sort mode" />
                    <ShortcutRow keys={["Alt", "1"]} label="Sort by Recent" />
                    <ShortcutRow keys={["Alt", "2"]} label="Sort by Newest" />
                    <ShortcutRow keys={["Alt", "3"]} label="Sort by Title (A–Z)" />
                    <ShortcutRow keys={["n"]} label="New chat" />
                    <ShortcutRow keys={[<Command className="h-3 w-3" />, "Shift", "N"]} label="New chat (global)" />
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 font-medium text-primary">Highlight History</p>
                  <div className="space-y-1.5 text-muted-foreground">
                    <ShortcutRow keys={["Alt", <CornerUpLeft className="h-3 w-3" />]} label="Jump back in history" />
                    <ShortcutRow keys={["Alt", <CornerUpRight className="h-3 w-3" />]} label="Jump forward in history" />
                  </div>
                  <p className="mt-2 leading-relaxed text-[11px] text-muted-foreground/70">
                    25-item ring buffer remembered across searches, sorts, page loads, and refreshes.
                  </p>
                </div>

                <div>
                  <p className="mb-1.5 font-medium text-primary">General</p>
                  <div className="space-y-1.5 text-muted-foreground">
                    <ShortcutRow keys={["?"]} label="Toggle this cheat sheet" />
                    <ShortcutRow keys={["Esc"]} label="Close / clear selection" />
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
