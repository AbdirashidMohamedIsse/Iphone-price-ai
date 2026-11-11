import { Search } from "@/models/search";
import type { AgentStage, StageStatus } from "@/types";
import { connectDB } from "./mongodb";

export async function setStage(runId: string, stage: AgentStage, status: StageStatus) {
  await connectDB();
  await Search.updateOne({ runId }, { $set: { [`progress.${stage}`]: status } });
}

export async function patchSearch(runId: string, set: Record<string, unknown>) {
  await connectDB();
  await Search.updateOne({ runId }, { $set: set });
}

export async function bumpProgress(runId: string, valid: boolean) {
  await connectDB();
  await Search.updateOne(
    { runId },
    { $inc: { "stats.pagesProcessed": 1, "stats.offersValid": valid ? 1 : 0 } },
  );
}

export async function markFailed(runId: string, message: string) {
  await connectDB();
  await Search.updateOne(
    { runId, status: "running" },
    { $set: { status: "failed", error: message.slice(0, 500), completedAt: new Date() } },
  );
}
