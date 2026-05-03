import type { Message } from "./types";
import { toast } from "sonner";

function formatTimestamp(d: Date | string) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
}

export function conversationToMarkdown(title: string, messages: Message[]): string {
  const lines: string[] = [];
  lines.push(`# ${title || "Conversation"}`);
  lines.push("");
  lines.push(`_Exported from MegaKUMUL on ${new Date().toLocaleString()}_`);
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const m of messages) {
    const who = m.role === "user" ? "🧑 **You**" : "🤖 **MegaKUMUL**";
    lines.push(`## ${who} — ${formatTimestamp(m.timestamp)}${m.model ? ` _(model: ${m.model})_` : ""}`);
    lines.push("");

    const imgs = m.imageUrls ?? (m.imageUrl ? [m.imageUrl] : []);
    if (imgs.length) {
      lines.push(`_${imgs.length} image attachment(s)_`);
      lines.push("");
    }

    if (m.content?.trim()) {
      lines.push(m.content.trim());
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

export function downloadMarkdown(filename: string, markdown: string) {
  try {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Conversation exported");
  } catch {
    toast.error("Export failed");
  }
}

export function safeFilename(s: string): string {
  return (s || "conversation")
    .replace(/[^\w\s-]+/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60) || "conversation";
}
