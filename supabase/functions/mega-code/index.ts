import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ACTION_PROMPTS: Record<string, string> = {
  generate: "You are MEGAKUMUL Code AI, a world-class coding assistant. Generate clean, efficient, production-ready code with detailed comments and explanations. Include usage examples, error handling, and best practices. Use markdown code blocks with proper syntax highlighting.",
  debug: "You are MEGAKUMUL Code AI, a world-class debugging expert. Analyze the code systematically: identify the root cause, explain why it fails, provide the corrected code with a clear before/after comparison, and suggest preventive measures.",
  explain: "You are MEGAKUMUL Code AI, a world-class code educator. Explain the code thoroughly: break down each section, explain the logic, data flow, design patterns used, time/space complexity, and provide a clear summary. Use diagrams or tables where helpful.",
  optimize: "You are MEGAKUMUL Code AI, a world-class performance engineer. Analyze the code for performance issues, memory leaks, and inefficiencies. Provide a detailed before/after comparison with metrics, show the optimized code with explanations of each improvement.",
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
