/**
 * Generic SSE stream reader for edge functions.
 * Uses demo mode with simulated responses when no backend is configured.
 */

const DEMO_RESPONSES: Record<string, string[]> = {
  default: [
    "# AI Response\n\nI'm MegaKUMUL, your AI research & intelligence platform. ",
    "Here's a comprehensive analysis of your query:\n\n",
    "## Key Points\n\n",
    "1. **Advanced Analysis**: I can provide in-depth research and analysis on any topic.\n",
    "2. **Code Generation**: I can generate, debug, and explain code in multiple languages.\n",
    "3. **Math Solutions**: Step-by-step mathematical solutions with LaTeX rendering.\n\n",
    "## Summary\n\n",
    "This platform combines conversational AI, real-time research, code generation, and document intelligence ",
    "into a single powerful interface. Feel free to explore the different tools available in the sidebar!\n\n",
    "> **Note**: Connect a backend AI service to get real responses. Currently running in demo mode.",
  ],
};

function getDemoResponse(): string[] {
  return DEMO_RESPONSES.default;
}

export async function readSSEStream({
  url,
  body,
  onDelta,
  onDone,
  onError,
}: {
  url: string;
  body: Record<string, unknown>;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  // Check if we have a real backend URL
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'undefined') {
    // Demo mode - simulate streaming
    const chunks = getDemoResponse();
    for (const chunk of chunks) {
      await new Promise(r => setTimeout(r, 100 + Math.random() * 200));
      onDelta(chunk);
    }
    onDone();
    return;
  }

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(body),
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
