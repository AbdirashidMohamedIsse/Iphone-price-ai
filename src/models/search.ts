import { Schema, model, models, type Model } from "mongoose";
import type {
  AgentStage, ComparisonResult, ProductSpec, Recommendation, SearchStats, SearchStatus, StageStatus,
} from "@/types";

export interface SearchDoc {
  runId: string;
  clientId: string;
  query: string;
  queryKey: string;
  productKey?: string;
  spec?: ProductSpec;
  status: SearchStatus;
  progress: Record<AgentStage, StageStatus>;
  stats: SearchStats;
  result?: { comparison: ComparisonResult | null; recommendation: Recommendation | null };
  memory?: Record<string, unknown>;
  error?: string;
  cachedFrom?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SearchSchema = new Schema(
  {
    runId: { type: String, required: true, unique: true },
    clientId: { type: String, required: true },
    query: { type: String, required: true },
    queryKey: { type: String, required: true },
    productKey: String,
    spec: Schema.Types.Mixed,
    status: { type: String, enum: ["running", "success", "failed"], default: "running" },
    progress: {
      type: Schema.Types.Mixed,
      default: () => ({
        search: "pending", discovery: "pending", ingestion: "pending",
        validation: "pending", comparison: "pending", recommendation: "pending",
      }),
    },
    stats: {
      type: Schema.Types.Mixed,
      default: () => ({ urlsFound: 0, pagesCandidate: 0, pagesProcessed: 0, offersValid: 0 }),
    },
    result: Schema.Types.Mixed,
    memory: Schema.Types.Mixed, // per-run agent memory (parsed spec, queries used, ...)
    error: String,
    cachedFrom: String,
    completedAt: Date,
  },
  { timestamps: true, collection: "searches" },
);
SearchSchema.index({ clientId: 1, createdAt: -1 });
SearchSchema.index({ queryKey: 1, status: 1, completedAt: -1 });

export const Search = (models.Search as Model<SearchDoc> | undefined) ?? model<SearchDoc>("Search", SearchSchema);
