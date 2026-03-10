import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Search, Trash2, MessageSquare } from "lucide-react";
import { TopNav } from "@/components/TopNav";

export default function HistoryPage() {
  const [history] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedModel, setSelectedModel] = useState("fast");

  return (
    <div className="flex h-screen flex-col">
      <TopNav selectedModel={selectedModel} onModelChange={setSelectedModel} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-heading font-bold gradient-text mb-1">History</h1>
          <p className="text-sm text-muted-foreground mb-6">Your past queries and conversations</p>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2 mb-6"><Search className="ml-2 h-4 w-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search history..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" /></div>
          {history.length === 0 && <div className="text-center py-16"><Clock className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">No history yet. Start using MegaKUMUL to see your queries here!</p></div>}
        </div>
      </div>
    </div>
  );
}
