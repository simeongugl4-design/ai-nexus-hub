import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { AISession } from "@/lib/ai-sessions";
import { formatDistanceToNow } from "date-fns";

interface SessionListProps {
  sessions: AISession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  title: string;
  icon: React.ReactNode;
}

export function SessionList({
  sessions,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  title,
  icon,
}: SessionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const startEdit = (id: string, t: string) => {
    setEditingId(id);
    setEditTitle(t);
  };

  const confirmEdit = () => {
    if (editingId && editTitle.trim()) onRename(editingId, editTitle.trim());
    setEditingId(null);
  };

  return (
    <div className="flex h-full flex-col border-r border-border bg-card/50 w-56 shrink-0">
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-1.5">
          {icon}
          <h3 className="text-xs font-semibold text-foreground">{title}</h3>
        </div>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onNew} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="New Session">
          <Plus className="h-3.5 w-3.5" />
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-1.5 space-y-0.5">
        <AnimatePresence>
          {sessions.map((s) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className={`group flex items-center gap-1.5 rounded-lg px-2.5 py-2 cursor-pointer transition-colors ${
                s.id === activeId ? "bg-primary/10 border border-primary/30 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              onClick={() => onSelect(s.id)}
            >
              {editingId === s.id ? (
                <div className="flex flex-1 items-center gap-1">
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmEdit()} className="flex-1 bg-transparent text-xs outline-none border-b border-primary" autoFocus onClick={(e) => e.stopPropagation()} />
                  <button onClick={(e) => { e.stopPropagation(); confirmEdit(); }}><Check className="h-3 w-3 text-primary" /></button>
                  <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }}><X className="h-3 w-3 text-muted-foreground" /></button>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate">{s.title}</p>
                    <p className="text-[9px] text-muted-foreground">{formatDistanceToNow(new Date(s.updated_at), { addSuffix: true })}</p>
                  </div>
                  <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); startEdit(s.id, s.title); }} className="rounded p-0.5 hover:bg-muted"><Pencil className="h-2.5 w-2.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(s.id); }} className="rounded p-0.5 hover:bg-destructive/20 text-destructive"><Trash2 className="h-2.5 w-2.5" /></button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {sessions.length === 0 && (
          <p className="px-2 py-6 text-center text-[10px] text-muted-foreground">No sessions yet</p>
        )}
      </div>
    </div>
  );
}
