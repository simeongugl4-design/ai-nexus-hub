export type ResearchSource = {
  id: number;
  title: string;
  url: string;
  description: string;
  domain: string;
};

export type ResearchResult = {
  content: string;
  sources: ResearchSource[];
  isComplete: boolean;
};

export function parseResearchResponse(raw: string): ResearchResult {
  const sourceSeparator = "---SOURCES---";
  const separatorIndex = raw.indexOf(sourceSeparator);

  if (separatorIndex === -1) {
    return { content: raw, sources: [], isComplete: false };
  }

  const content = raw.slice(0, separatorIndex).trim();
  const sourcesRaw = raw.slice(separatorIndex + sourceSeparator.length).trim();
  const sources: ResearchSource[] = [];

  const lines = sourcesRaw.split("\n").filter((l) => l.trim());
  for (const line of lines) {
    const match = line.match(/^\[(\d+)\]\s*(.+?)\s*\|\s*(https?:\/\/[^\s|]+)\s*\|\s*(.+)$/);
    if (match) {
      const url = match[3].trim();
      let domain = "";
      try {
        domain = new URL(url).hostname.replace("www.", "");
      } catch {
        domain = url;
      }
      sources.push({
        id: parseInt(match[1]),
        title: match[2].trim(),
        url,
        description: match[4].trim(),
        domain,
      });
    }
  }

  return { content, sources, isComplete: true };
}

export async function streamResearch({
  query,
  model,
  onDelta,
  onDone,
  onError,
}: {
  query: string;
  model?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const RESEARCH_URL = `${supabaseUrl}/functions/v1/mega-research`;

  try {
    const resp = await fetch(RESEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ query, model }),
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
