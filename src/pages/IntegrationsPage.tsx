import { useState } from "react";
import { motion } from "framer-motion";
import { Puzzle, Check, Search } from "lucide-react";
import { TopNav } from "@/components/TopNav";

type Integration = { id: string; name: string; description: string; category: string; connected: boolean; icon: string; };
const integrations: Integration[] = [
  { id: "github", name: "GitHub", description: "Connect your repos for code analysis", category: "Development", connected: false, icon: "🐙" },
  { id: "slack", name: "Slack", description: "Send AI responses to Slack channels", category: "Communication", connected: false, icon: "💬" },
  { id: "notion", name: "Notion", description: "Sync knowledge base with Notion pages", category: "Productivity", connected: false, icon: "📝" },
  { id: "gdrive", name: "Google Drive", description: "Analyze documents from Google Drive", category: "Storage", connected: false, icon: "📁" },
  { id: "jira", name: "Jira", description: "Create tasks from AI suggestions", category: "Project Management", connected: false, icon: "📋" },
  { id: "zapier", name: "Zapier", description: "Automate workflows with AI triggers", category: "Automation", connected: false, icon: "⚡" },
];

export default function IntegrationsPage() {
  const [items, setItems] = useState(integrations);
  const [search, setSearch] = useState("");
  const [selectedModel, setSelectedModel] = useState("fast");
  const toggleConnect = (id: string) => setItems(prev => prev.map(item => item.id === id ? { ...item, connected: !item.connected } : item));
  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()));
  const categories = [...new Set(filtered.map(i => i.category))];

  return (
    <div className="flex h-screen flex-col">
      <TopNav selectedModel={selectedModel} onModelChange={setSelectedModel} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-heading font-bold gradient-text mb-1">Integrations</h1>
          <p className="text-sm text-muted-foreground mb-6">Connect MegaKUMUL with your favorite tools</p>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2 mb-6"><Search className="ml-2 h-4 w-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search integrations..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" /></div>
          {categories.map(category => <div key={category} className="mb-8"><h2 className="text-sm font-heading font-semibold text-muted-foreground mb-3">{category}</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{filtered.filter(i => i.category === category).map((integration, idx) => <motion.div key={integration.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className={`rounded-xl border p-4 transition-all ${integration.connected ? "border-primary/40 bg-primary/5" : "border-border bg-card hover:border-primary/20"}`}><div className="flex items-start gap-3 mb-2"><span className="text-2xl">{integration.icon}</span><div><h3 className="font-heading font-semibold text-foreground text-sm">{integration.name}</h3><p className="text-xs text-muted-foreground">{integration.description}</p></div></div><div className="flex justify-end mt-3"><motion.button whileHover={{ scale: 1.05 }} onClick={() => toggleConnect(integration.id)} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${integration.connected ? "bg-primary/10 text-primary border border-primary/30" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{integration.connected ? <><Check className="h-3 w-3" /> Connected</> : "Connect"}</motion.button></div></motion.div>)}</div></div>)}
        </div>
      </div>
    </div>
  );
}
