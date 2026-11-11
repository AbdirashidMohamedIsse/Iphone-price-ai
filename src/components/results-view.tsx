"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSearchRun } from "@/hooks/use-search-run";
import type { SearchView } from "@/types";
import { BestDealCard } from "./best-deal-card";
import { OffersTable } from "./offers-table";
import { PipelineProgress } from "./pipeline-progress";
import { PriceDistributionChart } from "./price-chart";
import { PriceHistoryChart } from "./price-history-chart";
import { RecommendationPanel } from "./recommendation-panel";

export function ResultsView({ runId, initial }: { runId: string; initial: SearchView }) {
  const { data } = useSearchRun(runId, initial);
  const view = data ?? initial;
  const c = view.comparison;

  return (
    <div className="space-y-6 pt-6">
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">{view.spec?.model ?? view.query}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {view.spec?.storage && <Badge>{view.spec.storage}</Badge>}
          {view.spec?.color && <Badge>{view.spec.color}</Badge>}
          {view.spec && <Badge variant="outline">{view.spec.condition === "any" ? "Any condition" : view.spec.condition}</Badge>}
          {view.cachedFrom && <Badge variant="outline">Saved result from the last 15 minutes</Badge>}
        </div>
      </div>

      {view.status !== "success" && (
        <PipelineProgress progress={view.progress} stats={view.stats} runStatus={view.status} error={view.error} />
      )}

      {view.status === "failed" && (
        <Button asChild variant="outline"><Link href="/">Start a new search</Link></Button>
      )}

      {view.status === "success" && c && (
        <>
          {c.bestDeal ? (
            <>
              <BestDealCard comparison={c} />
              <div className="grid gap-6 lg:grid-cols-2">
                {view.recommendation && <RecommendationPanel rec={view.recommendation} />}
                <PriceDistributionChart offers={c.offers} bestPrice={c.bestDeal.priceUsd} />
              </div>
              <OffersTable offers={[...c.offers]} bestUrl={c.bestDeal.url} />
              <PriceHistoryChart productKey={view.productKey} />
            </>
          ) : (
            <Card>
              <CardContent className="space-y-3 p-6">
                <h2 className="font-display text-xl font-semibold">No verified prices found</h2>
                <p className="text-sm text-muted-foreground">
                  We read {view.stats.pagesProcessed} store pages but none showed a price we could confirm for this exact phone.
                  Try removing the color or storage, or search for a different condition.
                </p>
                <Button asChild variant="outline"><Link href="/">Search again</Link></Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
