"use server";

import { cookies, headers } from "next/headers";
import { clientIpFrom } from "@/lib/api";
import { getEnv } from "@/lib/env";
import { errMsg, logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { startSearch } from "@/lib/search-service";
import { SearchQuerySchema } from "@/types";

export type StartSearchResult = { ok: true; runId: string; cached: boolean } | { ok: false; error: string };

export async function startSearchAction(input: string): Promise<StartSearchResult> {
  const parsed = SearchQuerySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid search." };

  const ip = clientIpFrom(await headers());
  const clientId = (await cookies()).get("pid")?.value ?? `ip:${ip}`;

  try {
    const limit = await rateLimit(`search:${ip}`, getEnv().RATE_LIMIT_PER_MINUTE);
    if (!limit.ok) return { ok: false, error: `Too many searches. Try again in ${limit.retryAfterSec}s.` };
    return { ok: true, ...(await startSearch({ query: parsed.data, clientId })) };
  } catch (err) {
    logger.error("start_search_failed", { error: errMsg(err) });
    return { ok: false, error: "We couldn’t start the search. Try again in a moment." };
  }
}
