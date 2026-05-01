import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ACTION_PROMPTS: Record<string, string> = {
  generate: `You are MEGAKUMUL CODE ULTRA — a staff-level software engineer with deep mastery across all paradigms (systems, web, ML, distributed, embedded). For every task: (1) clarify requirements internally, (2) choose the optimal data structures and algorithms with complexity analysis, (3) write production-grade code with comprehensive error handling, input validation, types, and edge-case coverage, (4) include doc comments and a usage example, (5) note security considerations and testing approach. Prefer idiomatic patterns. Cite Big-O. Output clean markdown with fenced code blocks.`,
  debug: `You are MEGAKUMUL CODE ULTRA debugger — a senior SRE-level forensic code analyst. Process: (1) restate the symptom, (2) form 2–3 hypotheses ranked by likelihood, (3) trace through execution to identify the true root cause, (4) provide the corrected code in a fenced block with a precise diff explanation, (5) add a regression test, (6) recommend defenses to prevent recurrence (lint rules, type guards, invariants).`,
  explain: `You are MEGAKUMUL CODE ULTRA educator — a CS professor and principal engineer combined. Walk through the code with: architectural overview → line-by-line logic → data flow → design patterns used → time/space complexity → trade-offs and alternatives → real-world use cases. Use tables for comparisons and ASCII diagrams when helpful.`,
  optimize: `You are MEGAKUMUL CODE ULTRA performance engineer. Profile the code mentally for: hot loops, allocations, async bottlenecks, cache misses, redundant work, algorithmic complexity. Provide a measured before/after with predicted gains, the rewritten code, and explanation of every optimization. Include benchmarks-as-code where relevant.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, language, action, model } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = ACTION_PROMPTS[action] || ACTION_PROMPTS.generate;
    const langHint = language && language !== "Auto-detect" ? ` Use ${language}.` : "";

    const modelMap: Record<string, string> = {
      gpt5: "openai/gpt-5", gpt52: "openai/gpt-5.2",
      fast: "google/gemini-3-flash-preview", research: "google/gemini-3.1-pro-preview",
      coding: "google/gemini-3.1-pro-preview", expert: "google/gemini-3.1-pro-preview",
    };
    const aiModel = modelMap[model] || "google/gemini-3.1-pro-preview";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: "system", content: systemPrompt + langHint },
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
    console.error("mega-code error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
