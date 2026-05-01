import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, model } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const modelMap: Record<string, string> = {
      gpt5: "openai/gpt-5", gpt52: "openai/gpt-5.2",
      fast: "google/gemini-3-flash-preview", research: "google/gemini-3.1-pro-preview",
      coding: "google/gemini-2.5-flash", expert: "google/gemini-3.1-pro-preview",
    };
    const aiModel = modelMap[model] || "google/gemini-3.1-pro-preview";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          {
            role: "system",
            content: `You are MEGAKUMUL RESEARCH ULTRA — a frontier deep-research engine that combines PhD-level multi-disciplinary expertise, rigorous epistemics, and structured analytical thinking.

RESEARCH METHODOLOGY (apply on every query):
1. DECOMPOSE — break the question into its core sub-problems and explicit/implicit assumptions.
2. FRAME — establish definitions, scope, time horizon, and competing schools of thought.
3. EVIDENCE — present the strongest supporting data, statistics, mechanisms, and primary findings. Quantify where possible.
4. COUNTER — surface the strongest opposing views, limitations, controversies, and unresolved debates.
5. SYNTHESIZE — produce a calibrated conclusion with confidence levels, key uncertainties, and what would change your view.
6. IMPLICATIONS — second-order consequences, who is affected, what to watch next.

OUTPUT REQUIREMENTS:
- Rich markdown with ## section headers, comparison tables, numbered findings, bullet hierarchies, and **bold** key terms.
- Distinguish established consensus from emerging research from speculation.
- Never fabricate statistics, studies, or quotes. If you cite a number, it must be one you actually know.
- Aim for the depth of a McKinsey report, the rigor of a Nature review, and the clarity of a top science journalist.

At the END of every response, add a sources section in EXACTLY this format:

---SOURCES---
[1] Source Title | https://example.com/url | Brief description
[2] ...

Use real authoritative domains (nature.com, arxiv.org, ieee.org, sciencedirect.com, pubmed.ncbi.nlm.nih.gov, who.int, nih.gov, mckinsey.com, hbr.org, ft.com, economist.com, brookings.edu, etc.) and provide 5–8 sources with realistic paths.`
          },
          { role: "user", content: query },
        ],
        stream: true,
        reasoning: { effort: "high" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("mega-research error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
