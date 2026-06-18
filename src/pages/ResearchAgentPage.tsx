import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  FileText,
  Gauge,
  Lightbulb,
  Building2,
  Newspaper,
  BookOpen,
  Landmark,
  FlaskConical,
  CheckCircle2,
  Circle,
  ListTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  streamResearchAgent,
  type ResearchAgentReport,
  type AgentSource,
  type ConfidenceLabel,
  type AgentStage,
} from "@/lib/research-agent-api";
import { toast } from "sonner";

const TYPE_META: Record<
  AgentSource["type"],
  { label: string; icon: typeof Building2; color: string }
> = {
  "peer-reviewed": { label: "Peer-reviewed", icon: FlaskConical, color: "text-emerald-400" },
  preprint: { label: "Preprint", icon: FlaskConical, color: "text-amber-400" },
  government: { label: "Government", icon: Landmark, color: "text-blue-400" },
  institutional: { label: "Institutional", icon: Building2, color: "text-cyan-400" },
  "industry-report": { label: "Industry", icon: Building2, color: "text-purple-400" },
  news: { label: "News", icon: Newspaper, color: "text-orange-400" },
  reference: { label: "Reference", icon: BookOpen, color: "text-muted-foreground" },
  other: { label: "Other", icon: FileText, color: "text-muted-foreground" },
};

