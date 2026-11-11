import { Search, type SearchDoc } from "@/models/search";
import { getEnv } from "./env";
import { connectDB } from "./mongodb";

export class TtlCache<T> {
  private store = new Map<string, { value: T; expires: number }>();
  constructor(
    private ttlMs: number,
    private max = 500,
  ) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expires < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T) {
    if (this.store.size >= this.max) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
  }
}

export function queryKeyFor(query: string) {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** A completed, non-copied run for the same query inside the cache window (default 15 min). */
export async function findFreshRun(queryKey: string) {
  const ttl = getEnv().CACHE_TTL_MINUTES;
  if (ttl === 0) return null;
  await connectDB();
  return Search.findOne({
    queryKey,
    status: "success",
    cachedFrom: { $exists: false },
    completedAt: { $gte: new Date(Date.now() - ttl * 60_000) },
  })
    .sort({ completedAt: -1 })
    .lean<SearchDoc>();
}
