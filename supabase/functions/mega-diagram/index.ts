import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, style } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const styleHint = style === "3d" 
      ? "Create a stunning photorealistic 3D rendered diagram with volumetric lighting, glass/metallic materials, depth of field, and professional studio lighting."
      : style === "technical"
      ? "Create a precise technical/engineering diagram with clean lines, proper annotations, and professional layout."
      : style === "infographic"
      ? "Create a visually engaging infographic-style diagram with icons, charts, and data visualizations."
      : "Create a professional, realistic, 3D-looking educational diagram or illustration.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: `${styleHint} Topic: ${prompt}. 
Requirements:
- Clear labels with large, readable text
- Realistic 3D rendering with depth, shadows, and reflections
- Professional color scheme with high contrast
- Clean layout with proper spacing
- NO dotted lines - use solid, clear lines
- Photorealistic quality with studio-grade lighting
- Make it look like a premium educational illustration`,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        return new Response(JSON.stringify({ error: response.status === 429 ? "Rate limit exceeded. Please wait and try again." : "Usage limit reached. Please add credits." }), {
          status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Diagram gen error:", response.status, t);
      return new Response(JSON.stringify({ error: "Diagram generation unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const text = data.choices?.[0]?.message?.content || "";

    if (!imageData) {
      return new Response(JSON.stringify({ error: "No diagram generated", text }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ imageUrl: imageData, text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mega-diagram error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
