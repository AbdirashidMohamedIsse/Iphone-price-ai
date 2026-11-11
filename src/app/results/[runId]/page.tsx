import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ResultsView } from "@/components/results-view";
import { getSearchView } from "@/lib/search-service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Results" };

async function Loader({ runId }: { runId: string }) {
  const view = /^run_[a-z0-9_]{6,40}$/.test(runId) ? await getSearchView(runId) : null;
  if (!view) notFound();
  return <ResultsView runId={runId} initial={view} />;
}

function Skeleton() {
  return (
    <div className="space-y-6 pt-6" aria-busy="true" aria-label="Loading results">
      <div className="h-10 w-64 animate-pulse rounded-md bg-muted" />
      <div className="h-64 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

export default async function ResultsPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return (
    <Suspense fallback={<Skeleton />}>
      <Loader runId={runId} />
    </Suspense>
  );
}
