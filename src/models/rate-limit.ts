import { Schema, model, models, type Model } from "mongoose";

export interface RateLimitDoc {
  key: string;
  count: number;
  expireAt: Date;
}

const RateLimitSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
    expireAt: { type: Date, required: true, expires: 0 }, // TTL: removed once expireAt passes
  },
  { collection: "rate_limits" },
);

export const RateLimit = (models.RateLimit as Model<RateLimitDoc> | undefined) ?? model<RateLimitDoc>("RateLimit", RateLimitSchema);
