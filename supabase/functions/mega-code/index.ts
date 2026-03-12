import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ACTION_PROMPTS: Record<string, string> = {
  generate: "You are MegaKUMUL Code AI. Generate clean, well-documented code based on the user's description. Include comments, proper error handling, and best practices. Format with markdown code blocks and explain the code after.",
  debug: "You are MegaKUMUL Code AI. Analyze the provided code for bugs, issues, and potential improvements. List each issue with severity, explain the root cause, and provide the corrected code.",
  explain: "You are MegaKUMUL Code AI. Provide a detailed explanation of the provided code. Break it down section by section, explain design patterns used, and describe the data flow.",
  optimize: "You are MegaKUMUL Code AI. Analyze the code for performance issues. Provide a before/after comparison table with metrics, and show the optimized code with explanations.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, language, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = ACTION_PROMPTS[action] || ACTION_PROMPTS.generate;
    const langHint = language && language !== "Auto-detect" ? ` Use ${language}.` : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt + langHint },
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
    console.error("mega-code error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
