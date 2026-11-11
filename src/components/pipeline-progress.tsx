import { Circle, CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AGENT_STAGES, type AgentStage, type SearchStats, type SearchStatus, type StageStatus } from "@/types";

const LABELS: Record<AgentStage, { title: string; detail: (s: SearchStats) => string }> = {
  search: { title: "Searching the web", detail: (s) => (s.urlsFound ? `${s.urlsFound} pages found` : "Running 5 queries") },
  discovery: { title: "Picking store pages", detail: (s) => (s.pagesCandidate ? `${s.pagesCandidate} store pages chosen` : "Filtering to retailers") },
  ingestion: { title: "Reading prices", detail: (s) => `${s.pagesProcessed} of ${s.pagesCandidate || "…"} pages read` },
  validation: { title: "Checking each offer", detail: (s) => `${s.offersValid} verified so far` },
  comparison: { title: "Comparing stores", detail: () => "Converting and de-duplicating prices" },
  recommendation: { title: "Writing advice", detail: () => "Summarizing the best option" },
};

function Icon({ status }: { status: StageStatus }) {
  if (status === "done") return <CircleCheck className="size-5 text-good" aria-hidden />;
  if (status === "running") return <LoaderCircle className="size-5 animate-spin" aria-hidden />;
  if (status === "failed") return <CircleAlert className="size-5 text-bad" aria-hidden />;
  return <Circle className="size-5 text-muted-foreground" aria-hidden />;
}

export function PipelineProgress({
  progress, stats, runStatus, error,
}: { progress: Record<AgentStage, StageStatus>; stats: SearchStats; runStatus: SearchStatus; error: string | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{runStatus === "failed" ? "The search stopped" : "Checking stores for you"}</CardTitle>
        {runStatus === "failed" && <p className="text-sm text-bad" role="alert">{error ?? "Something went wrong."} Try the search again.</p>}
      </CardHeader>
      <CardContent>
        <ol className="space-y-3" aria-live="polite">
          {AGENT_STAGES.map((stage) => {
            // A failed run leaves its in-flight stage marked running; show it as failed.
            const status: StageStatus = runStatus === "failed" && progress[stage] === "running" ? "failed" : progress[stage];
            return (
              <li key={stage} className="flex items-center gap-3">
                <Icon status={status} />
                <span className={cn("text-sm", status === "pending" && "text-muted-foreground")}>
                  <span className="font-medium">{LABELS[stage].title}</span>
                  {status !== "pending" && <span className="text-muted-foreground"> — {LABELS[stage].detail(stats)}</span>}
                </span>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
