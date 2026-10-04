// Retailer / price-preview contract.
//
// Product direction: NovaCast is NOT a Walmart app. "Walmart Run" is a
// convenience that helps a fisherman find the tackle NovaCast recommends. The
// architecture stays retailer-agnostic — the app asks `getGearOffers()` for a
// list of items and providers answer with offers from whichever retailers they
// cover. A provider missing its credentials reports `isConfigured() === false`
// and is skipped; it never fabricates a price. No scraping — providers use
// official APIs, or return a retailer *search link* with a null price.

/** Retailers NovaCast knows how to link to. Providers reference these ids so a
 *  future Amazon/Bass Pro/etc. price provider and the link-out provider agree
 *  on retailer identity. */
export interface RetailerInfo {
  id: string;
  name: string;
  /** 'search-link' = we can only deep-link a search today.
   *  'api-partner'  = a priced API integration is possible with credentials. */
  kind: 'search-link' | 'api-partner';
  searchUrl: (term: string) => string;
}

export const KNOWN_RETAILERS: RetailerInfo[] = [
  { id: 'walmart', name: 'Walmart', kind: 'api-partner', searchUrl: (t) => `https://www.walmart.com/search?q=${encodeURIComponent(t)}` },
  { id: 'amazon', name: 'Amazon', kind: 'api-partner', searchUrl: (t) => `https://www.amazon.com/s?k=${encodeURIComponent(t + ' fishing')}` },
  { id: 'basspro', name: 'Bass Pro Shops', kind: 'api-partner', searchUrl: (t) => `https://www.basspro.com/shop/SearchDisplay?searchTerm=${encodeURIComponent(t)}` },
  { id: 'academy', name: 'Academy Sports', kind: 'search-link', searchUrl: (t) => `https://www.academy.com/search?text=${encodeURIComponent(t)}` },
  { id: 'dicks', name: "Dick's Sporting Goods", kind: 'search-link', searchUrl: (t) => `https://www.dickssportinggoods.com/search/SearchDisplay?searchTerm=${encodeURIComponent(t)}` },
];

export function getRetailer(id: string): RetailerInfo | undefined {
  return KNOWN_RETAILERS.find((r) => r.id === id);
}

export interface GearQuery {
  /** Search term, e.g. "Strike King spinnerbait 3/8 oz chartreuse". */
  term: string;
  /** Optional coarse category hint: 'lure' | 'line' | 'terminal' | 'bait' ... */
  category?: string;
}

export type OfferType = 'retailer-search' | 'verified-product';

export interface GearOffer {
  productName: string;
  retailerId: string;
  retailer: string;
  /**
   * 'retailer-search' — `url` is a search results page, `price` is null.
   * 'verified-product' — `url` is a product page, `price` came from a real
   *   retailer API (still may be null if that API didn't return one).
   */
  offerType: OfferType;
  /** Display string ("$5.97"); null unless a priced API supplied it. */
  price: string | null;
  /** true only when `price` is a rough guide from a non-authoritative source. */
  priceIsEstimate: boolean;
  imageUrl: string | null;
  /** 'in_stock' | 'limited' | 'out_of_stock' | null. */
  availability: string | null;
  url: string;
}

export interface GearItemResult {
  query: GearQuery;
  offers: GearOffer[];
  /**
   * Cheap / mid / pricey RELATIVE to the other items in the same request.
   * Only set when ≥3 items in the request carry a verified price — otherwise
   * null (we don't rank on data we don't have).
   */
  relativeCost: 'low' | 'mid' | 'high' | null;
  /** Human note, e.g. why there are only search links. */
  note?: string;
}

export interface RetailProvider {
  readonly id: string;
  readonly label: string;
  /** False when required config (API base / key) is missing. */
  isConfigured(): boolean;
  /** Return one GearItemResult per query. Throw on failure. */
  search(queries: GearQuery[]): Promise<GearItemResult[]>;
}
