// Lake Snapshot — the coherent condition model for the selected waterbody
// (blueprint §7–9). One normalized object that Recon, Game Plan, the fishing
// intelligence layer, the Catch Log and (later) On the Bank all read from, so
// they agree on what is known and what is not.
//
// Hard rule: a field is either a real value with a named source, or it is
// explicitly `available: false`. Nothing here is ever guessed.

import type { TimeOfDay } from '../../lib/astro';

export interface Field<T> {
  value: T | null;
  /** Where this came from: 'openweathermap', 'you', 'computed', 'curated', ... */
  source: string | null;
  available: boolean;
}

export function known<T>(value: T, source: string): Field<T> {
  return { value, source, available: true };
}
export function unknown<T>(): Field<T> {
  return { value: null, source: null, available: false };
}

export type SkyEnum = 'sunny' | 'partly' | 'overcast' | 'rainy';
export type TempEnum = 'cold' | 'cool' | 'warm';
export type WindEnum = 'calm' | 'light' | 'strong';
// 'falling'/'rising' are true TRENDS — only ever legitimate as the angler's own
// self-reported observation (ConditionsPanel), never auto-derived from a single
// reading. Auto-derivation from a raw reading is limited to 'steady_low' /
// 'steady_high' (an absolute LEVEL, not a trend claim). See LakeWeather.pressureTrend.
export type PressureEnum = 'steady_low' | 'falling' | 'rising' | 'steady_high';

export interface LakeWaterFacts {
  name: string | null;
  type: string | null;
  areaAcres: number | null;
  curatedKey: string | null;
  lat: number | null;
  lon: number | null;
  species: string[];
  specialRegs: string | null;
  /** 'curated' when in NovaCast's waters DB, else 'osm' | '3dhp' | 'manual'. */
  source: string;
}

export interface LakeWeather {
  observedAt: string | null;
  provider: string | null;
  place: string | null;
  airTempF: Field<number>;
  waterTempF: Field<number>;
  cloudPct: Field<number>;
  humidityPct: Field<number>;
  windMph: Field<number>;
  windDir: Field<string>;
  /** Raw provider reading, hPa (SI — the unit OpenWeather returns). */
  pressureHpa: Field<number>;
  /** Same reading converted to inHg (US-friendly display unit). Available
   *  exactly when pressureHpa is — a unit conversion, not a new measurement. */
  pressureInHg: Field<number>;
  /**
   * True trend (is it actually rising or falling right now) needs two readings
   * over time; a single API call can never legitimately produce this, so it
   * stays unavailable unless/until NovaCast samples pressure repeatedly. Do
   * NOT infer this from one absolute reading — that's a fabricated trend, not
   * a derived one. `derived.pressure` below may still carry a *level*
   * (steady_low/steady_high) computed from the single reading, which is an
   * honest interpretation, not a trend claim.
   */
  pressureTrend: Field<'falling' | 'rising' | 'steady'>;
  conditionText: Field<string>;
}

export interface LakeAstro {
  sunriseISO: string | null;
  sunsetISO: string | null;
  isDaylight: boolean;
  moonName: string;
  moonFeedRating: number;
  /** 0-100, illuminated disc fraction — deterministic astronomy, always known. */
  moonIlluminationPct: number;
  /** Needs a fuller lunar ephemeris than this app implements — not computed. */
  moonriseISO: Field<string>;
  moonsetISO: Field<string>;
}

export interface LakeSeason {
  month: number;
  label: string;
  note: string;
}

/**
 * Conditions mapped into the enum vocabulary data/recommendations.ts and the
 * ConditionsPanel already use. null when we genuinely don't know — callers must
 * handle that, not substitute a default silently.
 */
export interface LakeDerived {
  timeOfDay: TimeOfDay | null;
  sky: SkyEnum | null;
  temp: TempEnum | null;
  wind: WindEnum | null;
  pressure: PressureEnum | null;
}

export interface LakeSnapshot {
  water: LakeWaterFacts;
  weather: LakeWeather;
  astro: LakeAstro;
  season: LakeSeason;
  derived: LakeDerived;
  /** Human-readable list of what we could not determine. */
  unavailable: string[];
  builtAt: string;
}
