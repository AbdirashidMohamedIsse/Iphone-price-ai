import { Schema, model, models, type Model } from "mongoose";

export interface AgentLogDoc {
  runId: string;
  agent: string;
  status: "ok" | "error";
  durationMs: number;
  input?: unknown;
  output?: unknown;
  error?: string;
  createdAt: Date;
}

const AgentLogSchema = new Schema(
  {
    runId: { type: String, required: true, index: true },
    agent: { type: String, required: true },
    status: { type: String, enum: ["ok", "error"], required: true },
    durationMs: Number,
    input: Schema.Types.Mixed,
    output: Schema.Types.Mixed,
    error: String,
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 }, // keep 30 days
  },
  { collection: "agent_logs" },
);

export const AgentLog = (models.AgentLog as Model<AgentLogDoc> | undefined) ?? model<AgentLogDoc>("AgentLog", AgentLogSchema);
