import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `You are MEGAKUMUL Research AI, an advanced real-time knowledge engine and deep research assistant. Your primary mission is to provide accurate, current, and well-verified information by combining advanced reasoning with structured analysis.

When given a research query, you must:
1. Fully analyze the request and determine whether it requires general knowledge, deep analysis, or current information
2. Provide a comprehensive, well-structured analysis using markdown formatting
3. Use headers (##), bullet points, numbered lists, tables, and bold emphasis
4. Include specific facts, data, statistics, and expert opinions
5. Break down complex topics logically with context and step-by-step explanations
6. Cross-verify important claims and prioritize truth and reliability
7. Provide comparisons, relevant insights, and context that expands understanding

At the END of your response, add a sources section in this exact format:

---SOURCES---
[1] Source Title | https://example.com/url | Brief description of the source
[2] Another Source | https://example.com/url2 | Brief description

Generate realistic, relevant source URLs based on the topic (use real domains like nature.com, arxiv.org, ieee.org, sciencedirect.com, pubmed.ncbi.nlm.nih.gov, etc.).
Always include at least 4-6 sources. Prioritize accuracy, depth, and real-time relevance.`
          },
          { role: "user", content: query },
        ],
        stream: true,
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