const CONFIDENCE_META: Record<ConfidenceLabel, { color: string; bg: string; label: string }> = {
  "very-high": { color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/40", label: "Very High" },
  high: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", label: "High" },
  moderate: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", label: "Moderate" },
  low: { color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", label: "Low" },
  "very-low": { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", label: "Very Low" },
};

const STAGES: { key: AgentStage; label: string }[] = [
  { key: "planning", label: "Plan" },
  { key: "searching", label: "Search" },
  { key: "scoring", label: "Score" },
  { key: "synthesizing", label: "Synthesize" },
  { key: "done", label: "Done" },
];

function credColor(score: number) {
  if (score >= 85) return "text-emerald-400";
  if (score >= 70) return "text-cyan-400";
  if (score >= 55) return "text-amber-400";
  return "text-red-400";
}

function evidenceBadge(s: string) {
  const map: Record<string, string> = {
    strong: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    moderate: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    weak: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    contested: "bg-red-500/15 text-red-300 border-red-500/30",
  };
  return map[s] || "bg-muted text-muted-foreground";
}

export default function ResearchAgentPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<AgentStage>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [subqueries, setSubqueries] = useState<string[]>([]);
  const [sources, setSources] = useState<AgentSource[]>([]);
  const [report, setReport] = useState<ResearchAgentReport | null>(null);
  const sourcesRef = useRef<AgentSource[]>([]);

  const stageIdx = STAGES.findIndex((s) => s.key === stage);

  const run = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setStage("planning");
    setStatusMsg("");
    setSubqueries([]);
    setSources([]);
    sourcesRef.current = [];
    setReport(null);

    try {
      await streamResearchAgent({
        query: query.trim(),
        onEvent: (e) => {
          switch (e.type) {
            case "status":
              setStage(e.stage);
              setStatusMsg(e.message);
              break;
            case "plan":
              setSubqueries(e.subqueries);
              break;
            case "source_found":
              sourcesRef.current = [...sourcesRef.current, { ...e.source, scored: false }];
              setSources(sourcesRef.current);
              break;
            case "source_scored":
              sourcesRef.current = sourcesRef.current.map((s) =>
                s.id === e.id
                  ? {
                      ...s,
                      credibility: e.credibility,
                      credibility_breakdown: e.credibility_breakdown,
                      notes: e.notes,
                      scored: true,
                    }
                  : s,
              );
              setSources(sourcesRef.current);
              break;
            case "report":
              setReport(e.report);
              break;
            case "done":
              setStage("done");
              setLoading(false);
              break;
            case "error":
              toast.error(e.error);
              setStage("error");
              setLoading(false);
              break;
          }
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Stream failed");
      setLoading(false);
      setStage("error");
    }
  };

  const conf = report?.confidence;
  const confMeta = conf ? CONFIDENCE_META[conf.label] : null;
  const sourcesById = new Map(sources.map((s) => [s.id, s]));
  const scoredCount = sources.filter((s) => s.scored).length;

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-heading font-bold gradient-text">
            Research Agent
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Multi-source web research → credibility-scored evidence → executive summary with confidence rating. Watch each stage stream in real time.
        </p>
      </header>

      <Card className="glass p-4">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="Ask anything — e.g. 'Current evidence on GLP-1 drugs for cardiovascular outcomes'"
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={run} disabled={loading || !query.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2">Investigate</span>
          </Button>
        </div>
      </Card>

      {/* Progress timeline */}
      {(loading || stage === "done") && (
        <Card className="glass p-4 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {STAGES.map((s, i) => {
              const reached = stageIdx >= i;
              const current = stage === s.key && loading;
              return (
                <div key={s.key} className="flex items-center gap-2 flex-1 min-w-[80px]">
                  {current ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : reached ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/50" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      current ? "text-primary" : reached ? "text-foreground" : "text-muted-foreground/60"
                    }`}
                  >
                    {s.label}
                  </span>
                  {i < STAGES.length - 1 && (
                    <div
                      className={`flex-1 h-px ${
                        stageIdx > i ? "bg-emerald-400/40" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {statusMsg && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              {statusMsg}
              {stage === "scoring" && sources.length > 0 && (
                <span className="ml-auto font-mono">
                  {scoredCount}/{sources.length}
                </span>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Plan */}
      {subqueries.length > 0 && (
        <Card className="glass p-5 space-y-2">
          <div className="flex items-center gap-2">
            <ListTree className="h-4 w-4 text-primary" />
            <h3 className="font-heading font-semibold">Research Plan</h3>
          </div>
          <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
            {subqueries.map((q, i) => <li key={i}>{q}</li>)}
          </ol>
        </Card>
      )}

      {/* Live sources */}
      {sources.length > 0 && (
        <Card className="glass p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-primary" />
              <h3 className="font-heading font-semibold">
                Sources {report ? "& Credibility" : "Discovered"}
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">
              {sources.length} found · {scoredCount} scored
            </span>
          </div>
          <div className="grid gap-3">
            {sources
              .slice()
              .sort((a, b) => (b.credibility ?? -1) - (a.credibility ?? -1))
              .map((s) => {
                const meta = TYPE_META[s.type] || TYPE_META.other;
                const Icon = meta.icon;
                return (
                  <div
                    key={s.id}
                    className={`border rounded-lg p-4 bg-background/30 space-y-2 transition-all ${
                      s.scored ? "border-border/50" : "border-primary/30 animate-pulse-slow"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                          <span className={meta.color}>{meta.label}</span>
                          <span>·</span>
                          <span>{s.domain}</span>
                          {s.published && <><span>·</span><span>{s.published}</span></>}
                        </div>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-sm hover:text-primary inline-flex items-start gap-1"
                        >
                          <span className="text-primary font-mono">[{s.id}]</span> {s.title}
                          <ExternalLink className="h-3 w-3 mt-1 shrink-0 opacity-60" />
                        </a>
                      </div>
                      <div className="text-right min-w-[60px]">
                        {s.scored && s.credibility !== undefined ? (
                          <>
                            <div className={`text-2xl font-bold ${credColor(s.credibility)}`}>
                              {s.credibility}
                            </div>
                            <div className="text-[10px] text-muted-foreground uppercase">credibility</div>
                          </>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            scoring…
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{s.summary}</p>
                    {s.scored && s.credibility_breakdown && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                        {(["authority", "recency", "methodology", "corroboration"] as const).map((k) => (
                          <div key={k}>
                            <div className="flex justify-between text-[10px] uppercase text-muted-foreground mb-0.5">
                              <span>{k}</span>
                              <span>{s.credibility_breakdown![k]}</span>
                            </div>
                            <Progress value={s.credibility_breakdown![k]} className="h-1" />
                          </div>
                        ))}
                      </div>
                    )}
                    {s.notes && (
                      <p className="text-[11px] italic text-muted-foreground border-l-2 border-border pl-2">
                        {s.notes}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* Final report */}
      {report && (
        <>
          <Card className="glass p-6 space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="font-heading text-lg font-semibold">Executive Summary</h2>
              </div>
              {confMeta && conf && (
                <div className={`rounded-lg border px-4 py-2 ${confMeta.bg}`}>
                  <div className="flex items-center gap-2">
                    <Gauge className={`h-4 w-4 ${confMeta.color}`} />
                    <div className={`text-xs uppercase tracking-wide font-semibold ${confMeta.color}`}>
                      Confidence: {confMeta.label}
                    </div>
                    <div className={`text-sm font-bold ${confMeta.color}`}>{conf.rating}/100</div>
                  </div>
                </div>
              )}
            </div>
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {report.executive_summary}
              </ReactMarkdown>
            </div>
            {conf?.rationale && (
              <div className="text-xs text-muted-foreground border-l-2 border-primary/40 pl-3">
                <span className="font-semibold text-foreground">Why this confidence: </span>
                {conf.rationale}
              </div>
            )}
          </Card>

          {report.key_findings?.length > 0 && (
            <Card className="glass p-6 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h2 className="font-heading text-lg font-semibold">Key Findings</h2>
              </div>
              <ul className="space-y-3">
                {report.key_findings.map((k, i) => (
                  <li key={i} className="border border-border/50 rounded-lg p-3 bg-background/30">
                    <div className="flex items-start gap-2 mb-2">
                      <Badge className={`border ${evidenceBadge(k.evidence_strength)} capitalize text-[10px]`}>
                        {k.evidence_strength}
                      </Badge>
                      <span className="text-sm flex-1">{k.finding}</span>
                    </div>
                    {k.supporting_source_ids?.length > 0 && (
                      <div className="flex flex-wrap gap-1 ml-1">
                        {k.supporting_source_ids.map((id) => {
                          const s = sourcesById.get(id);
                          if (!s) return null;
                          return (
                            <a
                              key={id}
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20"
                              title={s.title}
                            >
                              [{id}] {s.domain}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {(report.counterpoints?.length || report.gaps?.length) ? (
            <div className="grid md:grid-cols-2 gap-4">
              {report.counterpoints?.length ? (
                <Card className="glass p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <h3 className="font-heading font-semibold">Counterpoints</h3>
                  </div>
                  <ul className="text-sm space-y-1.5 list-disc list-inside text-muted-foreground">
                    {report.counterpoints.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </Card>
              ) : null}
              {report.gaps?.length ? (
                <Card className="glass p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-cyan-400" />
                    <h3 className="font-heading font-semibold">Research Gaps</h3>
                  </div>
                  <ul className="text-sm space-y-1.5 list-disc list-inside text-muted-foreground">
                    {report.gaps.map((g, i) => <li key={i}>{g}</li>)}
                  </ul>
                </Card>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
