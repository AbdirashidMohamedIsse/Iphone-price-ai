import { getEnv } from "./env";

/** Scrapes a page through Firecrawl and returns clean markdown. */
export async function scrapeMarkdown(url: string) {
  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${getEnv().FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, timeout: 30_000 }),
    signal: AbortSignal.timeout(45_000),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    error?: string;
    data?: { markdown?: string; metadata?: { title?: string; statusCode?: number } };
  };
  if (!res.ok || !body.success || !body.data?.markdown) {
    throw new Error(`Firecrawl ${res.status}: ${body.error ?? "no content returned"}`);
  }
  return { markdown: body.data.markdown, title: body.data.metadata?.title ?? null };
}

/** Drops images and link targets, which cost tokens but carry no price information. */
export function compactMarkdown(md: string, maxChars = 14_000) {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, maxChars);
}
