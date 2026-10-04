// Starter Kit entry point. UI imports only from here.

import { generateStarterKit } from './generate';
import { proxyPreassembledProvider } from './preassembledProvider';
import type { PreassembledKit, StarterKitCriteria, StarterKitProvider } from './types';

export { generateStarterKit };
export type {
  StarterKitCriteria, GeneratedKit, PreassembledKit, KitItem, KitCategory,
  KitSpecies, KitEnvironment, KitPlatform, KitBudget, StarterKitProvider,
} from './types';

const KIT_PROVIDERS: StarterKitProvider[] = [proxyPreassembledProvider];

/** Choice lists for the builder UI. */
export const STARTER_KIT_OPTIONS = {
  species: [
    { value: 'bass', label: 'Bass' },
    { value: 'panfish', label: 'Bluegill / Crappie' },
    { value: 'catfish', label: 'Catfish' },
    { value: 'trout', label: 'Trout' },
    { value: 'multi', label: 'A bit of everything' },
  ],
  environment: [
    { value: 'pond', label: 'Pond' },
    { value: 'lake', label: 'Lake' },
    { value: 'river', label: 'River / creek' },
    { value: 'reservoir', label: 'Big reservoir' },
  ],
  platform: [
    { value: 'bank', label: 'Bank / wading' },
    { value: 'kayak', label: 'Kayak' },
    { value: 'boat', label: 'Boat' },
  ],
  budget: [
    { value: 'minimal', label: 'Bare minimum' },
    { value: 'standard', label: 'Standard' },
    { value: 'complete', label: 'Complete' },
  ],
} as const;

export function preassembledKitsAvailable(): boolean {
  return KIT_PROVIDERS.some((p) => p.isConfigured());
}

/** Real retailer bundles matching the criteria. [] until a kit API is configured. */
export async function getPreassembledKits(criteria: StarterKitCriteria): Promise<PreassembledKit[]> {
  const out: PreassembledKit[] = [];
  for (const provider of KIT_PROVIDERS) {
    if (!provider.isConfigured()) continue;
    try {
      out.push(...(await provider.listKits(criteria)));
    } catch (err) {
      console.warn(`[novacast/starterKit] provider "${provider.id}" failed:`, err);
    }
  }
  return out;
}
