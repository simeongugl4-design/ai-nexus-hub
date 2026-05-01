import { useState, useRef, useEffect } from "react";
import { Send, Mic, Paperclip, Sparkles, Code, Languages, FileSearch, X, Camera as CameraIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { hapticTap, hapticSelection, takePhoto } from "@/lib/native";
import { toast } from "sonner";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  prefill?: string;
  onPrefillUsed?: () => void;
}

const quickActions = [
  { icon: Sparkles, label: "Summarize", prefix: "Summarize: " },
  { icon: Code, label: "Generate Code", prefix: "Write code for: " },
  { icon: Languages, label: "Translate", prefix: "Translate to English: " },
  { icon: FileSearch, label: "Deep Research", prefix: "Research in depth: " },
];

export function ChatInput({ onSend, isLoading, prefill, onPrefillUsed }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (prefill) {
      setInput(prefill);
      onPrefillUsed?.();
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [prefill, onPrefillUsed]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    hapticTap("medium");
    onSend(trimmed);
    setInput("");
  };

  const handleCamera = async () => {
    hapticSelection();
    const dataUrl = await takePhoto();
    if (dataUrl) {
      toast.success("Image captured — describe what you'd like to know");
      setInput((p) => (p ? p + "\n\n[image attached]" : "Analyze this image: "));
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-card p-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-3 flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setInput(action.prefix);
                textareaRef.current?.focus();
              }}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:border-primary/50 hover:text-foreground hover:bg-surface-elevated"
            >
              <action.icon className="h-3.5 w-3.5 text-primary" />
              {action.label}
            </motion.button>
          ))}
        </div>

        <div className="flex items-end gap-2 rounded-2xl border border-border bg-input p-2 transition-colors focus-within:border-primary/50 focus-within:glow-primary">
          <button onClick={handleCamera} title="Take photo" className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <CameraIcon className="h-4 w-4" />
          </button>
          <button className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Paperclip className="h-4 w-4" />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask MegaKUMUL anything..."
            rows={1}
            className="max-h-[200px] min-h-[24px] flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />

          <AnimatePresence>
            {input.trim() && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setInput("")}
                className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>

          <button className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Mic className="h-4 w-4" />
          </button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="shrink-0 rounded-xl p-2 transition-all disabled:opacity-30 gradient-primary glow-primary hover:opacity-90"
          >
            <Send className="h-4 w-4 text-primary-foreground" />
          </motion.button>
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          MegaKUMUL may produce inaccurate information. Verify important facts.
        </p>
      </div>
    </div>
  );
}
