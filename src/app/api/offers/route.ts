import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseSpecHeuristic, productKeyOf } from "@/lib/iphone";
import { errMsg, logger } from "@/lib/logger";
import { getOffersAndHistory } from "@/lib/search-service";

const Query = z
  .object({
    productKey: z.string().max(120).optional(),
    q: z.string().max(120).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(25),
  })
  .refine((v) => v.productKey || v.q, { message: "Provide productKey or q" });

/** Latest stored offers + daily price history for a product. */
export async function GET(req: NextRequest) {
  const parsed = Query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const { productKey: given, q, limit } = parsed.data;
  const productKey = given ?? productKeyOf(parseSpecHeuristic(q as string));
  try {
    return NextResponse.json({ productKey, ...(await getOffersAndHistory(productKey, limit)) });
  } catch (err) {
    logger.error("offers_route_failed", { error: errMsg(err) });
    return NextResponse.json({ error: "Could not load offers" }, { status: 500 });
  }
}
