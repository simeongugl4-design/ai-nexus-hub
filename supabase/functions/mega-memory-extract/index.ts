// Extracts durable memory facts from a chat exchange using Lovable AI.
// Returns: { memories: [{content, type, importance}] }
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM = `You are MEGAKUMUL Memory Extractor.

Given a user message and the assistant's reply, extract DURABLE facts worth remembering about the user across future conversations.

Extract ONLY:
- Stable personal facts (name, role, location, languages, expertise)
- Explicit preferences ("I prefer...", "always...", "never...", "I like...")
- Active projects or goals the user mentions
- Constraints or context that will matter in future chats

DO NOT extract:
- One-off questions or transient queries
- Information the assistant told the user
- Generic chit-chat
- Speculation

Return STRICT JSON only, no prose, no code fences:
{"memories":[{"content":"...","type":"preference|fact|project|goal|context","importance":1-5}]}

If nothing is worth saving, return: {"memories":[]}

Keep each "content" under 140 chars, written in third person ("User prefers...", "User is working on...").`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userText, assistantText, existing } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!userText || typeof userText !== "string") {
      return new Response(JSON.stringify({ memories: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const existingBlock = Array.isArray(existing) && existing.length
      ? `\n\nKnown memories (do NOT duplicate):\n${existing.slice(0, 30).map((e: string) => `- ${e}`).join("\n")}`
      : "";

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM + existingBlock },
        {
          role: "user",
          content: `USER MESSAGE:\n${userText}\n\nASSISTANT REPLY:\n${(assistantText ?? "").slice(0, 2000)}`,
        },
      ],
      response_format: { type: "json_object" },
    };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      console.error("memory-extract gateway err", resp.status, await resp.text());
      return new Response(JSON.stringify({ memories: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: { memories?: Array<{ content?: string; type?: string; importance?: number }> } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      // try to recover
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) try { parsed = JSON.parse(m[0]); } catch { /* noop */ }
    }

    const allowed = new Set(["preference", "fact", "project", "goal", "context"]);
    const memories = (parsed.memories ?? [])
      .filter((m) => m && typeof m.content === "string" && m.content.trim().length > 3)
      .map((m) => ({
        content: m.content!.trim().slice(0, 240),
        type: allowed.has(m.type ?? "") ? m.type : "context",
        importance: Math.max(1, Math.min(5, Number(m.importance) || 3)),
      }))
      .slice(0, 8);

    return new Response(JSON.stringify({ memories }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mega-memory-extract error", e);
    return new Response(JSON.stringify({ memories: [], error: String(e) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
