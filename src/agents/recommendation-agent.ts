import { z } from "zod";
import { getEnv } from "@/lib/env";
import { errMsg, logger } from "@/lib/logger";
import { structured } from "@/lib/openai";
import { formatUsd } from "@/lib/utils";
import { RecommendationSchema, type ComparisonResult, type ProductSpec, type Recommendation } from "@/types";
import { traced } from "./base";

const WrittenSchema = RecommendationSchema.omit({ availability: true });

const INSTRUCTIONS = `You are the Recommendation Agent in an iPhone price-comparison system. Write short, practical buying advice from verified price data.

Rules:
- Use ONLY the numbers and store names in the data. Never invent prices, discounts, deals, shipping terms or stock levels.
- headline: one sentence naming the lowest verified price and the store, e.g. "The cheapest verified iPhone 16 Pro Max 256GB costs $1,049 at Best Buy."
- summary: 2-3 sentences. State the saving versus the market average and how many stores were compared.
- advice: 2-4 concrete tips grounded in the data (e.g. which store to buy from, whether a trusted retailer is close in price).
- caveats: 0-3 honest warnings (prices change quickly, offers excluded as suspiciously low, only few stores found, items out of stock).`;

/** Deterministic wording, used when there is nothing to recommend or the model fails. */
function fallback(spec: ProductSpec, c: ComparisonResult, availability: Recommendation["availability"]): Recommendation {
  const best = c.bestDeal;
  if (!best) {
    return {
      headline: `No verified offers found for ${spec.model}.`,
      summary: "We checked retailer pages but none showed a price we could confirm for this exact phone.",
      advice: ["Remove the color or storage from your search, or try a different condition.", "Search again in a few minutes."],
      caveats: [],
      availability,
    };
  }
  return {
    headline: `The cheapest verified ${spec.model}${spec.storage ? ` ${spec.storage}` : ""} costs ${formatUsd(best.priceUsd, { cents: true })} at ${best.storeName}.`,
    summary: `That is ${formatUsd(c.savings)} below the ${formatUsd(c.averagePrice)} average across ${c.offers.length} stores.`,
    advice: [`Check the live price at ${best.storeName} before you buy.`],
    caveats: ["Prices and stock change quickly."],
    availability,
  };
}

export async function runRecommendationAgent({
  spec,
  comparison,
  runId,
}: {
  spec: ProductSpec;
  comparison: ComparisonResult;
  runId?: string;
}): Promise<Recommendation> {
  return traced("recommendation", runId, { spec, offerCount: comparison.offers.length }, async () => {
    // Availability is computed, not generated, so it can't contradict the data.
    const share = comparison.inStockShare;
    const availability: Recommendation["availability"] =
      comparison.offers.length === 0 ? "unknown" : share >= 0.7 ? "high" : share >= 0.35 ? "medium" : "low";

    if (!comparison.bestDeal) return fallback(spec, comparison, availability);

    try {
      const written = await structured({
        name: "buying_advice",
        model: getEnv().OPENAI_MODEL_RECOMMENDATION,
        effort: "low",
        instructions: INSTRUCTIONS,
        input: JSON.stringify({
          wanted: spec,
          bestDeal: {
            store: comparison.bestDeal.storeName,
            priceUsd: comparison.bestDeal.priceUsd,
            inStock: comparison.bestDeal.inStock,
          },
          averagePriceUsd: comparison.averagePrice,
          highestPriceUsd: comparison.highestPrice,
          savingsUsd: comparison.savings,
          savingsPercent: comparison.savingsPercent,
          storesCompared: comparison.offers.length,
          suspiciouslyLowOffersExcluded: comparison.offers.filter((o) => o.suspicious).length,
          inStockShare: comparison.inStockShare,
          offers: comparison.offers.slice(0, 8).map((o) => ({
            store: o.storeName, priceUsd: o.priceUsd, inStock: o.inStock, suspicious: o.suspicious,
          })),
        }),
        schema: WrittenSchema as z.ZodType<z.infer<typeof WrittenSchema>>,
      });
      return { ...written, availability };
    } catch (err) {
      logger.warn("recommendation_agent_llm_fallback", { runId, error: errMsg(err) });
      return fallback(spec, comparison, availability);
    }
  });
}
