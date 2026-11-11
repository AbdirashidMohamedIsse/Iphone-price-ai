import { productKeyOf } from "./iphone";
import { connectDB } from "./mongodb";
import { Offer } from "@/models/offer";
import { PriceHistory } from "@/models/price-history";
import { Product } from "@/models/product";
import { Retailer } from "@/models/retailer";
import { isTrusted, retailerName } from "./retailers";
import type { ComparisonResult, PageOutcome, ProductSpec } from "@/types";

/** Writes products, offers, retailer stats and price history for a finished run. */
export async function persistRun(args: {
  runId: string;
  spec: ProductSpec;
  comparison: ComparisonResult;
  outcomes: PageOutcome[];
}) {
  const { runId, spec, comparison, outcomes } = args;
  await connectDB();
  const now = new Date();
  const productKey = productKeyOf(spec);

  await Product.updateOne(
    { productKey },
    {
      $set: {
        model: spec.model,
        storage: spec.storage,
        color: spec.color,
        condition: spec.condition,
        lastSearchedAt: now,
        bestPriceUsd: comparison.bestDeal?.priceUsd ?? null,
      },
      $inc: { searchCount: 1 },
    },
    { upsert: true },
  );

  const credible = comparison.offers;
  if (credible.length) {
    await Offer.bulkWrite(
      credible.map((o) => ({
        updateOne: {
          filter: { productKey, retailerUrl: o.url },
          update: {
            $set: {
              productName: o.productName,
              model: o.model,
              storage: o.storage,
              color: o.color,
              condition: o.condition,
              retailer: o.storeName,
              retailerDomain: o.retailerDomain,
              price: o.price,
              currency: o.currency,
              priceUsd: o.priceUsd,
              inStock: o.inStock,
              scrapedAt: now,
              confidenceScore: o.confidenceScore,
              lastRunId: runId,
            },
          },
          upsert: true,
        },
      })),
    );
    await PriceHistory.insertMany(
      credible
        .filter((o) => !o.suspicious)
        .map((o) => ({
          productKey,
          retailer: o.storeName,
          retailerDomain: o.retailerDomain,
          retailerUrl: o.url,
          priceUsd: o.priceUsd,
          inStock: o.inStock,
          scrapedAt: now,
        })),
    );
  }

  // Retailer reliability: feeds the Discovery Agent's ranking on later runs.
  if (outcomes.length) {
    await Retailer.bulkWrite(
      outcomes.map((o) => ({
        updateOne: {
          filter: { domain: o.domain },
          update: {
            $set: { name: retailerName(o.domain), trusted: isTrusted(o.domain), lastSeenAt: now },
            $inc: { successCount: o.status === "valid" ? 1 : 0, failCount: o.status === "valid" ? 0 : 1 },
          },
          upsert: true,
        },
      })),
    );
  }
}
