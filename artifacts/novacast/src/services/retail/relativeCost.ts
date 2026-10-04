// Relative cost, computed ONLY from verified prices already in the results.
//
// This never invents a number. It parses the prices real retailer APIs returned
// and, if there are enough of them, tags each item cheap / mid / pricey relative
// to the rest of the same shopping request. With too few verified prices it
// leaves every `relativeCost` null — "we don't rank on data we don't have".

import type { GearItemResult } from './types';

/** "$5.97", "$5.97 - $8.49", "5.97" -> a representative number, or null. */
export function parsePrice(display: string | null | undefined): number | null {
  if (!display) return null;
  const nums = String(display)
    .replace(/[, ]/g, '')
    .match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length === 0) return null;
  const vals = nums.map(Number).filter((n) => Number.isFinite(n) && n > 0);
  if (vals.length === 0) return null;
  // Range -> midpoint; single -> itself.
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** Lowest verified price among an item's offers, or null. */
function itemVerifiedLow(item: GearItemResult): number | null {
  const prices = item.offers
    .filter((o) => o.offerType === 'verified-product' && !o.priceIsEstimate)
    .map((o) => parsePrice(o.price))
    .filter((n): n is number => n != null);
  return prices.length ? Math.min(...prices) : null;
}

/**
 * Mutates `results` in place, setting `relativeCost` on each item. Returns the
 * same array. Requires ≥3 items with a verified price to rank anything.
 */
export function applyRelativeCost(results: GearItemResult[]): GearItemResult[] {
  const priced = results
    .map((item) => ({ item, low: itemVerifiedLow(item) }))
    .filter((x): x is { item: GearItemResult; low: number } => x.low != null);

  if (priced.length < 3) {
    for (const r of results) r.relativeCost = null;
    return results;
  }

  const sorted = [...priced].sort((a, b) => a.low - b.low);
  const t1 = sorted[Math.floor(sorted.length / 3)].low;
  const t2 = sorted[Math.floor((2 * sorted.length) / 3)].low;

  for (const r of results) {
    const low = itemVerifiedLow(r);
    r.relativeCost = low == null ? null : low <= t1 ? 'low' : low <= t2 ? 'mid' : 'high';
  }
  return results;
}
