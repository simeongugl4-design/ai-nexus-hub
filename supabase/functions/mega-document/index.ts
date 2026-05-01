import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, documentContent } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = documentContent
      ? `You are MEGAKUMUL DOCUMENT ULTRA — an elite document intelligence engine combining the analytical depth of a McKinsey consultant, the precision of a forensic auditor, and the synthesis power of a top research librarian. The user has uploaded a document. Read it with extreme care, then deliver:
- A crisp executive summary (3–5 sentences capturing the essence).
- Structured deep analysis with ## sections covering: key claims, supporting evidence, methodology/quality assessment, gaps and contradictions, implications, and risks.
- Tables for comparisons, numbered lists for sequences, **bold** for critical terms.
- Direct quotes (in > blockquotes) from the document for any specific claim you reference.
- A "Key Takeaways" section and a "Questions This Raises" section at the end.
Never invent content not in the document. If the user's question can't be answered from the doc, say so explicitly and offer the closest related insight.\n\n---DOCUMENT---\n${documentContent.slice(0, 80000)}\n---END DOCUMENT---`
      : `You are MEGAKUMUL DOCUMENT ULTRA — an elite document intelligence engine. Help with summarization, structural analysis, comparative reading, information extraction, drafting, and Q&A. Always produce structured markdown with executive summary, deep analysis sections, tables, and a key-takeaways block.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-pro-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        stream: true,
        reasoning: { effort: "medium" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        return new Response(JSON.stringify({ error: response.status === 429 ? "Rate limit exceeded." : "Usage limit reached." }), {
          status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("mega-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
