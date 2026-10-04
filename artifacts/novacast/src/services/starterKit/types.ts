// Beginner Tacklebox / Starter Kit architecture.
//
// Flow the blueprint anticipates:
//   BEGINNER -> target species -> environment -> bank/kayak/boat -> budget
//            -> RECOMMENDED STARTER KIT
//
// NovaCast distinguishes THREE things and must not blur them:
//   1. PreassembledKit  — a real kit a retailer sells (needs a retailer API).
//   2. GeneratedKit     — NovaCast's own recommended shopping LIST of generic
//                         tackle categories (no brands, no prices invented).
//   3. Individual products — resolved per line item via the retail abstraction
//                         (services/retail `getGearOffers`).
//
// Only #2 is fully supportable today. #1 has an interface + a disabled provider.

export type KitSpecies = 'bass' | 'panfish' | 'catfish' | 'trout' | 'multi';
export type KitEnvironment = 'pond' | 'lake' | 'river' | 'reservoir';
export type KitPlatform = 'bank' | 'kayak' | 'boat';
export type KitBudget = 'minimal' | 'standard' | 'complete';

export interface StarterKitCriteria {
  species: KitSpecies;
  environment: KitEnvironment;
  platform: KitPlatform;
  budget: KitBudget;
}

export type KitCategory =
  | 'container'
  | 'line'
  | 'terminal'
  | 'hooks'
  | 'weights'
  | 'floats'
  | 'soft-plastics'
  | 'hard-baits'
  | 'spinnerbait'
  | 'chatterbait'
  | 'topwater'
  | 'tools'
  | 'safety'
  | 'platform';

export interface KitItem {
  category: KitCategory;
  /** Generic descriptor, e.g. "3/0 EWG worm hooks (5-pack)". Never a fabricated
   *  brand+SKU. */
  name: string;
  qty: string;
  why: string;
  /** Essentials are always included; non-essentials only at higher budgets. */
  essential: boolean;
  /** Minimum budget tier that includes this item. */
  minBudget: KitBudget;
}

export interface GeneratedKit {
  kind: 'novacast-list';
  criteria: StarterKitCriteria;
  items: KitItem[];
  /** Feed these into retail `getGearOffers()` to attach retailer links/prices. */
  searchTerms: string[];
  /** Coarse count summary — NOT a price. */
  summary: string;
  disclaimer: string;
}

export interface PreassembledKit {
  kind: 'retail-kit';
  id: string;
  retailerId: string;
  retailer: string;
  title: string;
  url: string;
  /** Short contents blurb straight from the retailer feed. */
  contents: string;
  priceStatus: 'verified' | 'unavailable';
  price: string | null;
  /** Which provider/feed supplied this. */
  source: string;
}

export interface StarterKitProvider {
  readonly id: string;
  readonly label: string;
  isConfigured(): boolean;
  /** Preassembled kits a retailer actually sells that match the criteria. */
  listKits(criteria: StarterKitCriteria): Promise<PreassembledKit[]>;
}
