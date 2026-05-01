import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Message } from "@/lib/types";
import { ArrowRight, Search, Lightbulb, Code, ListChecks, RefreshCw, Copy, Check, Star } from "lucide-react";
import { preprocessLatex } from "@/lib/latex-utils";
import { saveResponse } from "@/pages/SavedResponsesPage";
import { toast } from "sonner";
import megakumulLogo from "@/assets/megakumul-logo.png";
import { FollowUpOptions } from "@/components/FollowUpOptions";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  onSend?: (message: string) => void;
}

const followUpActions = [
  { label: "Continue Answering", icon: ArrowRight, prefix: "Continue and expand on your previous answer with more details: ", color: "text-primary border-primary/30 hover:bg-primary/10" },
  { label: "Research Deeper", icon: Search, prefix: "Research this topic more deeply with specific facts, data, and sources: ", color: "text-secondary border-secondary/30 hover:bg-secondary/10" },
  { label: "Explain Simply", icon: Lightbulb, prefix: "Explain the above in simpler terms that anyone can understand: ", color: "text-[hsl(45,90%,55%)] border-[hsl(45,90%,55%)]/30 hover:bg-[hsl(45,90%,55%)]/10" },
  { label: "Generate Code", icon: Code, prefix: "Generate working code related to the above topic: ", color: "text-[hsl(150,80%,50%)] border-[hsl(150,80%,50%)]/30 hover:bg-[hsl(150,80%,50%)]/10" },
  { label: "Summarize", icon: ListChecks, prefix: "Provide a concise bullet-point summary of your previous response: ", color: "text-[hsl(30,90%,55%)] border-[hsl(30,90%,55%)]/30 hover:bg-[hsl(30,90%,55%)]/10" },
  { label: "Regenerate", icon: RefreshCw, prefix: "Please provide a different, improved response to the previous question: ", color: "text-muted-foreground border-border hover:bg-muted" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Copy response">
      {copied ? <Check className="h-3.5 w-3.5 text-[hsl(150,80%,50%)]" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function SaveButton({ content }: { content: string }) {
  const [saved, setSaved] = useState(false);
  const handleSave = () => {
    saveResponse({ title: content.slice(0, 80), content, source: "chat" });
    setSaved(true);
    toast.success("Response saved!");
    setTimeout(() => setSaved(false), 3000);
  };
  return (
    <button onClick={handleSave} className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Save response">
      <Star className={`h-3.5 w-3.5 ${saved ? "text-[hsl(45,90%,55%)] fill-[hsl(45,90%,55%)]" : ""}`} />
    </button>
  );
}

export function ChatMessages({ messages, isLoading, onSend }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const suggestedPrompts = [
    "Explain quantum computing in simple terms",
    "Write a Python web scraper",
    "Compare React vs Vue vs Svelte",
    "Summarize the latest AI research trends",
  ];

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-8">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <img src={megakumulLogo} alt="MegaKUMUL" className="h-20 w-20 rounded-2xl object-cover shadow-[0_0_30px_hsl(195,100%,50%,0.3)]" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center">
          <h2 className="mb-2 text-2xl font-heading font-bold gradient-text">Welcome to MegaKUMUL</h2>
          <p className="max-w-md text-muted-foreground">Your AI research & intelligence platform. Ask anything, research deeply, generate code, and more.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="w-full max-w-2xl">
          <p className="mb-3 text-center text-sm font-medium text-muted-foreground">Try one of these prompts:</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {suggestedPrompts.map((prompt, i) => (
              <motion.button key={prompt} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => onSend?.(prompt)} className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left text-sm text-muted-foreground transition-all hover:border-primary/50 hover:bg-surface-elevated hover:text-foreground hover:glow-primary">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                <span>{prompt}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  const lastMessage = messages[messages.length - 1];
  const showFollowUps = !isLoading && lastMessage?.role === "assistant";

  return (
    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
      <div className="mx-auto max-w-3xl space-y-6">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-[85%] gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {msg.role === "assistant" && (
                  <img src={megakumulLogo} alt="AI" className="h-8 w-8 shrink-0 rounded-lg object-cover shadow-[0_0_10px_hsl(195,100%,50%,0.2)]" />
                )}
                <div className="flex flex-col gap-1">
                  <div className={`rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
                    {msg.role === "user" && msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="attachment"
                        className="mb-2 max-h-64 w-full rounded-lg object-cover border border-primary-foreground/20"
                      />
                    )}
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none prose-headings:font-heading prose-code:text-primary prose-pre:bg-muted prose-pre:border prose-pre:border-border">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {preprocessLatex(msg.content)}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === "assistant" && !isLoading && (
                    <div className="flex items-center gap-1 px-1">
                      <CopyButton text={msg.content} />
                      <SaveButton content={msg.content} />
                      {msg.model && <span className="text-[10px] text-muted-foreground ml-1">{msg.model}</span>}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <img src={megakumulLogo} alt="AI" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
            <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-primary typing-dot" />
              <span className="h-2 w-2 rounded-full bg-primary typing-dot" />
              <span className="h-2 w-2 rounded-full bg-primary typing-dot" />
            </div>
          </motion.div>
        )}

        {showFollowUps && (
          <FollowUpOptions type="chat" onSelect={(prefix) => onSend?.(prefix)} />
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
