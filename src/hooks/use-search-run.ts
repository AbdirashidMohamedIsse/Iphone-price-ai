import { useQuery } from "@tanstack/react-query";
import { TERMINAL_STATUSES, type PriceHistoryPoint, type SearchView } from "@/types";

/** Polls the run every 2s until it finishes; TanStack Query dedupes and caches the result. */
export function useSearchRun(runId: string, initial: SearchView) {
  return useQuery<SearchView>({
    queryKey: ["search", runId],
    queryFn: async () => {
      const res = await fetch(`/api/search/${runId}`);
      if (!res.ok) throw new Error("Could not load results");
      return res.json();
    },
    initialData: initial,
    refetchInterval: (q) => (q.state.data && TERMINAL_STATUSES.includes(q.state.data.status) ? false : 2000),
    staleTime: 1000,
  });
}

export function usePriceHistory(productKey: string | null) {
  return useQuery<{ history: PriceHistoryPoint[] }>({
    queryKey: ["price-history", productKey],
    queryFn: async () => {
      const res = await fetch(`/api/offers?productKey=${encodeURIComponent(productKey as string)}`);
      if (!res.ok) throw new Error("Could not load price history");
      return res.json();
    },
    enabled: !!productKey,
    staleTime: 5 * 60_000,
  });
}
