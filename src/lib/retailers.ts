export const TRUSTED_RETAILERS: Record<string, string> = {
  "apple.com": "Apple",
  "amazon.com": "Amazon",
  "bestbuy.com": "Best Buy",
  "walmart.com": "Walmart",
  "target.com": "Target",
  "costco.com": "Costco",
  "bhphotovideo.com": "B&H",
  "newegg.com": "Newegg",
  "ebay.com": "eBay",
  "backmarket.com": "Back Market",
  "swappa.com": "Swappa",
};

// Social, reference and review sites: never a place to buy the phone.
const BLOCKED = [
  "reddit.com", "youtube.com", "facebook.com", "instagram.com", "tiktok.com", "pinterest.com",
  "twitter.com", "x.com", "wikipedia.org", "quora.com", "gsmarena.com", "9to5mac.com",
  "macrumors.com", "theverge.com", "cnet.com", "techradar.com", "pcmag.com", "tomsguide.com",
];

export function registrableDomain(host: string) {
  const parts = host.toLowerCase().replace(/^www\./, "").split(".");
  if (parts.length <= 2) return parts.join(".");
  const sld = parts[parts.length - 2];
  if (parts[parts.length - 1].length === 2 && ["co", "com", "org", "net", "gov", "ac"].includes(sld)) {
    return parts.slice(-3).join(".");
  }
  return parts.slice(-2).join(".");
}

export function domainOf(url: string): string | null {
  try {
    return registrableDomain(new URL(url).hostname);
  } catch {
    return null;
  }
}

export const isTrusted = (domain: string) => domain in TRUSTED_RETAILERS;
export const isBlockedDomain = (domain: string) => BLOCKED.includes(domain);

export function retailerName(domain: string) {
  if (TRUSTED_RETAILERS[domain]) return TRUSTED_RETAILERS[domain];
  const label = domain.split(".")[0];
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Strips tracking params/fragments so the same page isn't scraped twice. */
export function normalizeUrl(raw: string) {
  try {
    const u = new URL(raw);
    u.hash = "";
    [...u.searchParams.keys()]
      .filter((k) => /^(utm_|gclid|fbclid|msclkid|ref$)/i.test(k))
      .forEach((k) => u.searchParams.delete(k));
    return `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/$/, "")}${u.search}`.toLowerCase();
  } catch {
    return raw.toLowerCase();
  }
}
