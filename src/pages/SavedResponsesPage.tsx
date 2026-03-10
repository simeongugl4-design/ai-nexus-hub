import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Trash2, Search, Copy, Check } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type SavedResponse = { id: string; title: string; content: string; source: string; savedAt: Date; };

export default function SavedResponsesPage() {
  const [responses] = useState<SavedResponse[]>([]);
  const [search, setSearch] = useState("");
  const [selectedModel, setSelectedModel] = useState("fast");
  const filtered = responses.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-screen flex-col">
      <TopNav selectedModel={selectedModel} onModelChange={setSelectedModel} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-heading font-bold gradient-text mb-1">Saved Responses</h1>
          <p className="text-sm text-muted-foreground mb-6">Your bookmarked AI responses</p>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2 mb-6"><Search className="ml-2 h-4 w-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" /></div>
          {filtered.length === 0 && <div className="text-center py-16"><Star className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">No saved responses yet. Star responses from chat to save them here!</p></div>}
        </div>
      </div>
    </div>
  );
}
