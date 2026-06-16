import type { MemoryType } from "./memory";

export type ExtractedMemory = {
  content: string;
  type: MemoryType;
  importance: number;
};

export async function extractMemories(
  userText: string,
  assistantText: string,
  existing: string[]
): Promise<ExtractedMemory[]> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const resp = await fetch(`${supabaseUrl}/functions/v1/mega-memory-extract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ userText, assistantText, existing }),
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return Array.isArray(data.memories) ? data.memories : [];
  } catch {
    return [];
  }
}
