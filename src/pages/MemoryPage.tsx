import { useEffect, useMemo, useState } from "react";
import {
  Brain, Pin, PinOff, Trash2, Plus, Download, Upload, Search, Sparkles, X, Edit3, Save,
} from "lucide-react";
import {
  Memory, MemoryType, listMemories, addMemory, updateMemory, deleteMemory,
  clearAllMemories, exportMemories, importMemories, memoryCount,
} from "@/lib/memory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const TYPES: { value: MemoryType; label: string; color: string }[] = [
  { value: "preference", label: "Preference", color: "bg-primary/20 text-primary border-primary/40" },
  { value: "fact",       label: "Fact",       color: "bg-secondary/20 text-secondary border-secondary/40" },
  { value: "goal",       label: "Goal",       color: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  { value: "project",    label: "Project",    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  { value: "context",    label: "Context",    color: "bg-slate-500/20 text-slate-300 border-slate-500/40" },
];

function typeStyle(t: MemoryType) {
  return TYPES.find((x) => x.value === t)?.color ?? "bg-muted text-foreground border-border";
}

export default function MemoryPage() {
  const [, setTick] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | MemoryType>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    content: "",
    type: "preference" as MemoryType,
    importance: 3,
  });

  useEffect(() => {
    const refresh = () => setTick((n) => n + 1);
    window.addEventListener("megakumul:memory-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("megakumul:memory-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const all = listMemories();
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return all.filter((m) => {
      if (filter !== "all" && m.type !== filter) return false;
      if (q && !m.content.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [all, query, filter]);

  const stats = useMemo(() => {
    const s: Record<string, number> = { total: all.length, pinned: 0 };
    TYPES.forEach((t) => (s[t.value] = 0));
    all.forEach((m) => {
      if (m.pinned) s.pinned++;
      s[m.type] = (s[m.type] ?? 0) + 1;
    });
    return s;
  }, [all]);

  function handleSave() {
    if (!draft.content.trim()) return;
    if (editingId) {
      updateMemory(editingId, {
        content: draft.content.trim(),
        type: draft.type,
        importance: draft.importance,
      });
      toast({ title: "Memory updated" });
    } else {
      addMemory({
        content: draft.content.trim(),
        type: draft.type,
        importance: draft.importance,
        pinned: false,
        source: "manual",
      });
      toast({ title: "Memory saved" });
    }
    setShowAdd(false);
    setEditingId(null);
    setDraft({ content: "", type: "preference", importance: 3 });
  }

  function handleEdit(m: Memory) {
    setEditingId(m.id);
    setDraft({ content: m.content, type: m.type, importance: m.importance });
    setShowAdd(true);
  }

  function handleExport() {
    const blob = new Blob([exportMemories()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `megakumul-memory-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      const n = importMemories(text);
      toast({ title: `Imported ${n} memories` });
    };
    input.click();
  }

  return (
    <div className="h-screen overflow-y-auto px-4 md:px-8 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Memory Vault</h1>
            <p className="text-xs text-muted-foreground">
              {memoryCount()} memories — auto-learned & manually curated. Injected into every chat.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-1" /> Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={all.length === 0}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button size="sm" onClick={() => { setShowAdd(true); setEditingId(null); setDraft({ content: "", type: "preference", importance: 3 }); }}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6">
        <StatCard label="Total" value={stats.total} active={filter === "all"} onClick={() => setFilter("all")} />
        {TYPES.map((t) => (
          <StatCard key={t.value} label={t.label} value={stats[t.value] ?? 0} active={filter === t.value} onClick={() => setFilter(t.value)} />
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search memory vault..."
          className="pl-9 bg-card/40 backdrop-blur border-border/50"
        />
      </div>

      {/* Add / Edit modal */}
      {showAdd && (
        <div className="mb-4 rounded-xl border border-primary/30 bg-card/60 backdrop-blur p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {editingId ? "Edit memory" : "New memory"}
            </div>
            <Button variant="ghost" size="icon" onClick={() => { setShowAdd(false); setEditingId(null); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            value={draft.content}
            onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
            placeholder="e.g. User prefers concise answers with code examples in TypeScript."
            rows={3}
            className="bg-background/40"
          />
          <div className="grid grid-cols-2 gap-2">
            <Select value={draft.type} onValueChange={(v) => setDraft((d) => ({ ...d, type: v as MemoryType }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(draft.importance)} onValueChange={(v) => setDraft((d) => ({ ...d, importance: Number(v) }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>Importance {n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-1" /> {editingId ? "Update" : "Save"}
          </Button>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-border/50 bg-card/20">
          <Brain className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">
            {all.length === 0
              ? "No memories yet. Chat with MegaKUMUL — it learns automatically."
              : "No memories match your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="group rounded-xl border border-border/50 bg-card/40 backdrop-blur p-4 flex items-start gap-3 hover:border-primary/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="outline" className={typeStyle(m.type)}>
                    {m.type}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {"★".repeat(m.importance)}{"☆".repeat(5 - m.importance)}
                  </span>
                  {m.source === "auto" && (
                    <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/30">
                      auto
                    </Badge>
                  )}
                  {m.pinned && (
                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 border-amber-500/30 text-amber-300">
                      pinned
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {new Date(m.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{m.content}</p>
              </div>
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost" size="icon" className="h-7 w-7"
                  onClick={() => updateMemory(m.id, { pinned: !m.pinned })}
                  title={m.pinned ? "Unpin" : "Pin"}
                >
                  {m.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(m)} title="Edit">
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => { deleteMemory(m.id); toast({ title: "Memory deleted" }); }}
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {all.length > 0 && (
        <div className="mt-8 pt-4 border-t border-border/30 flex justify-end">
          <Button
            variant="ghost" size="sm" className="text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm("Delete ALL memories? This cannot be undone.")) {
                clearAllMemories();
                toast({ title: "Memory vault cleared" });
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label, value, active, onClick,
}: { label: string; value: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition-colors backdrop-blur ${
        active
          ? "border-primary/60 bg-primary/15"
          : "border-border/40 bg-card/30 hover:border-primary/30"
      }`}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-0.5">{value}</div>
    </button>
  );
}
