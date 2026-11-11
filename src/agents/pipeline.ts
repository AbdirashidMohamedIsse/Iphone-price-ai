import { bumpProgress } from "@/lib/run-state";
import type { CandidatePage, PageOutcome, ProductSpec } from "@/types";
import { runIngestionAgent } from "./ingestion-agent";
import { runValidationAgent } from "./validation-agent";

/**
 * Ingestion -> Validation for a single candidate page. The workflow fans this
 * out across pages (one durable step each), so one bad page never sinks the run.
 */
export async function processPage(page: CandidatePage, spec: ProductSpec, runId: string): Promise<PageOutcome> {
  const base = { url: page.url, domain: page.domain, retailer: page.retailer };

  const ingested = await runIngestionAgent({ page, spec, runId });
  if (!ingested.ok) {
    await bumpProgress(runId, false);
    return { ...base, status: "failed", reason: ingested.reason };
  }

  const verdict = await runValidationAgent({ offer: ingested.offer, spec, runId });
  await bumpProgress(runId, verdict.valid);
  return verdict.valid
    ? { ...base, status: "valid", validated: { offer: verdict.offer, confidenceScore: verdict.confidenceScore } }
    : { ...base, status: "rejected", reason: verdict.reasons.join("; ") };
}
