// Walmart price provider — interface implemented, integration not wired.
//
// Walmart catalog/pricing is only available through an official channel
// (Walmart.io / affiliate product feed) requiring an approved key. Until that
// exists this provider reports `isConfigured() === false` and is skipped. When
// configured, point VITE_WALMART_API_BASE at a small NovaCast-owned proxy that
// holds the secret server-side and returns `{ items: GearItemResult[] }` (or the
// looser `{ items: [{ term, offers }] }` shape this coerces).
//
//   VITE_WALMART_API_BASE - https URL of the pricing proxy. Absent => disabled.
//
// No HTML scraping — it violates Walmart's terms.

import { getRetailer } from './types';
import type { GearItemResult, GearQuery, GearOffer, RetailProvider } from './types';

const API_BASE = import.meta.env.VITE_WALMART_API_BASE as string | undefined;

function coerceOffer(raw: any): GearOffer {
  const retailerId = String(raw?.retailerId ?? 'walmart');
  return {
    productName: String(raw?.productName ?? '').trim() || 'Unnamed product',
    retailerId,
    retailer: String(raw?.retailer ?? getRetailer(retailerId)?.name ?? 'Walmart'),
    offerType: raw?.offerType === 'retailer-search' ? 'retailer-search' : 'verified-product',
    price: raw?.price != null ? String(raw.price) : null,
    priceIsEstimate: !!raw?.priceIsEstimate,
    imageUrl: raw?.imageUrl ? String(raw.imageUrl) : null,
    availability: raw?.availability ? String(raw.availability) : null,
    url: String(raw?.url ?? ''),
  };
}

export const walmartProvider: RetailProvider = {
  id: 'walmart',
  label: 'Walmart',
  isConfigured: () => typeof API_BASE === 'string' && /^https:\/\//.test(API_BASE),
  async search(queries: GearQuery[]): Promise<GearItemResult[]> {
    if (!this.isConfigured()) throw new Error('Walmart pricing proxy not configured (VITE_WALMART_API_BASE)');
    const res = await fetch(`${API_BASE}/gear-offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries }),
    });
    if (!res.ok) throw new Error(`Walmart pricing proxy error ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data?.items)) throw new Error('Walmart pricing proxy returned an unexpected shape');
    return (data.items as any[]).map((it, i) => ({
      query: queries[i] ?? { term: String(it?.query?.term ?? it?.term ?? '') },
      offers: Array.isArray(it?.offers) ? it.offers.map(coerceOffer) : [],
      relativeCost: null,
      note: it?.note ? String(it.note) : undefined,
    }));
  },
};
