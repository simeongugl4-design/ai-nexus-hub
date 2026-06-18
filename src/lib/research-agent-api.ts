export type CredibilityBreakdown = {
  authority: number;
  recency: number;
  methodology: number;
  corroboration: number;
};

export type AgentSource = {
  id: number;
  title: string;
  url: string;
  domain: string;
  type:
    | "peer-reviewed"
    | "news"
    | "government"
    | "institutional"
    | "industry-report"
    | "reference"
    | "preprint"
    | "other";
  published?: string;
  summary: string;
  credibility?: number;
  credibility_breakdown?: CredibilityBreakdown;
  notes?: string;
  scored?: boolean;
};

export type KeyFinding = {
  finding: string;
  evidence_strength: "strong" | "moderate" | "weak" | "contested";
  supporting_source_ids: number[];
};

export type ConfidenceLabel =
  | "very-low"
  | "low"
  | "moderate"
  | "high"
  | "very-high";

export type ResearchAgentReport = {
  executive_summary: string;
  key_findings: KeyFinding[];
  counterpoints?: string[];
  sources: AgentSource[];
  confidence: {
    rating: number;
    label: ConfidenceLabel;
    rationale: string;
    what_would_change_it?: string[];
  };
  gaps?: string[];
};

export type AgentStage =
  | "idle"
  | "planning"
  | "searching"
  | "scoring"
  | "synthesizing"
  | "done"
  | "error";

export type AgentEvent =
  | { type: "status"; stage: AgentStage; message: string }
  | { type: "plan"; subqueries: string[]; note?: string }
  | { type: "source_found"; source: AgentSource }
  | {
      type: "source_scored";
      id: number;
      credibility: number;
      credibility_breakdown: CredibilityBreakdown;
      notes?: string;
    }
  | { type: "report"; report: ResearchAgentReport }
  | { type: "done" }
  | { type: "error"; error: string };

export async function streamResearchAgent({
  query,
  onEvent,
}: {
  query: string;
  onEvent: (e: AgentEvent) => void;
}): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const resp = await fetch(`${supabaseUrl}/functions/v1/mega-research-agent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!resp.ok || !resp.body) {
    const data = await resp.json().catch(() => ({}));
    onEvent({
      type: "error",
      error: data?.error || `Request failed (${resp.status})`,
    });
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const line = raw.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      const json = line.slice(6).trim();
      if (!json) continue;
      try {
        const evt = JSON.parse(json) as AgentEvent;
        onEvent(evt);
      } catch {
        // ignore malformed
      }
    }
  }
}
