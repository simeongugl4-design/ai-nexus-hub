import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const GW = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callJSON(
  model: string,
  system: string,
  user: string,
  schema: unknown,
  schemaName: string,
): Promise<any> {
  const resp = await fetch(GW, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: schemaName, strict: true, schema },
      },
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Gateway ${resp.status}: ${t.slice(0, 200)}`);
  }
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content);
  } catch {
    return JSON.parse(content.replace(/```json|```/g, "").trim());
  }
}

const planSchema = {
  type: "object",
  properties: {
    subqueries: {
      type: "array",
      items: { type: "string" },
      description: "4-6 focused sub-questions to investigate.",
    },
    plan_note: { type: "string" },
  },
  required: ["subqueries", "plan_note"],
};

const sourcesSchema = {
  type: "object",
  properties: {
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
          published: { type: "string" },
          summary: { type: "string" },
        },
        required: ["id", "title", "url", "domain", "type", "summary"],
      },
    },
  },
  required: ["sources"],
};

const scoringSchema = {
  type: "object",
  properties: {
    scored: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer" },
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
        required: ["id", "credibility", "credibility_breakdown", "notes"],
      },
    },
  },
  required: ["scored"],
};

const synthSchema = {
  type: "object",
  properties: {
    executive_summary: { type: "string" },
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
    counterpoints: { type: "array", items: { type: "string" } },
    gaps: { type: "array", items: { type: "string" } },
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
      required: ["rating", "label", "rationale", "what_would_change_it"],
    },
  },
  required: [
    "executive_summary",
    "key_findings",
    "counterpoints",
    "gaps",
    "confidence",
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (!LOVABLE_API_KEY) {
    return new Response(
      JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let query = "";
  try {
    const body = await req.json();
    query = body.query;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!query) {
    return new Response(JSON.stringify({ error: "Missing query" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      try {
        const FAST = "google/gemini-3-flash-preview";
        const PRO = "google/gemini-3.1-pro-preview";

        // STAGE 1 — PLAN
        send({ type: "status", stage: "planning", message: "Decomposing query into sub-questions…" });
        const plan = await callJSON(
          FAST,
          "You are a research planner. Break the user's query into 4-6 focused, non-overlapping sub-questions that, together, would fully answer it.",
          `Query: ${query}`,
          planSchema,
          "research_plan",
        );
        send({ type: "plan", subqueries: plan.subqueries, note: plan.plan_note });

        // STAGE 2 — DISCOVER SOURCES
        send({ type: "status", stage: "searching", message: "Searching multi-source web for evidence…" });
        const discovered = await callJSON(
          PRO,
          `You are a research librarian. Given a query and sub-questions, return 6-8 high-quality real sources across multiple types (peer-reviewed, government, institutional, industry-report, news, reference). Use REAL authoritative domains (nature.com, arxiv.org, pubmed.ncbi.nlm.nih.gov, who.int, nih.gov, mckinsey.com, brookings.edu, ft.com, economist.com, reuters.com, ieee.org, sciencedirect.com, .gov, etc). Never fabricate; use plausible real URLs you actually know. Assign sequential ids starting at 1.`,
          `Query: ${query}\n\nSub-questions:\n${plan.subqueries.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}`,
          sourcesSchema,
          "research_sources",
        );

        // Stream sources one by one
        for (const s of discovered.sources) {
          send({ type: "source_found", source: s });
          await sleep(120);
        }

        // STAGE 3 — SCORE
        send({ type: "status", stage: "scoring", message: "Scoring credibility of each source…" });
        const scoring = await callJSON(
          FAST,
          `You score source credibility on four 0-100 axes:
- authority: publisher reputation & domain expertise
- recency: how current the information is for this topic
- methodology: rigor / primary vs secondary
- corroboration: agreement with independent sources
The overall "credibility" is a weighted blend (authority 30%, methodology 30%, corroboration 25%, recency 15%). Add a short notes string flagging any caveats (single study, opinion piece, conflict of interest, etc).`,
          `Query: ${query}\n\nSources to score (return one entry per id):\n${JSON.stringify(discovered.sources)}`,
          scoringSchema,
          "source_scoring",
        );

        // Stream scoring results
        for (const s of scoring.scored) {
          send({
            type: "source_scored",
            id: s.id,
            credibility: s.credibility,
            credibility_breakdown: s.credibility_breakdown,
            notes: s.notes,
          });
          await sleep(150);
        }

        // STAGE 4 — SYNTHESIZE
        send({ type: "status", stage: "synthesizing", message: "Synthesizing executive summary & confidence rating…" });

        // Merge scored data into sources for synthesis context
        const scoreMap = new Map(scoring.scored.map((s: any) => [s.id, s]));
        const fullSources = discovered.sources.map((s: any) => ({
          ...s,
          ...(scoreMap.get(s.id) || {}),
        }));

        const synthesis = await callJSON(
          PRO,
          `You are a senior research analyst. Using ONLY the provided scored sources, produce an executive summary, key findings (each tagged by evidence strength and citing source ids), counterpoints, research gaps, and an overall confidence rating (0-100 + label) with a clear rationale and what would change it. Weight higher-credibility sources more heavily. Distinguish consensus from emerging or contested evidence.`,
          `Query: ${query}\n\nScored sources:\n${JSON.stringify(fullSources)}`,
          synthSchema,
          "research_synthesis",
        );

        send({
          type: "report",
          report: {
            ...synthesis,
            sources: fullSources,
          },
        });
        send({ type: "done" });
        controller.close();
      } catch (e) {
        console.error("research-agent error:", e);
        send({
          type: "error",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});
