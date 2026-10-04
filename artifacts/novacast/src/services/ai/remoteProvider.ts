// Hosted fishing-intelligence provider (optional).
//
// Deliberately provider-agnostic: it POSTs the NovaCast `FishingContext` to a
// single configurable HTTPS endpoint and expects a `FishingInsight`-shaped JSON
// body back. That endpoint is where an LLM (Claude, or anything else) gets
// wired in — server-side, so no model key ever ships in the client bundle
// (directive §5: "Never fabricate API credentials", "do not hard-code").
//
// Configuration (Vite env, all optional):
//   VITE_AI_ENDPOINT   - full URL of the insight endpoint. Absent => disabled.
//   VITE_AI_MODEL      - opaque model hint forwarded to the endpoint.
//   VITE_AI_TIMEOUT_MS - request timeout, default 12000.
//
// Any failure throws; `getFishingIntelligence()` then falls back to local.

import type {
  FishingContext,
  FishingInsight,
  FishingIntelligenceProvider,
  InsightTechnique,
} from './types';

const ENDPOINT = import.meta.env.VITE_AI_ENDPOINT as string | undefined;
const MODEL = import.meta.env.VITE_AI_MODEL as string | undefined;
const TIMEOUT_MS = Number(import.meta.env.VITE_AI_TIMEOUT_MS) || 12000;

function coerceInsight(raw: any): FishingInsight {
  const techniques: InsightTechnique[] = Array.isArray(raw?.techniques)
    ? raw.techniques.map((t: any) => ({
        lure: String(t?.lure ?? '').trim() || 'Unspecified',
        presentation: String(t?.presentation ?? '').trim(),
        why: String(t?.why ?? '').trim(),
        owned: !!t?.owned,
      }))
    : [];
  if (!raw?.summary || techniques.length === 0) {
    throw new Error('Insight endpoint returned an unusable payload');
  }
  return {
    summary: String(raw.summary).trim(),
    techniques,
    depthStrategy: String(raw?.depthStrategy ?? '').trim(),
    adjustments: Array.isArray(raw?.adjustments) ? raw.adjustments.map((s: any) => String(s)) : [],
    provider: String(raw?.provider ?? 'NovaCast Cloud'),
    confidence: raw?.confidence === 'high' || raw?.confidence === 'low' ? raw.confidence : 'medium',
  };
}

export const remoteProvider: FishingIntelligenceProvider = {
  id: 'novacast-cloud',
  isConfigured: () => typeof ENDPOINT === 'string' && /^https:\/\//.test(ENDPOINT),
  async getInsight(ctx: FishingContext): Promise<FishingInsight> {
    if (!this.isConfigured()) throw new Error('Remote insight endpoint not configured');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(ENDPOINT as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, context: ctx }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Insight endpoint error ${res.status}`);
      return coerceInsight(await res.json());
    } finally {
      clearTimeout(timer);
    }
  },
};
