import { Message } from "./types";

const DEMO_CHAT_RESPONSES = [
  "# Hello! I'm MegaKUMUL AI 👋\n\n",
  "I'm your intelligent research & productivity assistant. ",
  "Here's what I can help you with:\n\n",
  "## 🔬 Capabilities\n\n",
  "- **Conversational AI** — Ask me anything and get thoughtful responses\n",
  "- **Deep Research** — I can analyze topics with citations and sources\n",
  "- **Code Generation** — Write, debug, and explain code in any language\n",
  "- **Math Solving** — Step-by-step solutions with LaTeX rendering\n",
  "- **Document Intelligence** — Upload and analyze documents\n\n",
  "## 💡 Try asking me:\n\n",
  "- *\"Explain quantum computing in simple terms\"*\n",
  "- *\"Write a Python web scraper\"*\n",
  "- *\"Compare React vs Vue vs Svelte\"*\n\n",
  "> **Demo Mode**: Connect a backend to get real AI responses.",
];

export async function streamChat({
  messages,
  model,
  onDelta,
  onDone,
  onError,
}: {
  messages: Pick<Message, "role" | "content">[];
  model: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'undefined') {
    // Demo mode
    for (const chunk of DEMO_CHAT_RESPONSES) {
      await new Promise(r => setTimeout(r, 80 + Math.random() * 150));
      onDelta(chunk);
    }
    onDone();
    return;
  }

  const CHAT_URL = `${supabaseUrl}/functions/v1/mega-chat`;

  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        model,
      }),
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({ error: "Request failed" }));
      onError(data.error || `Error: ${resp.status}`);
      return;
    }

    if (!resp.body) {
      onError("No response body");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }

    onDone();
  } catch (e) {
    onError(e instanceof Error ? e.message : "Connection failed");
  }
}
