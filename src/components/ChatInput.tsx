import { useState, useRef, useEffect } from "react";
import { Send, Mic, Paperclip, Sparkles, Code, Languages, FileSearch, X, Camera as CameraIcon, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { hapticTap, hapticSelection, takePhoto } from "@/lib/native";
import { toast } from "sonner";

interface ChatInputProps {
  onSend: (message: string, imageUrls?: string[]) => void;
  isLoading: boolean;
  prefill?: string;
  onPrefillUsed?: () => void;
}

const MAX_IMAGES = 6;

const quickActions = [
  { icon: Sparkles, label: "Summarize", prefix: "Summarize: " },
  { icon: Code, label: "Generate Code", prefix: "Write code for: " },
  { icon: Languages, label: "Translate", prefix: "Translate to English: " },
  { icon: FileSearch, label: "Deep Research", prefix: "Research in depth: " },
];

const MAX_DIM = 1280;
const JPEG_QUALITY = 0.82;

async function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function ChatInput({ onSend, isLoading, prefill, onPrefillUsed }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if ((!trimmed && !attachedImage) || isLoading) return;
    hapticTap("medium");
    onSend(trimmed || "Analyze this image in detail.", attachedImage ?? undefined);
    setInput("");
    setAttachedImage(null);
  };

  const handleCamera = async () => {
    hapticSelection();
    const dataUrl = await takePhoto();
    if (dataUrl) {
      const compressed = await compressImage(dataUrl);
      setAttachedImage(compressed);
      toast.success("Image attached — describe what you'd like to know");
      textareaRef.current?.focus();
    }
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are supported here");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    const compressed = await compressImage(dataUrl);
    setAttachedImage(compressed);
    toast.success("Image attached");
    textareaRef.current?.focus();
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

        <AnimatePresence>
          {attachedImage && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mb-2 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-2"
            >
              <img src={attachedImage} alt="attachment preview" className="h-16 w-16 rounded-lg object-cover" />
              <div className="flex-1 text-xs text-muted-foreground">
                <div className="font-medium text-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-primary" /> Image attached
                </div>
                <div>Will be sent to the AI for visual analysis.</div>
              </div>
              <button
                onClick={() => setAttachedImage(null)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFilePick}
        />

        <div className="flex items-end gap-2 rounded-2xl border border-border bg-input p-2 transition-colors focus-within:border-primary/50 focus-within:glow-primary">
          <button onClick={handleCamera} title="Take photo" className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <CameraIcon className="h-4 w-4" />
          </button>
          <button onClick={() => fileInputRef.current?.click()} title="Attach image" className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Paperclip className="h-4 w-4" />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={attachedImage ? "Ask about the image…" : "Ask MegaKUMUL anything..."}
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
            disabled={(!input.trim() && !attachedImage) || isLoading}
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
