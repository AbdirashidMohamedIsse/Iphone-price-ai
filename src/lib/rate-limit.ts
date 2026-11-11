import { RateLimit } from "@/models/rate-limit";
import { connectDB } from "./mongodb";

/**
 * Fixed-window limiter backed by MongoDB (one atomic upsert per call), so the
 * limit holds across serverless instances. Buckets expire via a TTL index.
 */
export async function rateLimit(key: string, limit: number, windowSec = 60) {
  await connectDB();
  const windowMs = windowSec * 1000;
  const bucket = Math.floor(Date.now() / windowMs);
  const id = `${key}:${bucket}`;

  const bump = () =>
    RateLimit.findOneAndUpdate(
      { key: id },
      { $inc: { count: 1 }, $setOnInsert: { expireAt: new Date((bucket + 1) * windowMs + 60_000) } },
      { upsert: true, new: true },
    ).lean<{ count: number }>();

  let doc;
  try {
    doc = await bump();
  } catch (err) {
    if ((err as { code?: number }).code !== 11000) throw err; // concurrent first insert
    doc = await bump();
  }
  const count = doc?.count ?? 1;
  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSec: Math.max(1, Math.ceil(((bucket + 1) * windowMs - Date.now()) / 1000)),
  };
}
