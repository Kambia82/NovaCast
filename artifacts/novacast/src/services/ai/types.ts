// NovaCast fishing-intelligence contract.
//
// The seam the blueprint (§5 Tier 6, §11, §24) and the implementation directive
// require: the app asks for an *insight* given everything it knows, and the
// provider — a local rules engine today, a hosted model later — is an
// implementation detail behind `getFishingIntelligence()`. Nothing in the UI
// imports a provider directly.
//
// The context is deliberately wide so the same object can feed Game Plan, On
// the Bank, and a future model without another reshape: selected water, the
// environmental snapshot, angler-entered conditions, on-the-water observations,
// available tackle, and the angler's own catch history all travel together.

import type { TimeOfDay } from '../../lib/astro';

export interface CtxWater {
  name: string | null;
  type: string | null;
  areaAcres: number | null;
  species: string[];
  specialRegs: string | null;
  /** true when this water is in NovaCast's curated `waters` DB. */
  curated: boolean;
}

/** Flattened, provider-friendly view of the Lake Snapshot environmental model. */
export interface CtxEnvironment {
  weatherProvider: string | null;
  observedAt: string | null;
  airTempF: number | null;
  waterTempF: number | null;
  windMph: number | null;
  windDir: string | null;
  pressureHpa: number | null;
  /** Same reading in inHg (US-friendly unit) — a conversion, not a new value. */
  pressureInHg: number | null;
  /** Genuine trend (needs 2+ readings) — honestly null unless sampled over time. */
  pressureTrend: 'falling' | 'rising' | 'steady' | null;
  cloudPct: number | null;
  conditionText: string | null;
  sunriseISO: string | null;
  sunsetISO: string | null;
  isDaylight: boolean;
  moonName: string;
  moonFeedRating: number;
  /** 0-100, deterministic astronomy — always known regardless of weather API. */
  moonIlluminationPct: number;
  seasonLabel: string;
  seasonNote: string;
  /** What the environmental model could not determine. */
  unavailable: string[];
}

/** Angler-chosen / auto-filled condition enums. Any field may be null. */
export interface CtxConditions {
  fish: string | null;
  time: string | null;
  sky: string | null;
  water: string | null;
  temp: string | null;
  wind: string | null;
  pressure: string | null;
  recentWeather: string[];
}

/** Things only the angler standing on the bank can report (blueprint §10). */
export interface CtxObservations {
  clarity?: string | null;
  color?: string | null;
  vegetation?: string | null;
  cover?: string | null;
  baitActivity?: string | null;
  fishActivity?: string | null;
  notes?: string | null;
}

export interface CtxCatch {
  species: string;
  lure: string;
  waterName: string | null;
  caughtAt: string;
}

export interface CtxHistory {
  totalCatches: number;
  /** Most recent first, already trimmed to a useful window. */
  recentCatches: CtxCatch[];
}

export interface FishingContext {
  water: CtxWater;
  environment: CtxEnvironment | null;
  conditions: CtxConditions;
  observations: CtxObservations | null;
  tackle: string[];
  history: CtxHistory | null;
  /** ISO datetime the request is for. */
  at: string;
  /** 0-11, kept for the seasonal-best fallback path. */
  month: number;
}

export interface InsightTechnique {
  lure: string;
  presentation: string;
  why: string;
  owned: boolean;
}

export interface FishingInsight {
  summary: string;
  techniques: InsightTechnique[];
  depthStrategy: string;
  adjustments: string[];
  provider: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface FishingIntelligenceProvider {
  readonly id: string;
  isConfigured(): boolean;
  /** Throw on failure — the caller falls back to the local provider. */
  getInsight(ctx: FishingContext): Promise<FishingInsight>;
}

export type { TimeOfDay };
