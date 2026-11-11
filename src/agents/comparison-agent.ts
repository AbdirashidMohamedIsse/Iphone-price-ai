import { toUsd } from "@/lib/currency";
import { normalizeUrl, domainOf } from "@/lib/retailers";
import type { ComparedOffer, ComparisonResult, ProductSpec, ValidatedOffer } from "@/types";
import { traced } from "./base";

const round2 = (n: number) => Math.round(n * 100) / 100;

function median(sorted: number[]) {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function dedupe(items: ComparedOffer[], keyOf: (o: ComparedOffer) => string) {
  const groups = new Map<string, ComparedOffer>();
  for (const item of items) {
    const key = keyOf(item);
    const existing = groups.get(key);
    if (!existing || item.confidenceScore > existing.confidenceScore) groups.set(key, item);
  }
  return [...groups.values()];
}

/**
 * Price Comparison Agent. Deliberately plain code, not an LLM: normalizing
 * currencies, de-duplicating and averaging must be exact and repeatable.
 */
export async function runComparisonAgent({
  offers,
  spec,
  runId,
}: {
  offers: ValidatedOffer[];
  spec: ProductSpec;
  runId?: string;
}): Promise<ComparisonResult> {
  return traced("comparison", runId, { offerCount: offers.length, spec }, async () => {
    // 1. Normalize to USD.
    const all: ComparedOffer[] = offers.flatMap(({ offer, confidenceScore }) => {
      if (offer.price === null || !offer.currency) return [];
      return [
        {
          storeName: offer.storeName,
          retailerDomain: domainOf(offer.url) ?? offer.storeName.toLowerCase(),
          productName: offer.productName,
          model: offer.model,
          storage: offer.storage,
          color: offer.color,
          condition: offer.condition,
          url: offer.url,
          price: offer.price,
          currency: offer.currency.toUpperCase(),
          priceUsd: toUsd(offer.price, offer.currency),
          inStock: offer.availability === "in_stock" || offer.availability === "limited",
          availability: offer.availability,
          confidenceScore,
          suspicious: false,
        },
      ];
    });

    // 2. De-duplicate in two passes: same page, then same store + variant + rounded price.
    //    Within each group keep the most confident reading.
    const unique = dedupe(
      dedupe(all, (o) => normalizeUrl(o.url)),
      (o) => `${o.retailerDomain}|${o.storage}|${o.color}|${o.condition}|${Math.round(o.priceUsd)}`,
    ).sort((a, b) => a.priceUsd - b.priceUsd);

    // 3. Flag deals that are too good to be true (< 55% of the median, needs 3+ offers to judge).
    const med = median(unique.map((o) => o.priceUsd));
    if (unique.length >= 3) {
      for (const o of unique) o.suspicious = o.priceUsd < med * 0.55;
    }

    // 4. Best deal = cheapest trustworthy offer, preferring ones you can actually buy now.
    const credible = unique.filter((o) => !o.suspicious);
    const buyable = credible.filter((o) => o.inStock);
    const bestDeal = (buyable.length ? buyable : credible)[0] ?? null;

    const prices = credible.map((o) => o.priceUsd);
    const average = prices.length ? prices.reduce((s, p) => s + p, 0) / prices.length : 0;
    const savings = bestDeal ? Math.max(0, average - bestDeal.priceUsd) : 0;

    return {
      offers: unique,
      bestDeal,
      averagePrice: round2(average),
      medianPrice: round2(median(prices)),
      lowestPrice: prices.length ? Math.min(...prices) : 0,
      highestPrice: prices.length ? Math.max(...prices) : 0,
      savings: round2(savings),
      savingsPercent: average ? round2((savings / average) * 100) : 0,
      inStockShare: unique.length ? round2(unique.filter((o) => o.inStock).length / unique.length) : 0,
      currency: "USD" as const,
    };
  });
}
