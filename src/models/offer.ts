import { Schema, model, models, type Model } from "mongoose";

export interface OfferDoc {
  productKey: string;
  productName: string;
  model: string | null;
  storage: string | null;
  color: string | null;
  condition: string;
  retailer: string;
  retailerDomain: string;
  retailerUrl: string;
  price: number; // as listed
  currency: string; // as listed
  priceUsd: number; // normalized
  inStock: boolean;
  scrapedAt: Date;
  confidenceScore: number;
  lastRunId: string;
}

const OfferSchema = new Schema(
  {
    productKey: { type: String, required: true },
    productName: { type: String, required: true },
    model: String,
    storage: String,
    color: String,
    condition: String,
    retailer: { type: String, required: true },
    retailerDomain: { type: String, required: true },
    retailerUrl: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, required: true },
    priceUsd: { type: Number, required: true },
    inStock: { type: Boolean, default: false },
    scrapedAt: { type: Date, required: true },
    confidenceScore: { type: Number, min: 0, max: 1 },
    lastRunId: String,
  },
  { timestamps: true, collection: "offers" },
);
OfferSchema.index({ productKey: 1, retailerUrl: 1 }, { unique: true });
OfferSchema.index({ productKey: 1, priceUsd: 1 });

export const Offer = (models.Offer as Model<OfferDoc> | undefined) ?? model<OfferDoc>("Offer", OfferSchema);
