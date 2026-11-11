import { randomBytes } from "node:crypto";
import { inngest } from "@/inngest/client";
import { Offer } from "@/models/offer";
import { PriceHistory } from "@/models/price-history";
import { Search, type SearchDoc } from "@/models/search";
import { User } from "@/models/user";
import type { HistoryItem, PriceHistoryPoint, SearchView } from "@/types";
import { findFreshRun, queryKeyFor } from "./cache";
import { parseSpecHeuristic, productKeyOf } from "./iphone";
import { errMsg, logger } from "./logger";
import { connectDB } from "./mongodb";

const DONE = { search: "done", discovery: "done", ingestion: "done", validation: "done", comparison: "done", recommendation: "done" } as const;

export async function startSearch({ query, clientId }: { query: string; clientId: string }) {
  await connectDB();
  const queryKey = queryKeyFor(query);
  const runId = `run_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;

  await User.updateOne(
    { clientId },
    { $set: { lastSeenAt: new Date() }, $inc: { searchCount: 1 } },
    { upsert: true },
  );

  // Same query finished within the cache window: copy that result instead of re-crawling.
  const fresh = await findFreshRun(queryKey);
  if (fresh) {
    await Search.create({
      runId, clientId, query, queryKey,
      productKey: fresh.productKey,
      spec: fresh.spec,
      status: "success",
      progress: DONE,
      stats: fresh.stats,
      result: fresh.result,
      cachedFrom: fresh.runId,
      completedAt: new Date(),
    });
    return { runId, cached: true };
  }

  const spec = parseSpecHeuristic(query);
  await Search.create({ runId, clientId, query, queryKey, spec, productKey: productKeyOf(spec) });
  try {
    await inngest.send({ name: "price/search.requested", data: { runId, query } });
  } catch (err) {
    logger.error("inngest_send_failed", { runId, error: errMsg(err) });
    await Search.updateOne({ runId }, { $set: { status: "failed", error: "Could not start the workflow.", completedAt: new Date() } });
    throw err;
  }
  return { runId, cached: false };
}

export function toView(doc: SearchDoc): SearchView {
  return {
    runId: doc.runId,
    query: doc.query,
    status: doc.status,
    spec: doc.spec ?? null,
    productKey: doc.productKey ?? null,
    progress: doc.progress,
    stats: doc.stats,
    comparison: doc.result?.comparison ?? null,
    recommendation: doc.result?.recommendation ?? null,
    error: doc.error ?? null,
    cachedFrom: doc.cachedFrom ?? null,
    createdAt: doc.createdAt.toISOString(),
    completedAt: doc.completedAt?.toISOString() ?? null,
  };
}

export async function getSearchView(runId: string): Promise<SearchView | null> {
  await connectDB();
  const doc = await Search.findOne({ runId }).lean<SearchDoc>();
  return doc ? toView(doc) : null;
}

export async function listHistory(clientId: string, limit = 30): Promise<HistoryItem[]> {
  await connectDB();
  const docs = await Search.find({ clientId }).sort({ createdAt: -1 }).limit(limit).lean<SearchDoc[]>();
  return docs.map((d) => {
    const best = d.result?.comparison?.bestDeal;
    return {
      runId: d.runId,
      query: d.query,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
      cheapest: best ? { priceUsd: best.priceUsd, storeName: best.storeName, url: best.url } : null,
    };
  });
}

export async function getOffersAndHistory(productKey: string, limit = 25) {
  await connectDB();
  const [offers, history] = await Promise.all([
    Offer.find({ productKey }).sort({ priceUsd: 1 }).limit(limit).lean(),
    PriceHistory.aggregate<{ _id: string; min: number; avg: number }>([
      { $match: { productKey } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$scrapedAt" } },
          min: { $min: "$priceUsd" },
          avg: { $avg: "$priceUsd" },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 90 },
    ]),
  ]);
  const points: PriceHistoryPoint[] = history.map((h) => ({
    date: h._id,
    min: Math.round(h.min * 100) / 100,
    avg: Math.round(h.avg * 100) / 100,
  }));
  return {
    offers: offers.map((o) => ({
      retailer: o.retailer, retailerUrl: o.retailerUrl, productName: o.productName, priceUsd: o.priceUsd,
      price: o.price, currency: o.currency, inStock: o.inStock, confidenceScore: o.confidenceScore,
      scrapedAt: o.scrapedAt.toISOString(),
    })),
    history: points,
  };
}
