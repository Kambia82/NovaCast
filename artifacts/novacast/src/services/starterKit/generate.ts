// NovaCast-generated starter list (kit type #2). Pure + deterministic.

import { BASE_ITEMS, SPECIES_ITEMS, ENVIRONMENT_ITEMS, PLATFORM_ITEMS } from './data';
import type { GeneratedKit, KitBudget, KitItem, StarterKitCriteria } from './types';

const BUDGET_RANK: Record<KitBudget, number> = { minimal: 0, standard: 1, complete: 2 };

const SPECIES_LABEL: Record<StarterKitCriteria['species'], string> = {
  bass: 'bass', panfish: 'panfish (bluegill / crappie)', catfish: 'catfish',
  trout: 'trout', multi: 'a bit of everything',
};

function withinBudget(item: KitItem, budget: KitBudget): boolean {
  if (item.essential) return true;
  return BUDGET_RANK[item.minBudget] <= BUDGET_RANK[budget];
}

function dedupe(items: KitItem[]): KitItem[] {
  const seen = new Set<string>();
  const out: KitItem[] = [];
  for (const it of items) {
    const key = it.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

const CATEGORY_ORDER: KitItem['category'][] = [
  'safety', 'container', 'line', 'hooks', 'weights', 'floats', 'terminal',
  'soft-plastics', 'spinnerbait', 'chatterbait', 'hard-baits', 'topwater',
  'tools', 'platform',
];

export function generateStarterKit(criteria: StarterKitCriteria): GeneratedKit {
  const pool = [
    ...BASE_ITEMS,
    ...SPECIES_ITEMS[criteria.species],
    ...ENVIRONMENT_ITEMS[criteria.environment],
    ...PLATFORM_ITEMS[criteria.platform],
  ];

  const items = dedupe(pool.filter((it) => withinBudget(it, criteria.budget)))
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));

  const essentialCount = items.filter((i) => i.essential).length;
  const summary = criteria.budget === 'minimal'
    ? `${items.length} items — the essentials only (${essentialCount} must-haves).`
    : `${items.length} items — ${essentialCount} essentials plus ${items.length - essentialCount} "nice to have" for a ${criteria.budget} setup.`;

  return {
    kind: 'novacast-list',
    criteria,
    items,
    searchTerms: items.map((i) => i.name),
    summary,
    disclaimer:
      `This is NovaCast's own recommended list for a beginner targeting ${SPECIES_LABEL[criteria.species]} ` +
      `from a ${criteria.platform} on a ${criteria.environment}. Items are generic categories, not specific products — ` +
      `use the store links on each line to pick a brand in your price range. NovaCast does not sell anything.`,
  };
}
