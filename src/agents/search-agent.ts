import { z } from "zod";
import { canonicalModel, canonicalStorage, parseSpecHeuristic, prettyModel } from "@/lib/iphone";
import { errMsg, logger } from "@/lib/logger";
import { structured } from "@/lib/openai";
import { normalizeUrl } from "@/lib/retailers";
import { serperSearch } from "@/lib/serper";
import { ProductSpecSchema, type ProductSpec, type SearchAgentOutput, type SearchHit } from "@/types";
import { traced } from "./base";

const PlanSchema = z.object({ spec: ProductSpecSchema, queries: z.array(z.string()) });

const INSTRUCTIONS = `You are the Search Agent in an iPhone price-comparison system.

Given a shopper's query:
1. Extract the product spec: model (e.g. "iPhone 16 Pro Max"), storage (e.g. "256GB", or null), color (or null), and condition. Condition is "new" unless the shopper asks for refurbished or used, or says any condition is fine ("any").
2. Write exactly 5 distinct Google queries that surface retailer product or listing pages where this exact phone can be bought. Follow these patterns: "<product> buy", "<product> price", "<product> sale", "<product> retailer", "<product> unlocked". Include storage, color and condition words when the shopper gave them. No site: operators and no quotation marks.`;

/** Template queries used when the model is unavailable. */
export function templateQueries(spec: ProductSpec): string[] {
  const base = [spec.model, spec.storage, spec.color, spec.condition === "new" || spec.condition === "any" ? null : spec.condition]
    .filter(Boolean)
    .join(" ");
  return ["buy", "price", "sale", "retailer", "unlocked"].map((suffix) => `${base} ${suffix}`);
}

/** Never trust the model's spelling of model/storage: re-derive canonical forms. */
function normalizeSpec(fromModel: ProductSpec, fallback: ProductSpec): ProductSpec {
  const canon = canonicalModel(fromModel.model);
  return {
    model: canon ? prettyModel(canon) : fallback.model,
    storage: canonicalStorage(fromModel.storage) ?? fallback.storage,
    color: fromModel.color?.trim() || null,
    condition: fromModel.condition,
  };
}

export async function runSearchAgent({ query, runId }: { query: string; runId?: string }): Promise<SearchAgentOutput> {
  return traced("search", runId, { query }, async () => {
    const fallback = parseSpecHeuristic(query);
    let spec = fallback;
    let queries = templateQueries(fallback);

    try {
      const plan = await structured({
        name: "search_plan",
        instructions: INSTRUCTIONS,
        input: `Shopper query: ${query}`,
        schema: PlanSchema,
      });
      spec = normalizeSpec(plan.spec, fallback);
      const planned = plan.queries.map((q) => q.trim()).filter(Boolean);
      if (planned.length) queries = planned;
    } catch (err) {
      logger.warn("search_agent_llm_fallback", { runId, error: errMsg(err) });
    }

    queries = [...new Set(queries)].slice(0, 5);
    const settled = await Promise.allSettled(queries.map((q) => serperSearch(q)));
    const failures = settled.filter((r) => r.status === "rejected");
    if (failures.length === settled.length) {
      throw new Error(`Web search failed for every query: ${errMsg((failures[0] as PromiseRejectedResult).reason)}`);
    }

    const seen = new Set<string>();
    const urls: SearchHit[] = [];
    for (const result of settled) {
      if (result.status !== "fulfilled") continue;
      for (const hit of result.value) {
        const key = normalizeUrl(hit.url);
        if (seen.has(key)) continue;
        seen.add(key);
        urls.push(hit);
      }
    }
    return { spec, queries, urls };
  });
}
