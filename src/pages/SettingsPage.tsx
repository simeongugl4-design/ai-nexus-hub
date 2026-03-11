import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, User, Palette, Bell, Shield, Globe, Save, Check, Moon, Sun, Monitor } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { toast } from "sonner";

const SETTINGS_KEY = "megakumul-settings";

interface AppSettings {
  displayName: string;
  email: string;
  theme: "dark" | "light" | "system";
  language: string;
  notifications: { chat: boolean; research: boolean; updates: boolean };
  defaultModel: string;
  streamSpeed: "fast" | "normal" | "slow";
  fontSize: "small" | "medium" | "large";
}

const defaultSettings: AppSettings = {
  displayName: "MegaKUMUL User",
  email: "",
  theme: "dark",
  language: "English",
  notifications: { chat: true, research: true, updates: true },
  defaultModel: "creative",
  streamSpeed: "normal",
  fontSize: "medium",
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch { return defaultSettings; }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [selectedModel, setSelectedModel] = useState("fast");
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setSaved(true);
    toast.success("Settings saved!");
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "ai", label: "AI Config", icon: Settings },
    { id: "privacy", label: "Privacy", icon: Shield },
  ];

  return (
    <div className="flex h-screen flex-col">
      <TopNav selectedModel={selectedModel} onModelChange={setSelectedModel} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-heading font-bold gradient-text">Settings</h1>
              <p className="text-sm text-muted-foreground">Customize your MegaKUMUL experience</p>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSave} className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium gradient-primary text-primary-foreground">
              {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? "Saved!" : "Save"}
            </motion.button>
          </div>

          <div className="flex gap-2 mb-8 flex-wrap">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${activeTab === tab.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                <tab.icon className="h-4 w-4" /> {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "profile" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h3 className="font-heading font-semibold text-foreground">Profile Information</h3>
                <div><label className="block text-xs text-muted-foreground mb-1">Display Name</label><input value={settings.displayName} onChange={e => update("displayName", e.target.value)} className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50" /></div>
                <div><label className="block text-xs text-muted-foreground mb-1">Email</label><input value={settings.email} onChange={e => update("email", e.target.value)} placeholder="your@email.com" className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" /></div>
                <div><label className="block text-xs text-muted-foreground mb-1">Language</label>
                  <select value={settings.language} onChange={e => update("language", e.target.value)} className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-foreground focus:outline-none">
                    {["English", "Spanish", "French", "German", "Chinese", "Japanese", "Korean", "Arabic", "Hindi", "Portuguese"].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "appearance" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h3 className="font-heading font-semibold text-foreground">Theme</h3>
                <div className="grid grid-cols-3 gap-3">
                  {([["dark", Moon, "Dark"], ["light", Sun, "Light"], ["system", Monitor, "System"]] as const).map(([val, Icon, label]) => (
                    <button key={val} onClick={() => update("theme", val)} className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${settings.theme === val ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                      <Icon className="h-5 w-5" /><span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
                <h3 className="font-heading font-semibold text-foreground pt-2">Font Size</h3>
                <div className="grid grid-cols-3 gap-3">
                  {(["small", "medium", "large"] as const).map(size => (
                    <button key={size} onClick={() => update("fontSize", size)} className={`rounded-xl border p-3 text-sm font-medium capitalize transition-all ${settings.fontSize === size ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{size}</button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h3 className="font-heading font-semibold text-foreground">Notification Preferences</h3>
                {([["chat", "Chat Notifications", "Get notified when AI responses are ready"], ["research", "Research Updates", "Notifications for completed research"], ["updates", "Product Updates", "News about new features"]] as const).map(([key, title, desc]) => (
                  <div key={key} className="flex items-center justify-between rounded-xl border border-border p-4">
                    <div><p className="text-sm font-medium text-foreground">{title}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
                    <button onClick={() => update("notifications", { ...settings.notifications, [key]: !settings.notifications[key] })} className={`relative h-6 w-11 rounded-full transition-colors ${settings.notifications[key] ? "bg-primary" : "bg-muted"}`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${settings.notifications[key] ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "ai" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h3 className="font-heading font-semibold text-foreground">AI Configuration</h3>
                <div><label className="block text-xs text-muted-foreground mb-1">Default AI Model</label>
                  <select value={settings.defaultModel} onChange={e => update("defaultModel", e.target.value)} className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-foreground focus:outline-none">
                    <option value="fast">⚡ Fast AI</option><option value="research">🔬 Research AI</option><option value="creative">✨ Creative AI</option><option value="coding">💻 Coding AI</option><option value="expert">🧠 Expert AI</option>
                  </select>
                </div>
                <div><label className="block text-xs text-muted-foreground mb-1">Stream Speed</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["fast", "normal", "slow"] as const).map(speed => (
                      <button key={speed} onClick={() => update("streamSpeed", speed)} className={`rounded-xl border p-3 text-sm font-medium capitalize transition-all ${settings.streamSpeed === speed ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{speed}</button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "privacy" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h3 className="font-heading font-semibold text-foreground">Privacy & Data</h3>
                <div className="rounded-xl border border-border p-4"><p className="text-sm font-medium text-foreground mb-1">Clear Chat History</p><p className="text-xs text-muted-foreground mb-3">Remove all saved conversations and history</p><button onClick={() => { localStorage.removeItem("megakumul-history"); toast.success("History cleared!"); }} className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/20">Clear History</button></div>
                <div className="rounded-xl border border-border p-4"><p className="text-sm font-medium text-foreground mb-1">Clear Saved Responses</p><p className="text-xs text-muted-foreground mb-3">Remove all bookmarked responses</p><button onClick={() => { localStorage.removeItem("megakumul-saved"); toast.success("Saved responses cleared!"); }} className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/20">Clear Saved</button></div>
                <div className="rounded-xl border border-border p-4"><p className="text-sm font-medium text-foreground mb-1">Clear All Data</p><p className="text-xs text-muted-foreground mb-3">Reset everything to defaults</p><button onClick={() => { localStorage.clear(); toast.success("All data cleared! Refreshing..."); setTimeout(() => window.location.reload(), 1000); }} className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/20">Clear All Data</button></div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
