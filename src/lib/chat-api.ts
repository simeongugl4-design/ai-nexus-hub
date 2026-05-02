import { Message } from "./types";

type OutMsg =
  | { role: "user" | "assistant"; content: string }
  | {
      role: "user";
      content: Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
    };

export async function streamChat({
  messages,
  model,
  onDelta,
  onDone,
  onError,
}: {
  messages: (Pick<Message, "role" | "content"> & { imageUrl?: string; imageUrls?: string[] })[];
  model: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const CHAT_URL = `${supabaseUrl}/functions/v1/mega-chat`;

  // Convert messages: if a user message has image(s), send multimodal content array
  const outMessages: OutMsg[] = messages.map((m) => {
    const imgs = m.imageUrls && m.imageUrls.length
      ? m.imageUrls
      : m.imageUrl
      ? [m.imageUrl]
      : [];
    if (m.role === "user" && imgs.length) {
      return {
        role: "user",
        content: [
          { type: "text", text: m.content || (imgs.length > 1 ? "Analyze these images." : "Analyze this image.") },
          ...imgs.map((url) => ({ type: "image_url" as const, image_url: { url } })),
        ],
      };
    }
    return { role: m.role, content: m.content };
  });

  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ messages: outMessages, model }),
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
