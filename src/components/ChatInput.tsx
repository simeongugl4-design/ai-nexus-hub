import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Paperclip, Sparkles, Code, Languages, FileSearch, X, Camera as CameraIcon, Image as ImageIcon, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { hapticTap, hapticSelection, takePhoto } from "@/lib/native";
import { toast } from "sonner";

interface ChatInputProps {
  onSend: (message: string, imageUrls?: string[]) => void;
  isLoading: boolean;
  prefill?: string;
  onPrefillUsed?: () => void;
  onStop?: () => void;
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

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string; isFinal?: boolean }>> }) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function ChatInput({ onSend, isLoading, prefill, onPrefillUsed, onStop }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recogRef = useRef<SpeechRecognitionLike | null>(null);
  const dictationBaseRef = useRef("");

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

  const addImage = (img: string) => {
    setAttachedImages((prev) => {
      if (prev.length >= MAX_IMAGES) {
        toast.error(`You can attach up to ${MAX_IMAGES} images`);
        return prev;
      }
      return [...prev, img];
    });
  };

  const removeImage = (idx: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if ((!trimmed && attachedImages.length === 0) || isLoading) return;
    hapticTap("medium");
    const text = trimmed || (attachedImages.length > 1 ? "Analyze these images in detail." : "Analyze this image in detail.");
    onSend(text, attachedImages.length ? attachedImages : undefined);
    setInput("");
    setAttachedImages([]);
  };

  const handleCamera = async () => {
    hapticSelection();
    if (attachedImages.length >= MAX_IMAGES) {
      toast.error(`You can attach up to ${MAX_IMAGES} images`);
      return;
    }
    const dataUrl = await takePhoto();
    if (dataUrl) {
      const compressed = await compressImage(dataUrl);
      addImage(compressed);
      toast.success("Image attached");
      textareaRef.current?.focus();
    }
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const remaining = MAX_IMAGES - attachedImages.length;
    if (remaining <= 0) {
      toast.error(`You can attach up to ${MAX_IMAGES} images`);
      return;
    }
    const slice = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.message(`Only first ${remaining} image(s) added (limit ${MAX_IMAGES})`);
    }
    for (const file of slice) {
      if (!file.type.startsWith("image/")) continue;
      const dataUrl = await fileToDataUrl(file);
      const compressed = await compressImage(dataUrl);
      addImage(compressed);
    }
    toast.success(`${slice.length} image(s) attached`);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleDictation = () => {
    hapticSelection();
    if (listening) {
      recogRef.current?.stop();
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice input isn't supported in this browser");
      return;
    }
    const recog = new SR();
    recog.lang = navigator.language || "en-US";
    recog.interimResults = true;
    recog.continuous = true;
    dictationBaseRef.current = input ? input.trimEnd() + " " : "";
    recog.onresult = (e) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i] as unknown as ArrayLike<{ transcript: string }> & { isFinal?: boolean };
        const alt = res[0];
        if (!alt) continue;
        if (res.isFinal) final += alt.transcript;
        else interim += alt.transcript;
      }
      const next = (dictationBaseRef.current + final + interim).replace(/\s+/g, " ").trimStart();
      setInput(next);
      if (final) dictationBaseRef.current += final;
    };
    recog.onerror = (ev) => {
      if (ev.error && ev.error !== "aborted") toast.error(`Mic error: ${ev.error}`);
    };
    recog.onend = () => {
      setListening(false);
      recogRef.current = null;
    };
    recogRef.current = recog;
    try {
      recog.start();
      setListening(true);
      toast.success("Listening… speak now");
    } catch {
      toast.error("Could not start microphone");
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
          {attachedImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mb-2 rounded-xl border border-primary/30 bg-primary/5 p-2"
            >
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <div className="font-medium text-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-primary" />
                  {attachedImages.length} image{attachedImages.length > 1 ? "s" : ""} attached ({MAX_IMAGES} max)
                </div>
                <button
                  onClick={() => setAttachedImages([])}
                  className="rounded-md px-2 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {attachedImages.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img} alt={`attachment ${i + 1}`} className="h-16 w-16 rounded-lg object-cover border border-border" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -right-1.5 -top-1.5 rounded-full bg-background border border-border p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity"
                      title="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
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
            placeholder={attachedImages.length ? "Ask about the image(s)…" : "Ask MegaKUMUL anything..."}
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

          <button
            onClick={toggleDictation}
            title={listening ? "Stop dictation" : "Voice dictation"}
            className={`relative shrink-0 rounded-lg p-2 transition-colors ${
              listening
                ? "bg-destructive/15 text-destructive hover:bg-destructive/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {listening && (
              <motion.span
                className="absolute inset-0 rounded-lg border border-destructive/60"
                animate={{ scale: [1, 1.25, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
            )}
          </button>

          {isLoading && onStop ? (
            <motion.button
              key="stop"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { hapticTap("medium"); onStop(); }}
              title="Stop generating"
              className="shrink-0 rounded-xl p-2 bg-destructive text-destructive-foreground hover:opacity-90 shadow-[0_0_20px_hsl(var(--destructive)/0.4)]"
            >
              <Square className="h-4 w-4 fill-current" />
            </motion.button>
          ) : (
            <motion.button
              key="send"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={(!input.trim() && attachedImages.length === 0) || isLoading}
              className="shrink-0 rounded-xl p-2 transition-all disabled:opacity-30 gradient-primary glow-primary hover:opacity-90"
            >
              <Send className="h-4 w-4 text-primary-foreground" />
            </motion.button>
          )}
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          MegaKUMUL may produce inaccurate information. Verify important facts.
        </p>
      </div>
    </div>
  );
}
