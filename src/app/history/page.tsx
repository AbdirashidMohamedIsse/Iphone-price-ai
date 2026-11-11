import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { LocalTime } from "@/components/local-time";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listHistory } from "@/lib/search-service";
import { formatUsd } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search history" };

async function HistoryList() {
  const clientId = (await cookies()).get("pid")?.value;
  const items = clientId ? await listHistory(clientId) : [];

  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8">
        <p className="font-medium">No searches yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Your past searches and the lowest price found for each will show up here.</p>
        <Button asChild className="mt-4"><Link href="/">Search for an iPhone</Link></Button>
      </div>
    );
  }
  return (
    <ul className="divide-y rounded-lg border bg-card">
      {items.map((i) => (
        <li key={i.runId}>
          <Link href={`/results/${i.runId}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-muted">
            <div>
              <p className="font-medium">{i.query}</p>
              <p className="text-sm text-muted-foreground"><LocalTime iso={i.createdAt} /></p>
            </div>
            <div className="text-right">
              {i.cheapest ? (
                <>
                  <p className="font-display text-xl font-semibold">{formatUsd(i.cheapest.priceUsd)}</p>
                  <p className="text-sm text-muted-foreground">at {i.cheapest.storeName}</p>
                </>
              ) : i.status === "running" ? (
                <Badge variant="warn">Still running</Badge>
              ) : i.status === "failed" ? (
                <Badge variant="bad">Failed</Badge>
              ) : (
                <Badge variant="outline">No verified price</Badge>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function HistoryPage() {
  return (
    <section className="pt-6">
      <h1 className="mb-6 font-display text-4xl font-semibold tracking-tight">Search history</h1>
      <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-muted" aria-busy="true" />}>
        <HistoryList />
      </Suspense>
    </section>
  );
}
