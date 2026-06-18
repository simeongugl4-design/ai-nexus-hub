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
  credibility: number;
  credibility_breakdown: CredibilityBreakdown;
  notes?: string;
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

export async function runResearchAgent(
  query: string,
): Promise<ResearchAgentReport> {
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

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data?.error || `Request failed (${resp.status})`);
  }
  if (!data?.report) throw new Error("Empty report");
  return data.report as ResearchAgentReport;
}
