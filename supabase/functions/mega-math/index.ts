import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, model } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const modelMap: Record<string, string> = {
      gpt5: "openai/gpt-5", gpt52: "openai/gpt-5.2",
      fast: "google/gemini-2.5-flash-lite", research: "google/gemini-2.5-pro",
      coding: "google/gemini-2.5-flash", expert: "google/gemini-2.5-pro",
    };
    const aiModel = modelMap[model] || "google/gemini-2.5-pro";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          {
            role: "system",
            content: `You are MEGAKUMUL Math Solver, a world-class expert mathematician and problem-solving engine. Your mission is to solve mathematical problems with absolute precision, clarity, and depth. Solve problems step-by-step with these rules:

1. Use proper LaTeX notation with $$ for display math and $ for inline math
2. Show EVERY step clearly — never skip steps
3. Use \\begin{aligned} for multi-line equations
4. Use \\begin{pmatrix} for matrices
5. Use \\boxed{} for final answers
6. Include a verification step when possible
7. Add a table of values when relevant
8. Use headers (##) for each step
9. Make numbers clear and large — never abbreviate
10. For proofs, use clear logical structure with numbered steps`
          },
          { role: "user", content: prompt },
        ],
        stream: true,
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
    console.error("mega-math error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
