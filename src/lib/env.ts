import { z } from "zod";

const schema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default("gpt-5-mini"),
  OPENAI_MODEL_RECOMMENDATION: z.string().default("gpt-5"),
  SERPER_API_KEY: z.string().min(1),
  FIRECRAWL_API_KEY: z.string().min(1),
  SEARCH_COUNTRY: z.string().default("us"),
  MONGODB_URI: z.string().min(1),
  MONGODB_DB: z.string().default("iphone_price_ai"),
  INTERNAL_API_KEY: z.string().min(16).optional(),
  MAX_PAGES: z.coerce.number().int().min(1).max(20).default(8),
  CACHE_TTL_MINUTES: z.coerce.number().int().min(0).default(15),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).default(6),
});

export type Env = z.infer<typeof schema>;
let cached: Env | null = null;

/** Validated lazily so `next build` doesn't need secrets. */
export function getEnv(): Env {
  if (cached) return cached;
  // Empty strings (e.g. an unfilled .env line) count as "not set".
  const raw = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== ""));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const bad = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid environment configuration. Check: ${bad}`);
  }
  cached = parsed.data;
  return cached;
}
