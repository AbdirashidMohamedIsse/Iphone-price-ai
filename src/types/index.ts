import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Shared schemas. Fields the LLM must fill use `.nullable()` (never   */
/* `.optional()`) because OpenAI strict structured outputs require     */
/* every key to be present.                                            */
/* ------------------------------------------------------------------ */

export const SearchQuerySchema = z
  .string()
  .trim()
  .min(3, "Enter an iPhone model, like “iPhone 16 Pro 256GB”.")
  .max(120, "Keep the search under 120 characters.")
  .refine((q) => /iphone|\b1[1-9]e?\b|\bse\b|\bxr\b|\bxs\b/i.test(q), {
    message: "This tool compares iPhone prices. Include a model, like “iPhone 16”.",
  });

export const ConditionSchema = z.enum(["new", "refurbished", "used", "any"]);
export type Condition = z.infer<typeof ConditionSchema>;

export const ProductSpecSchema = z.object({
  model: z.string(), // "iPhone 16 Pro Max"
  storage: z.string().nullable(), // "256GB"
  color: z.string().nullable(),
  condition: ConditionSchema,
});
export type ProductSpec = z.infer<typeof ProductSpecSchema>;

/* Search Agent */
export const SearchHitSchema = z.object({
  url: z.string(),
  title: z.string(),
  snippet: z.string(),
  query: z.string(),
});
export type SearchHit = z.infer<typeof SearchHitSchema>;

export const SearchAgentInputSchema = z.object({ query: SearchQuerySchema });
export type SearchAgentOutput = { spec: ProductSpec; queries: string[]; urls: SearchHit[] };

/* Page Discovery Agent */
export const CandidatePageSchema = z.object({
  url: z.string(),
  title: z.string(),
  snippet: z.string(),
  domain: z.string(),
  retailer: z.string(),
  trusted: z.boolean(),
  score: z.number(),
});
export type CandidatePage = z.infer<typeof CandidatePageSchema>;
export const DiscoveryInputSchema = z.object({ spec: ProductSpecSchema, urls: z.array(SearchHitSchema).max(60) });

/* Ingestion Agent */
export const AVAILABILITY = ["in_stock", "limited", "out_of_stock", "preorder", "unknown"] as const;
export const OFFER_CONDITIONS = ["new", "refurbished", "used", "unknown"] as const;

export const RawOfferSchema = z.object({
  storeName: z.string(),
  productName: z.string(),
  price: z.number().nullable(),
  currency: z.string().nullable(),
  availability: z.enum(AVAILABILITY),
  condition: z.enum(OFFER_CONDITIONS),
  model: z.string().nullable(),
  storage: z.string().nullable(),
  color: z.string().nullable(),
  url: z.string(),
  scrapedAt: z.string(),
});
export type RawOffer = z.infer<typeof RawOfferSchema>;
export const IngestionInputSchema = z.object({
  page: z.object({ url: z.string().url(), title: z.string().optional() }),
  spec: ProductSpecSchema,
});

/* Validation Agent */
export const ValidationInputSchema = z.object({ offer: RawOfferSchema, spec: ProductSpecSchema });
export type ValidationResult = { valid: boolean; confidenceScore: number; reasons: string[]; offer: RawOffer };
export const ValidatedOfferSchema = z.object({ offer: RawOfferSchema, confidenceScore: z.number() });
export type ValidatedOffer = z.infer<typeof ValidatedOfferSchema>;

export type PageOutcome = {
  url: string;
  domain: string;
  retailer: string;
  status: "valid" | "rejected" | "failed";
  reason?: string;
  validated?: ValidatedOffer;
};

/* Price Comparison Agent */
export const ComparedOfferSchema = z.object({
  storeName: z.string(),
  retailerDomain: z.string(),
  productName: z.string(),
  model: z.string().nullable(),
  storage: z.string().nullable(),
  color: z.string().nullable(),
  condition: z.enum(OFFER_CONDITIONS),
  url: z.string(),
  price: z.number(),
  currency: z.string(),
  priceUsd: z.number(),
  inStock: z.boolean(),
  availability: z.enum(AVAILABILITY),
  confidenceScore: z.number(),
  suspicious: z.boolean(),
});
export type ComparedOffer = z.infer<typeof ComparedOfferSchema>;

export const ComparisonResultSchema = z.object({
  offers: z.array(ComparedOfferSchema),
  bestDeal: ComparedOfferSchema.nullable(),
  averagePrice: z.number(),
  medianPrice: z.number(),
  lowestPrice: z.number(),
  highestPrice: z.number(),
  savings: z.number(),
  savingsPercent: z.number(),
  inStockShare: z.number(),
  currency: z.literal("USD"),
});
export type ComparisonResult = z.infer<typeof ComparisonResultSchema>;
export const ComparisonInputSchema = z.object({ offers: z.array(ValidatedOfferSchema).max(40), spec: ProductSpecSchema });

/* Recommendation Agent */
export const RecommendationSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  advice: z.array(z.string()),
  caveats: z.array(z.string()),
  availability: z.enum(["high", "medium", "low", "unknown"]),
});
export type Recommendation = z.infer<typeof RecommendationSchema>;
export const RecommendationInputSchema = z.object({ spec: ProductSpecSchema, comparison: ComparisonResultSchema });

/* Run state */
export const AGENT_STAGES = ["search", "discovery", "ingestion", "validation", "comparison", "recommendation"] as const;
export type AgentStage = (typeof AGENT_STAGES)[number];
export type StageStatus = "pending" | "running" | "done" | "failed";
export type SearchStatus = "running" | "success" | "failed";
export const TERMINAL_STATUSES: readonly SearchStatus[] = ["success", "failed"];

export type SearchStats = { urlsFound: number; pagesCandidate: number; pagesProcessed: number; offersValid: number };

export type SearchView = {
  runId: string;
  query: string;
  status: SearchStatus;
  spec: ProductSpec | null;
  productKey: string | null;
  progress: Record<AgentStage, StageStatus>;
  stats: SearchStats;
  comparison: ComparisonResult | null;
  recommendation: Recommendation | null;
  error: string | null;
  cachedFrom: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type HistoryItem = {
  runId: string;
  query: string;
  status: SearchStatus;
  createdAt: string;
  cheapest: { priceUsd: number; storeName: string; url: string } | null;
};

export type PriceHistoryPoint = { date: string; min: number; avg: number };
