import { Schema, model, models, type Model } from "mongoose";

export interface PriceHistoryDoc {
  productKey: string;
  retailer: string;
  retailerDomain: string;
  retailerUrl: string;
  priceUsd: number;
  inStock: boolean;
  scrapedAt: Date;
}

const PriceHistorySchema = new Schema(
  {
    productKey: { type: String, required: true },
    retailer: String,
    retailerDomain: String,
    retailerUrl: String,
    priceUsd: { type: Number, required: true },
    inStock: Boolean,
    scrapedAt: { type: Date, required: true },
  },
  { collection: "price_history" },
);
PriceHistorySchema.index({ productKey: 1, scrapedAt: -1 });

export const PriceHistory =
  (models.PriceHistory as Model<PriceHistoryDoc> | undefined) ?? model<PriceHistoryDoc>("PriceHistory", PriceHistorySchema);
