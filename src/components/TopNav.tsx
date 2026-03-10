import { Bell, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModelSelector } from "@/components/ModelSelector";

interface TopNavProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function TopNav({ selectedModel, onModelChange }: TopNavProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      </div>

      <div className="flex items-center gap-3">
        <ModelSelector selected={selectedModel} onChange={onModelChange} />
        <button className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary">
          <User className="h-4 w-4 text-primary-foreground" />
        </button>
      </div>
    </header>
  );
}
