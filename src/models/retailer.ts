import { Schema, model, models, type Model } from "mongoose";

export interface RetailerDoc {
  domain: string;
  name: string;
  trusted: boolean;
  successCount: number;
  failCount: number;
  lastSeenAt: Date;
}

// Doubles as cross-run agent memory: the Discovery Agent ranks pages by each
// domain's past success rate (pages that scraped and validated vs. didn't).
const RetailerSchema = new Schema(
  {
    domain: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    trusted: { type: Boolean, default: false },
    successCount: { type: Number, default: 0 },
    failCount: { type: Number, default: 0 },
    lastSeenAt: Date,
  },
  { timestamps: true, collection: "retailers" },
);

export const Retailer = (models.Retailer as Model<RetailerDoc> | undefined) ?? model<RetailerDoc>("Retailer", RetailerSchema);
