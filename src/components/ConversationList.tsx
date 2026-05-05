import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Plus, Trash2, Pencil, Check, X, Download, FileDown, Search } from "lucide-react";
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.title?.toLowerCase().includes(q));
  }, [conversations, query]);

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

  return (
    <div className={`flex h-full flex-col border-r border-border bg-card/50 w-64 ${className ?? ""}`}>
      <div className="flex items-center justify-between border-b border-border p-3">
        <h3 className="text-sm font-semibold text-foreground">Chats</h3>
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

      <div className="border-b border-border p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats…"
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
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        <AnimatePresence>
          {filtered.map((conv) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className={`group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                conv.id === activeId
                  ? "bg-primary/10 border border-primary/30 text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              onClick={() => onSelect(conv.id)}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />

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

        {conversations.length === 0 && (
          <p className="px-3 py-8 text-center text-xs text-muted-foreground">
            No conversations yet. Start chatting!
          </p>
        )}
      </div>
    </div>
  );
}
