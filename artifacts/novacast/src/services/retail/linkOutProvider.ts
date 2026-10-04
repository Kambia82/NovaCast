// Always-available fallback provider: no API, no prices, just honest links.
//
// One "offer" per known retailer pointing at that retailer's own search results
// for the term. `price` is null, `offerType` is 'retailer-search' — NovaCast
// never shows a made-up number. A priced API provider (Walmart IO, an Amazon
// PA-API proxy, an affiliate feed) merges on top of this in ./index.ts when
// configured; this stays as the coverage floor.

import { KNOWN_RETAILERS } from './types';
import type { GearItemResult, GearQuery, GearOffer, RetailProvider } from './types';

export const linkOutProvider: RetailProvider = {
  id: 'linkout',
  label: 'Store search links',
  isConfigured: () => true,
  async search(queries: GearQuery[]): Promise<GearItemResult[]> {
    return queries.map((query) => {
      const offers: GearOffer[] = KNOWN_RETAILERS.map((r) => ({
        productName: query.term,
        retailerId: r.id,
        retailer: r.name,
        offerType: 'retailer-search',
        price: null,
        priceIsEstimate: false,
        imageUrl: null,
        availability: null,
        url: r.searchUrl(query.term),
      }));
      return {
        query,
        offers,
        relativeCost: null,
        note: "Search links only — no retailer price API is configured, so NovaCast can't show verified prices yet.",
      };
    });
  },
};
