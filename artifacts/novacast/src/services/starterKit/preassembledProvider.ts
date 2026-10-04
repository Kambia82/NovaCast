// Preassembled retail kit provider (kit type #1) — interface implemented,
// integration not wired.
//
// Some retailers (Amazon especially) sell real "beginner bass kit" bundles. To
// surface those legitimately NovaCast needs a product API (Amazon PA-API via a
// NovaCast-owned proxy, a Walmart feed, an affiliate catalog) — none of which
// exists yet. Until then this reports `isConfigured() === false` and
// `getPreassembledKits()` returns []. NovaCast still shows its own generated
// list plus per-item store links.
//
//   VITE_STARTER_KIT_API_BASE - https URL of a proxy returning
//     { kits: PreassembledKit[] } for a criteria query. Absent => disabled.
//
// No scraping of retailer sites.

import type { PreassembledKit, StarterKitCriteria, StarterKitProvider } from './types';

const API_BASE = import.meta.env.VITE_STARTER_KIT_API_BASE as string | undefined;

export const proxyPreassembledProvider: StarterKitProvider = {
  id: 'preassembled-proxy',
  label: 'Retailer starter kits',
  isConfigured: () => typeof API_BASE === 'string' && /^https:\/\//.test(API_BASE),
  async listKits(criteria: StarterKitCriteria): Promise<PreassembledKit[]> {
    if (!this.isConfigured()) throw new Error('Preassembled-kit API not configured (VITE_STARTER_KIT_API_BASE)');
    const res = await fetch(`${API_BASE}/starter-kits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ criteria }),
    });
    if (!res.ok) throw new Error(`Preassembled-kit API error ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data?.kits)) throw new Error('Preassembled-kit API returned an unexpected shape');
    return (data.kits as any[]).map((k) => ({
      kind: 'retail-kit' as const,
      id: String(k?.id ?? ''),
      retailerId: String(k?.retailerId ?? ''),
      retailer: String(k?.retailer ?? ''),
      title: String(k?.title ?? 'Beginner kit'),
      url: String(k?.url ?? ''),
      contents: String(k?.contents ?? ''),
      priceStatus: k?.price != null ? 'verified' : 'unavailable',
      price: k?.price != null ? String(k.price) : null,
      source: String(k?.source ?? 'retailer feed'),
    }));
  },
};
