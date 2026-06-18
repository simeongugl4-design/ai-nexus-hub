import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are MEGAKUMUL RESEARCH AGENT — a rigorous multi-source research analyst.

Process the query as if you ran multi-source web research across:
- Peer-reviewed journals (nature.com, science.org, arxiv.org, pubmed)
- Tier-1 news & analysis (ft.com, economist.com, reuters.com, bloomberg.com)
- Institutional / government (who.int, nih.gov, worldbank.org, oecd.org, .gov)
- Industry research (mckinsey.com, brookings.edu, rand.org, gartner.com)
- Reference / encyclopedic (wikipedia.org — supporting only)

For EVERY source you cite, you MUST score credibility on these axes (0-100 each):
- authority: publisher reputation & expertise
- recency: how current the information is for this topic
- methodology: rigor of underlying methods / primary vs secondary
- corroboration: whether other independent sources agree
The overall "credibility" score is a weighted blend.

Rules:
- Never invent sources. Use real, plausible URLs on real authoritative domains.
- Distinguish established consensus from emerging findings and from speculation.
- Flag conflicts of interest, single-study claims, and unresolved debates.
- Confidence rating reflects the OVERALL strength of evidence behind your summary.

Return STRICTLY the JSON schema requested — no prose outside JSON.`;

const schema = {
  type: "object",
  properties: {
    executive_summary: {
      type: "string",
      description: "3-6 sentence executive summary in clear markdown.",
    },
    key_findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          finding: { type: "string" },
          evidence_strength: {
            type: "string",
            enum: ["strong", "moderate", "weak", "contested"],
          },
          supporting_source_ids: {
            type: "array",
            items: { type: "integer" },
          },
        },
        required: ["finding", "evidence_strength", "supporting_source_ids"],
      },
    },
    counterpoints: {
      type: "array",
      items: { type: "string" },
      description: "Opposing views, limitations, or unresolved debates.",
    },
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer" },
          title: { type: "string" },
          url: { type: "string" },
          domain: { type: "string" },
          type: {
            type: "string",
            enum: [
              "peer-reviewed",
              "news",
              "government",
              "institutional",
              "industry-report",
              "reference",
              "preprint",
              "other",
            ],
          },
          published: {
            type: "string",
            description: "Year or YYYY-MM if known, else empty.",
          },
          summary: { type: "string" },
          credibility: { type: "integer", minimum: 0, maximum: 100 },
          credibility_breakdown: {
            type: "object",
            properties: {
              authority: { type: "integer" },
              recency: { type: "integer" },
              methodology: { type: "integer" },
              corroboration: { type: "integer" },
            },
            required: ["authority", "recency", "methodology", "corroboration"],
          },
          notes: { type: "string" },
        },
        required: [
          "id",
          "title",
          "url",
          "domain",
          "type",
          "summary",
          "credibility",
          "credibility_breakdown",
        ],
      },
    },
    confidence: {
      type: "object",
      properties: {
        rating: { type: "integer", minimum: 0, maximum: 100 },
        label: {
          type: "string",
          enum: ["very-low", "low", "moderate", "high", "very-high"],
        },
        rationale: { type: "string" },
        what_would_change_it: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["rating", "label", "rationale"],
    },
    gaps: {
      type: "array",
      items: { type: "string" },
      description: "Unknowns / research gaps worth investigating next.",
    },
  },
  required: [
    "executive_summary",
    "key_findings",
    "sources",
    "confidence",
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Missing query" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const resp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-pro-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Research query: ${query}\n\nReturn at least 6 high-quality sources across multiple source types when relevant.`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "research_agent_report",
              strict: true,
              schema,
            },
          },
        }),
      },
    );

    if (!resp.ok) {
      const text = await resp.text();
      console.error("AI gateway error:", resp.status, text);
      if (resp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (resp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: "Research agent temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    let report: unknown;
    try {
      report = JSON.parse(content);
    } catch {
      // Some models wrap JSON in ```json fences
      const cleaned = content.replace(/```json|```/g, "").trim();
      report = JSON.parse(cleaned);
    }

    return new Response(JSON.stringify({ report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mega-research-agent error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
