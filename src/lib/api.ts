import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import { getEnv } from "./env";
import { errMsg, logger } from "./logger";

export function clientIpFrom(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}

function safeEqual(a: string, b: string) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
}

/**
 * Wrapper for /api/agents/*. These routes spend OpenAI/Firecrawl/Serper credits,
 * so they require `Authorization: Bearer $INTERNAL_API_KEY` and a valid body.
 */
export async function agentRoute<S extends z.ZodTypeAny>(
  req: NextRequest,
  schema: S,
  run: (input: z.infer<S>) => Promise<unknown>,
) {
  const key = getEnv().INTERNAL_API_KEY;
  if (!key) return NextResponse.json({ error: "Agent routes are disabled (INTERNAL_API_KEY not set)." }, { status: 503 });
  if (!safeEqual(req.headers.get("authorization") ?? "", `Bearer ${key}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    return NextResponse.json(await run(parsed.data));
  } catch (err) {
    logger.error("agent_route_failed", { path: req.nextUrl.pathname, error: errMsg(err) });
    return NextResponse.json({ error: "Agent failed." }, { status: 500 });
  }
}
