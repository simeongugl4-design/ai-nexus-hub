import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Search, Trash2, Tag, GraduationCap, X } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { useNavigate } from "react-router-dom";

type KBEntry = { id: string; title: string; type: "course" | "topic" | "custom"; tags: string[]; createdAt: Date; };
const STORAGE_KEY = "megakumul-knowledge-base";
function loadEntries(): KBEntry[] { try { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return []; return JSON.parse(raw).map((e: any) => ({ ...e, createdAt: new Date(e.createdAt) })); } catch { return []; } }
function saveEntries(entries: KBEntry[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }

export default function KnowledgeBasePage() {
  const [entries, setEntries] = useState<KBEntry[]>(loadEntries);
  const [search, setSearch] = useState(""); const [showAdd, setShowAdd] = useState(false); const [newTitle, setNewTitle] = useState(""); const [newType, setNewType] = useState<"course"|"topic"|"custom">("course"); const [newTags, setNewTags] = useState(""); const [selectedModel, setSelectedModel] = useState("expert"); const navigate = useNavigate();
  useEffect(() => { saveEntries(entries); }, [entries]);
  const addEntry = () => { if (!newTitle.trim()) return; setEntries(prev => [{ id: crypto.randomUUID(), title: newTitle.trim(), type: newType, tags: newTags.split(",").map(t => t.trim()).filter(Boolean), createdAt: new Date() }, ...prev]); setNewTitle(""); setNewTags(""); setShowAdd(false); };
  const deleteEntry = (id: string) => setEntries(prev => prev.filter(e => e.id !== id));
  const filtered = entries.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.tags.some(t => t.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="flex h-screen flex-col">
      <TopNav selectedModel={selectedModel} onModelChange={setSelectedModel} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div><h1 className="text-2xl font-heading font-bold gradient-text">Knowledge Base</h1><p className="text-sm text-muted-foreground">Add courses & topics to study with AI</p></div>
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium gradient-primary text-primary-foreground"><Plus className="h-4 w-4" /> Add</motion.button>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2 mb-6"><Search className="ml-2 h-4 w-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />{search && <button onClick={() => setSearch("")} className="p-1 text-muted-foreground"><X className="h-3.5 w-3.5" /></button>}</div>
          <AnimatePresence>{showAdd && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden"><div className="rounded-2xl border border-primary/30 bg-card p-4 space-y-3"><input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Course name or topic..." className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" autoFocus onKeyDown={e => { if (e.key === "Enter") addEntry(); }} /><div className="flex gap-2">{(["course","topic","custom"] as const).map(t => <button key={t} onClick={() => setNewType(t)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize ${newType === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{t}</button>)}</div><input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="Tags (comma-separated)" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" /><div className="flex gap-2 justify-end"><button onClick={() => setShowAdd(false)} className="px-4 py-2 text-xs rounded-lg border border-border text-muted-foreground">Cancel</button><button onClick={addEntry} disabled={!newTitle.trim()} className="px-4 py-2 text-xs rounded-lg gradient-primary text-primary-foreground disabled:opacity-30">Save</button></div></div></motion.div>}</AnimatePresence>
          {filtered.length === 0 ? <div className="text-center py-16"><GraduationCap className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">{entries.length === 0 ? "No entries yet." : "No matches."}</p></div> : <div className="space-y-3"><AnimatePresence>{filtered.map((entry, i) => <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-border bg-card p-4 group"><div className="flex items-start justify-between mb-2"><div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary shrink-0" /><h3 className="font-heading font-semibold text-foreground">{entry.title}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${entry.type === "course" ? "bg-primary/10 text-primary" : entry.type === "topic" ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"}`}>{entry.type}</span></div><button onClick={() => deleteEntry(entry.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-4 w-4" /></button></div><div className="flex items-center gap-2 flex-wrap mb-3">{entry.tags.map(tag => <span key={tag} className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary"><Tag className="h-2.5 w-2.5" /> {tag}</span>)}<span className="text-[10px] text-muted-foreground ml-auto">{entry.createdAt.toLocaleDateString()}</span></div><button onClick={() => navigate(`/research?q=${encodeURIComponent(entry.title)}`)} className="flex items-center gap-2 rounded-lg border border-secondary/30 bg-secondary/5 px-3 py-1.5 text-xs font-medium text-secondary hover:bg-secondary/10"><Search className="h-3 w-3" /> Research with AI</button></motion.div>)}</AnimatePresence></div>}
        </div>
      </div>
    </div>
  );
}
