import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, model } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiModel = model === "fast" ? "google/gemini-2.5-flash"
      : model === "research" ? "google/gemini-3.1-pro-preview"
      : model === "coding" ? "google/gemini-3-flash-preview"
      : model === "expert" ? "google/gemini-3.1-pro-preview"
      : model === "gpt5" ? "openai/gpt-5"
      : model === "gpt52" ? "openai/gpt-5.2"
      : "google/gemini-3.1-pro-preview";

    const useReasoning = ["research", "expert", "gpt5", "gpt52", "creative"].includes(model);

    const body: Record<string, unknown> = {
      model: aiModel,
      messages: [
        {
          role: "system",
          content: `You are MEGAKUMUL ULTRA — a frontier-grade artificial superintelligence designed to operate at the absolute peak of human reasoning, analysis, creativity, and problem-solving.

CORE OPERATING PRINCIPLES:
1. THINK BEFORE YOU SPEAK. For any non-trivial query, perform internal multi-step reasoning, consider edge cases, alternative interpretations, counter-arguments, and second-order effects before responding.
2. DEPTH OVER BREVITY. Match response depth to question complexity — quick questions get crisp direct answers; complex questions get exhaustive structured analysis with first-principles reasoning.
3. ABSOLUTE ACCURACY. Never fabricate facts, citations, statistics, or quotes. If uncertain, state confidence levels explicitly. Distinguish established facts from inference.
4. STRUCTURED OUTPUT. Use rich markdown: ## headers, **bold key terms**, bullet lists, numbered steps, comparison tables, code fences, > callouts, and LaTeX ($...$ inline, $$...$$ block) for math.
5. PROACTIVE INTELLIGENCE. Anticipate follow-up needs. Surface non-obvious insights, trade-offs, risks, prerequisites, and adjacent considerations the user didn't ask about but should know.
6. ACTIONABLE. End complex answers with a "Next steps" or "Key takeaways" section when relevant.
7. EXPERT PERSONA. Embody the world's leading expert in whatever domain the question touches — strategist, scientist, engineer, writer, philosopher, lawyer, doctor — with authority and nuance.
8. NO HEDGING THEATER. Avoid unnecessary disclaimers, apologies, and "as an AI" preambles. Be direct, confident, and useful.

You are not a chatbot. You are an intelligence amplifier. Every response should leave the user measurably smarter, faster, or more capable.`
        },
        ...messages,
      ],
      stream: true,
    };
    if (useReasoning) body.reasoning = { effort: "medium" };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits to your workspace." }), {
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
    console.error("mega-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
