// Retail entry point. UI imports only from here.
//
// getGearOffers() queries EVERY configured provider and merges their offers per
// item (verified-product beats retailer-search for the same retailer), then
// tops up with search links for any known retailer no provider covered, so
// there's always a way to continue to a store. Relative cost is computed last,
// from verified prices only.

import { linkOutProvider } from './linkOutProvider';
import { walmartProvider } from './walmartProvider';
import { applyRelativeCost } from './relativeCost';
import { KNOWN_RETAILERS } from './types';
import type { GearItemResult, GearQuery, GearOffer, RetailProvider } from './types';

export type {
  GearQuery, GearOffer, GearItemResult, RetailProvider, RetailerInfo, OfferType,
} from './types';
export { KNOWN_RETAILERS, getRetailer } from './types';
export { parsePrice, applyRelativeCost } from './relativeCost';

// Priced providers first; link-out is always last and always configured.
const REGISTRY: RetailProvider[] = [walmartProvider, linkOutProvider];

export function listRetailers(): { id: string; label: string; active: boolean }[] {
  return REGISTRY.map((p) => ({ id: p.id, label: p.label, active: p.isConfigured() }));
}

/** Retailers NovaCast can point at, with whether a live price path exists. */
export function retailerCoverage(): { id: string; name: string; priced: boolean }[] {
  const pricedIds = new Set(
    REGISTRY.filter((p) => p.id !== 'linkout' && p.isConfigured()).map((p) => p.id),
  );
  return KNOWN_RETAILERS.map((r) => ({ id: r.id, name: r.name, priced: pricedIds.has(r.id) }));
}

function mergeOffers(base: GearOffer[], incoming: GearOffer[]): GearOffer[] {
  const out = [...base];
  for (const off of incoming) {
    const i = out.findIndex((o) => o.retailerId === off.retailerId);
    if (i === -1) { out.push(off); continue; }
    // Prefer a verified product over a bare search link for the same retailer.
    if (out[i].offerType !== 'verified-product' && off.offerType === 'verified-product') out[i] = off;
  }
  return out;
}

export async function getGearOffers(queries: GearQuery[]): Promise<GearItemResult[]> {
  if (queries.length === 0) return [];

  // Collect from each configured provider independently; one failing must not
  // sink the rest.
  const perProvider: GearItemResult[][] = [];
  for (const provider of REGISTRY) {
    if (!provider.isConfigured()) continue;
    try {
      perProvider.push(await provider.search(queries));
    } catch (err) {
      console.warn(`[novacast/retail] provider "${provider.id}" failed:`, err);
    }
  }
  if (perProvider.length === 0) perProvider.push(await linkOutProvider.search(queries));

  // Merge by query index.
  const merged: GearItemResult[] = queries.map((query, i) => {
    let offers: GearOffer[] = [];
    let note: string | undefined;
    for (const set of perProvider) {
      const item = set[i];
      if (!item) continue;
      offers = mergeOffers(offers, item.offers);
      if (item.note && !note) note = item.note;
    }
    // Guarantee search-link coverage for every known retailer.
    for (const r of KNOWN_RETAILERS) {
      if (!offers.some((o) => o.retailerId === r.id)) {
        offers.push({
          productName: query.term,
          retailerId: r.id,
          retailer: r.name,
          offerType: 'retailer-search',
          price: null,
          priceIsEstimate: false,
          imageUrl: null,
          availability: null,
          url: r.searchUrl(query.term),
        });
      }
    }
    const hasVerified = offers.some((o) => o.offerType === 'verified-product' && o.price);
    return {
      query,
      offers,
      relativeCost: null,
      note: hasVerified ? note : "Search links only — no retailer price API is configured yet.",
    };
  });

  return applyRelativeCost(merged);
}
