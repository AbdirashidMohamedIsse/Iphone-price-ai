# Cheapest iPhone

AI price-intelligence app: search any iPhone model, and six cooperating agents crawl retailers, verify each offer, compare prices and write buying advice. Built with Next.js 15 (App Router), TypeScript, Tailwind v4, shadcn-style UI, TanStack Query, Zustand, Mongoose, the OpenAI Responses API, Serper, Firecrawl and Inngest.

## How a search runs

```
Search Agent ──► Page Discovery ──► [ Ingestion ► Validation ] × N pages ──► Comparison ──► Recommendation
 (Serper)        (filter + rank)     (Firecrawl + OpenAI)   (parallel)        (plain code)    (OpenAI)
```

| Agent | Does | Uses |
|---|---|---|
| Search | Parses the query into model/storage/color/condition, writes 5 queries, runs them | OpenAI + Serper |
| Page Discovery | Drops non-stores, ranks trusted retailers and domains that scraped well before, asks the model which hits are real product pages | OpenAI + `retailers` collection (memory) |
| Ingestion | Scrapes a page to markdown and extracts store, product, price, currency, availability | Firecrawl + OpenAI |
| Validation | Rule checks (model, storage, color, condition, accessories, price sanity) then a model verdict + confidence | OpenAI |
| Comparison | Converts to USD, de-duplicates, flags too-good-to-be-true prices, computes best/avg/high/savings | pure code |
| Recommendation | Writes advice from the computed numbers only | OpenAI |

The workflow (`src/inngest/functions.ts`) runs each agent as a durable Inngest step. `POST /api/search` (or the server action) creates a `searches` document with a `runId`, fires an event and returns immediately; the results page polls `GET /api/search/[runId]` with TanStack Query until the run ends. Identical searches within 15 minutes reuse the previous result.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in the keys
npm run dev                  # terminal 1: http://localhost:3000
npm run inngest              # terminal 2: Inngest dev server at http://localhost:8288
```

Requires Node 20+, a MongoDB database (Atlas free tier works), and keys for OpenAI, Serper and Firecrawl.

## API

| Route | Purpose |
|---|---|
| `POST /api/search` `{ "query": "iPhone 16 Pro 256GB" }` | Start a run → `{ runId, cached }` |
| `GET /api/search/[runId]` | Status, progress, results |
| `GET /api/offers?q=...` or `?productKey=...` | Stored offers + daily price history |
| `POST /api/agents/{search,discovery,ingestion,validation,comparison,recommendation}` | Run one agent directly. Needs `Authorization: Bearer $INTERNAL_API_KEY` |
| `/api/inngest` | Inngest webhook |

## Deploy to Vercel

1. Push the repo to GitHub and import it in Vercel (framework: Next.js).
2. **MongoDB Atlas**: create a cluster, add a database user, and under Network Access allow Vercel's egress (`0.0.0.0/0` unless you use a static-IP add-on or Atlas private endpoints). Copy the connection string into `MONGODB_URI`.
3. **Environment variables** (Project → Settings → Environment Variables): everything in `.env.example`. Set `INTERNAL_API_KEY` to a long random string, or leave it empty to disable `/api/agents/*`.
4. **Inngest**: install the Inngest integration from the Vercel Marketplace (it sets `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`), or create an app at inngest.com and add both keys by hand. After the first deploy, sync the app at `https://YOUR-DOMAIN/api/inngest` in the Inngest dashboard.
5. Deploy. Run one search and watch the run in the Inngest dashboard.

Notes:
- `/api/inngest` sets `maxDuration = 300`. On Vercel Hobby the cap is 60s; a step (scrape + two model calls) normally fits, but lower the export to avoid a build warning.
- If Vercel deployment protection is on, exempt `/api/inngest` or Inngest can't reach it.
- Rate limiting is stored in MongoDB (`rate_limits`, TTL-expired), so it holds across serverless instances.

## Data

Collections: `users`, `searches`, `products`, `offers`, `retailers`, `price_history`, `agent_logs` (30-day TTL) and `rate_limits`. `users` holds an anonymous cookie id until you add auth; search history is per browser.

## Things to know

- **Exchange rates are static** (`src/lib/currency.ts`). Fine for USD stores; plug in a live FX source before comparing across currencies.
- **Scraping**: retailers can block scrapers or hide prices behind JavaScript or a store selector. Those pages show up as failed or rejected, and the retailer's success rate feeds back into ranking. Check each store's terms before using results commercially.
- **Cost**: one uncached search is roughly 5 Serper queries, up to `MAX_PAGES` Firecrawl scrapes and about `2 × MAX_PAGES + 3` model calls. Lower `MAX_PAGES` to cut cost.
- **Errors**: unhandled server errors go through `src/instrumentation.ts` as structured JSON. Forward them to Sentry or Datadog there.
