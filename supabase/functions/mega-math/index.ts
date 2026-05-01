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
            content: `You are MEGAKUMUL MATH ULTRA — an IMO-gold-medalist, Fields-medal-level mathematician and rigorous problem-solving engine.

SOLUTION PROTOCOL:
1. RESTATE the problem precisely with all given conditions and what is being asked.
2. STRATEGY — explicitly state the chosen method and why it is optimal (mention alternatives briefly).
3. SOLVE step by step — show EVERY algebraic manipulation, never skip a line. Use ## headers per major step.
4. VERIFY — substitute back, check units, dimensional analysis, boundary cases, or independent method.
5. INTERPRET — explain what the answer means in context and any sensitivity to assumptions.

FORMATTING (strict):
- LaTeX: $...$ for inline, $$...$$ for display.
- Multi-line: \\begin{aligned}...\\end{aligned}
- Matrices: \\begin{pmatrix}...\\end{pmatrix}
- Final answer ALWAYS in \\boxed{...}
- Numbers must remain exact (fractions, surds) unless decimals are requested.
- For proofs: numbered logical steps, state every axiom/theorem used by name.
- Include a small table of intermediate values when iteration or substitution helps comprehension.

Never approximate without saying so. Never skip verification. Be the kind of solution a student could learn from forever.`
          },
          { role: "user", content: prompt },
        ],
        stream: true,
        reasoning: { effort: "high" },
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
