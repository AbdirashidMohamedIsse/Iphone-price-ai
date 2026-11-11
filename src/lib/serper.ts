import type { SearchHit } from "@/types";
import { TtlCache } from "./cache";
import { getEnv } from "./env";

// Identical queries within 15 minutes reuse the same Serper response.
const cache = new TtlCache<SearchHit[]>(15 * 60_000, 200);

export async function serperSearch(q: string): Promise<SearchHit[]> {
  const env = getEnv();
  const key = `${env.SEARCH_COUNTRY}:${q.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": env.SERPER_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ q, gl: env.SEARCH_COUNTRY, num: 10 }),
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Serper ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const data = (await res.json()) as { organic?: Array<{ title?: string; link?: string; snippet?: string }> };
  const hits: SearchHit[] = (data.organic ?? [])
    .filter((r) => r.link)
    .map((r) => ({ url: r.link as string, title: r.title ?? "", snippet: r.snippet ?? "", query: q }));
  cache.set(key, hits);
  return hits;
}
