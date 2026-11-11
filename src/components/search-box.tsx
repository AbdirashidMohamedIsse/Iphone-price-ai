"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Search } from "lucide-react";
import { startSearchAction } from "@/actions/search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { useUiStore } from "@/hooks/use-ui-store";
import { EXAMPLE_SEARCHES, suggest } from "@/lib/iphone";

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const recent = useUiStore((s) => s.recent);
  const addRecent = useUiStore((s) => s.addRecent);

  useEffect(() => setMounted(true), []);

  const debounced = useDebounce(query, 200);
  const suggestions = useMemo(() => suggest(debounced), [debounced]);

  function submit(value: string) {
    const q = value.trim();
    setError(null);
    startTransition(async () => {
      const res = await startSearchAction(q);
      if (!res.ok) return setError(res.error);
      addRecent(q);
      router.push(`/results/${res.runId}`);
    });
  }

  return (
    <div className="w-full max-w-2xl">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(query);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <label htmlFor="q" className="sr-only">Search iPhone model</label>
        <Input
          id="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search iPhone model..."
          autoComplete="off"
          disabled={pending}
          aria-describedby={error ? "search-error" : undefined}
        />
        <Button type="submit" size="lg" disabled={pending || query.trim().length < 3}>
          {pending ? <LoaderCircle className="animate-spin" aria-hidden /> : <Search aria-hidden />}
          {pending ? "Starting" : "Find lowest price"}
        </Button>
      </form>

      {error && (
        <p id="search-error" role="alert" className="mt-3 text-sm text-bad">
          {error}
        </p>
      )}

      {suggestions.length > 0 && !pending && (
        <ul className="mt-2 flex flex-wrap gap-2" aria-label="Suggestions">
          {suggestions.map((s) => (
            <li key={s}>
              <button type="button" onClick={() => setQuery(s)} className="rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-muted">
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 space-y-3 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <span>Try</span>
          {EXAMPLE_SEARCHES.map((ex) => (
            <button
              key={ex}
              type="button"
              disabled={pending}
              onClick={() => {
                setQuery(ex);
                submit(ex);
              }}
              className="rounded-md border px-2.5 py-1 text-foreground hover:bg-muted disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>
        {mounted && recent.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span>Recent</span>
            {recent.map((r) => (
              <button key={r} type="button" disabled={pending} onClick={() => submit(r)} className="rounded-md px-2.5 py-1 text-foreground underline-offset-4 hover:underline">
                {r}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
