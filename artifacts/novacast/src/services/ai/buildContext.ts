// Assembles a FishingContext from the pieces the app already holds, so callers
// (Game Plan, On the Bank) don't hand-build the wide object.

import type { LakeSnapshot } from '../lakeSnapshot';
import type { CatchRecord } from '../catchLog';
import type {
  FishingContext, CtxConditions, CtxObservations, CtxEnvironment, CtxCatch,
} from './types';

export interface BuildContextInput {
  snapshot: LakeSnapshot | null;
  /** Angler-entered condition enums (ConditionsPanel / wizard). */
  conditions: Partial<CtxConditions>;
  observations?: CtxObservations | null;
  tackle: string[];
  catches?: CatchRecord[];
  now?: Date;
}

function envFromSnapshot(s: LakeSnapshot): CtxEnvironment {
  const w = s.weather;
  return {
    weatherProvider: w.provider,
    observedAt: w.observedAt,
    airTempF: w.airTempF.value,
    waterTempF: w.waterTempF.value,
    windMph: w.windMph.value,
    windDir: w.windDir.value,
    pressureHpa: w.pressureHpa.value,
    pressureInHg: w.pressureInHg.value,
    pressureTrend: w.pressureTrend.value,
    cloudPct: w.cloudPct.value,
    conditionText: w.conditionText.value,
    sunriseISO: s.astro.sunriseISO,
    sunsetISO: s.astro.sunsetISO,
    isDaylight: s.astro.isDaylight,
    moonName: s.astro.moonName,
    moonFeedRating: s.astro.moonFeedRating,
    moonIlluminationPct: s.astro.moonIlluminationPct,
    seasonLabel: s.season.label,
    seasonNote: s.season.note,
    unavailable: s.unavailable,
  };
}

export function buildFishingContext(input: BuildContextInput): FishingContext {
  const now = input.now ?? new Date();
  const s = input.snapshot;

  const conditions: CtxConditions = {
    fish: input.conditions.fish ?? null,
    time: input.conditions.time ?? null,
    sky: input.conditions.sky ?? null,
    water: input.conditions.water ?? null,
    temp: input.conditions.temp ?? null,
    wind: input.conditions.wind ?? null,
    pressure: input.conditions.pressure ?? null,
    recentWeather: input.conditions.recentWeather ?? [],
  };

  const recent = (input.catches ?? [])
    .slice()
    .sort((a, b) => b.caughtAt.localeCompare(a.caughtAt))
    .slice(0, 12);
  const history = (input.catches && input.catches.length > 0)
    ? {
        totalCatches: input.catches.length,
        recentCatches: recent.map<CtxCatch>(c => ({
          species: c.species,
          lure: c.lure,
          waterName: c.waterName || null,
          caughtAt: c.caughtAt,
        })),
      }
    : null;

  const obs = input.observations && Object.values(input.observations).some(Boolean)
    ? input.observations
    : null;

  return {
    water: s
      ? {
          name: s.water.name,
          type: s.water.type,
          areaAcres: s.water.areaAcres,
          species: s.water.species,
          specialRegs: s.water.specialRegs,
          curated: !!s.water.curatedKey,
        }
      : { name: null, type: null, areaAcres: null, species: [], specialRegs: null, curated: false },
    environment: s ? envFromSnapshot(s) : null,
    conditions,
    observations: obs,
    tackle: input.tackle,
    history,
    at: now.toISOString(),
    month: now.getMonth(),
  };
}
