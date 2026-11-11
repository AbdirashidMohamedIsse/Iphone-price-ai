import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/utils";
import type { ComparisonResult } from "@/types";

/** The one memorable element: the lowest price, presented as a shelf price tag. */
export function BestDealCard({ comparison }: { comparison: ComparisonResult }) {
  const best = comparison.bestDeal;
  if (!best) return null;
  return (
    <section aria-labelledby="best-deal" className="relative overflow-hidden rounded-lg bg-tag text-tag-foreground">
      <span aria-hidden className="absolute left-4 top-4 size-3 rounded-full bg-background" />
      <div className="px-8 pb-6 pt-10">
        <h2 id="best-deal" className="text-sm font-medium">Lowest verified price at {best.storeName}</h2>
        <p className="mt-2 font-display text-7xl font-semibold leading-none tracking-tight">
          {formatUsd(best.priceUsd, { cents: best.priceUsd % 1 !== 0 })}
        </p>
        {best.currency !== "USD" && (
          <p className="mt-2 text-sm">Listed at {best.price.toLocaleString()} {best.currency}, converted to USD.</p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-tag-foreground/40 px-8 py-4">
        <p className="text-sm">
          {comparison.savings > 0 ? (
            <>
              <span className="font-semibold">{formatUsd(comparison.savings)} below</span> the {formatUsd(comparison.averagePrice)} average
              {" "}({comparison.savingsPercent.toFixed(0)}% less)
            </>
          ) : (
            "Matches the market average"
          )}
          {!best.inStock && " · Stock not confirmed"}
        </p>
        <Button asChild>
          <a href={best.url} target="_blank" rel="noopener noreferrer">
            Buy at {best.storeName}
            <ExternalLink aria-hidden />
          </a>
        </Button>
      </div>
    </section>
  );
}
