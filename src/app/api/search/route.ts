import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clientIpFrom } from "@/lib/api";
import { getEnv } from "@/lib/env";
import { errMsg, logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { startSearch } from "@/lib/search-service";
import { SearchQuerySchema } from "@/types";

const Body = z.object({ query: SearchQuerySchema });

export async function POST(req: NextRequest) {
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const ip = clientIpFrom(req.headers);
  try {
    const limit = await rateLimit(`search:${ip}`, getEnv().RATE_LIMIT_PER_MINUTE);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many searches." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
      );
    }
    const clientId = (await cookies()).get("pid")?.value ?? `ip:${ip}`;
    const { runId, cached } = await startSearch({ query: body.data.query, clientId });
    return NextResponse.json({ runId, cached }, { status: 202 });
  } catch (err) {
    logger.error("search_route_failed", { error: errMsg(err) });
    return NextResponse.json({ error: "Could not start the search." }, { status: 500 });
  }
}
