/**
 * Approximate USD value of one unit of each currency. These are static
 * placeholders so comparisons work offline; swap `toUsd` for a live FX API
 * (e.g. cached daily) before relying on non-USD comparisons.
 */
const USD_PER_UNIT: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  CAD: 0.73,
  AUD: 0.65,
  NZD: 0.6,
  CHF: 1.13,
  JPY: 0.0067,
  INR: 0.012,
  MXN: 0.05,
  SGD: 0.74,
  AED: 0.272,
};

export const isSupportedCurrency = (code: string | null | undefined): code is string =>
  !!code && code.toUpperCase() in USD_PER_UNIT;

export function toUsd(amount: number, currency: string): number {
  const rate = USD_PER_UNIT[currency.toUpperCase()];
  if (rate === undefined) throw new Error(`Unsupported currency: ${currency}`);
  return Math.round(amount * rate * 100) / 100;
}
