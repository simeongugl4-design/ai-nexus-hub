import { AI_MODELS } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ModelSelectorProps {
  selected: string;
  onChange: (model: string) => void;
}

export function ModelSelector({ selected, onChange }: ModelSelectorProps) {
  const current = AI_MODELS.find((m) => m.id === selected);

  return (
    <Select value={selected} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] border-border bg-muted text-sm">
        <SelectValue>
          <span className="flex items-center gap-2">
            <span>{current?.icon}</span>
            <span>{current?.name}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-popover border-border">
        {AI_MODELS.map((model) => (
          <SelectItem key={model.id} value={model.id} className="text-sm">
            <div className="flex items-center gap-2">
              <span>{model.icon}</span>
              <div>
                <div className="font-medium">{model.name}</div>
                <div className="text-xs text-muted-foreground">{model.description}</div>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
