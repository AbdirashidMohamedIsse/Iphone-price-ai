import { Schema, model, models, type Model } from "mongoose";

export interface ProductDoc {
  productKey: string;
  model: string;
  storage: string | null;
  color: string | null;
  condition: string;
  searchCount: number;
  bestPriceUsd: number | null;
  lastSearchedAt: Date;
}

const ProductSchema = new Schema(
  {
    productKey: { type: String, required: true, unique: true },
    model: { type: String, required: true },
    storage: String,
    color: String,
    condition: String,
    searchCount: { type: Number, default: 0 },
    bestPriceUsd: Number,
    lastSearchedAt: Date,
  },
  { timestamps: true, collection: "products" },
);

export const Product = (models.Product as Model<ProductDoc> | undefined) ?? model<ProductDoc>("Product", ProductSchema);
