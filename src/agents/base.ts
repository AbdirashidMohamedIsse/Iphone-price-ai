import { errMsg, logger } from "@/lib/logger";
import { connectDB } from "@/lib/mongodb";
import { AgentLog } from "@/models/agent-log";

export type AgentName = "search" | "discovery" | "ingestion" | "validation" | "comparison" | "recommendation";

function clip(value: unknown, max = 6000): unknown {
  try {
    const s = JSON.stringify(value);
    return s && s.length > max ? `${s.slice(0, max)}…[truncated]` : value;
  } catch {
    return String(value).slice(0, max);
  }
}

async function writeLog(entry: {
  agent: AgentName;
  runId: string;
  status: "ok" | "error";
  durationMs: number;
  input: unknown;
  output?: unknown;
  error?: string;
}) {
  try {
    await connectDB();
    await AgentLog.create({ ...entry, input: clip(entry.input), output: clip(entry.output) });
  } catch (err) {
    // Observability must never break the pipeline.
    logger.warn("agent_log_write_failed", { agent: entry.agent, error: errMsg(err) });
  }
}

/** Times an agent run and records input/output/error in `agent_logs`. */
export async function traced<T>(
  agent: AgentName,
  runId: string | undefined,
  input: unknown,
  fn: () => Promise<T>,
): Promise<T> {
  const started = Date.now();
  const id = runId ?? "standalone";
  try {
    const output = await fn();
    await writeLog({ agent, runId: id, status: "ok", durationMs: Date.now() - started, input, output });
    return output;
  } catch (err) {
    await writeLog({ agent, runId: id, status: "error", durationMs: Date.now() - started, input, error: errMsg(err) });
    throw err;
  }
}
