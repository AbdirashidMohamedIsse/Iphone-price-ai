import { processPage } from "@/agents/pipeline";
import { runComparisonAgent } from "@/agents/comparison-agent";
import { runDiscoveryAgent } from "@/agents/discovery-agent";
import { runRecommendationAgent } from "@/agents/recommendation-agent";
import { runSearchAgent } from "@/agents/search-agent";
import { productKeyOf } from "@/lib/iphone";
import { errMsg } from "@/lib/logger";
import { persistRun } from "@/lib/persist";
import { markFailed, patchSearch, setStage } from "@/lib/run-state";
import type { CandidatePage, PageOutcome, ProductSpec, ValidatedOffer } from "@/types";
import { inngest } from "./client";

/**
 * The multi-agent workflow. Each agent runs inside a durable `step.run`, so a
 * crash or timeout resumes from the last finished step instead of re-spending
 * credits. Pages are processed in parallel, one step per page.
 *
 *   Search -> Discovery -> [Ingestion -> Validation] x N pages -> Comparison -> Recommendation
 */
export const priceSearchWorkflow = inngest.createFunction(
  {
    id: "price-search-workflow",
    retries: 2,
    concurrency: { limit: 10 },
    onFailure: async ({ event, error }) => {
      const original = event.data.event as unknown as { data?: { runId?: string } };
      if (original.data?.runId) await markFailed(original.data.runId, errMsg(error));
    },
  },
  { event: "price/search.requested" },
  async ({ event, step }) => {
    const { runId, query } = event.data;

    const searched = await step.run("search-agent", async () => {
      await setStage(runId, "search", "running");
      const out = await runSearchAgent({ query, runId });
      await patchSearch(runId, {
        spec: out.spec,
        productKey: productKeyOf(out.spec),
        "stats.urlsFound": out.urls.length,
        memory: { queries: out.queries },
        "progress.search": "done",
      });
      return out;
    });
    const spec: ProductSpec = searched.spec;

    const { candidatePages } = await step.run("discovery-agent", async () => {
      await setStage(runId, "discovery", "running");
      const out = await runDiscoveryAgent({ spec, urls: searched.urls, runId });
      await patchSearch(runId, {
        "stats.pagesCandidate": out.candidatePages.length,
        "progress.discovery": "done",
        "progress.ingestion": "running",
        "progress.validation": "running",
      });
      return out;
    });

    const outcomes = (await Promise.all(
      candidatePages.map((page, i) =>
        step.run(`ingest-validate-${i}`, () => processPage(page as CandidatePage, spec, runId)),
      ),
    )) as PageOutcome[];
    const valid: ValidatedOffer[] = outcomes.flatMap((o) => (o.validated ? [o.validated] : []));

    const comparison = await step.run("comparison-agent", async () => {
      await patchSearch(runId, { "progress.ingestion": "done", "progress.validation": "done" });
      await setStage(runId, "comparison", "running");
      const out = await runComparisonAgent({ offers: valid, spec, runId });
      await setStage(runId, "comparison", "done");
      return out;
    });

    const recommendation = await step.run("recommendation-agent", async () => {
      await setStage(runId, "recommendation", "running");
      const out = await runRecommendationAgent({ spec, comparison, runId });
      await setStage(runId, "recommendation", "done");
      return out;
    });

    await step.run("persist", async () => {
      await persistRun({ runId, spec, comparison, outcomes });
      await patchSearch(runId, {
        status: "success",
        result: { comparison, recommendation },
        completedAt: new Date(),
      });
    });

    return { runId, offers: comparison.offers.length };
  },
);
