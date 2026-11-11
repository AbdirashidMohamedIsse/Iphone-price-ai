import { NextResponse } from "next/server";
import { errMsg, logger } from "@/lib/logger";
import { getSearchView } from "@/lib/search-service";

export async function GET(_req: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  if (!/^run_[a-z0-9_]{6,40}$/.test(runId)) return NextResponse.json({ error: "Invalid run id" }, { status: 400 });
  try {
    const view = await getSearchView(runId);
    return view ? NextResponse.json(view) : NextResponse.json({ error: "Run not found" }, { status: 404 });
  } catch (err) {
    logger.error("get_run_failed", { runId, error: errMsg(err) });
    return NextResponse.json({ error: "Could not load results" }, { status: 500 });
  }
}
