import type { ProductSpec } from "@/types";

const MODEL_RE = /iphone\s*(air|se|xs|xr|x|\d{1,2}e?)(?:\s*(pro\s*max|pro|plus|mini|max))?/i;

/** "Apple iPhone 16 Pro Max 256GB" -> "iphone 16 pro max" (null when no model is found). */
export function canonicalModel(text: string | null | undefined): string | null {
  if (!text) return null;
  const m = MODEL_RE.exec(text);
  if (!m) return null;
  const suffix = m[2] ? " " + m[2].toLowerCase().replace(/^pro\s*max$/, "pro max") : "";
  return `iphone ${m[1].toLowerCase()}${suffix}`;
}

/** "256 gb" -> "256GB", "1 TB" -> "1TB". */
export function canonicalStorage(text: string | null | undefined): string | null {
  if (!text) return null;
  const m = /(\d{1,4})\s*(gb|tb)\b/i.exec(text);
  return m ? `${m[1]}${m[2].toUpperCase()}` : null;
}

export function prettyModel(canonical: string): string {
  const words = canonical.split(" ").slice(1).map((w) => {
    if (/^\d/.test(w)) return w;
    if (["se", "xr", "xs", "x"].includes(w)) return w.toUpperCase();
    return w.charAt(0).toUpperCase() + w.slice(1);
  });
  return ["iPhone", ...words].join(" ");
}

/** Regex-only parse, used as the fallback when the LLM is unavailable. */
export function parseSpecHeuristic(query: string): ProductSpec {
  const canon = canonicalModel(query);
  const q = query.toLowerCase();
  const condition: ProductSpec["condition"] = /refurb|renewed|reconditioned/.test(q)
    ? "refurbished"
    : /\b(used|pre-?owned|second.?hand)\b/.test(q)
      ? "used"
      : "new";
  return {
    model: canon ? prettyModel(canon) : query.trim(),
    storage: canonicalStorage(query),
    color: null,
    condition,
  };
}

/** Stable key for "the same product" across searches (drives offers + price history). */
export function productKeyOf(spec: ProductSpec) {
  const model = canonicalModel(spec.model) ?? spec.model.toLowerCase();
  return `${model}|${canonicalStorage(spec.storage) ?? "any"}|${spec.condition}`;
}

const MODELS = [
  "iPhone 17 Pro Max", "iPhone 17 Pro", "iPhone Air", "iPhone 17",
  "iPhone 16e", "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16",
  "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
  "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
  "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 mini",
  "iPhone SE", "iPhone 12", "iPhone 11",
];

export const EXAMPLE_SEARCHES = ["iPhone 16", "iPhone 16 Pro", "iPhone 16 Pro Max 256GB", "iPhone 15 Plus"];

/** Autocomplete for the search box (models only; users can type anything). */
export function suggest(input: string, limit = 6): string[] {
  const q = input.trim().toLowerCase();
  if (q.length < 2) return [];
  const out: string[] = [];
  for (const m of MODELS) {
    if (!m.toLowerCase().includes(q) && !q.includes(m.toLowerCase())) continue;
    out.push(m);
    if (!canonicalStorage(input)) out.push(`${m} 256GB`);
  }
  return [...new Set(out)].filter((s) => s.toLowerCase() !== q).slice(0, limit);
}
