// Builds a LakeSnapshot for a selected waterbody.
//
// Weather comes from OpenWeatherMap when a key + coordinates are available;
// otherwise the weather block is all `unavailable` and callers fall back to
// whatever the angler entered by hand. Astro + season are computed locally.
// Explicit user-entered conditions always win over a fetched value (source
// becomes 'you').

import { getSunTimes, getMoonPhase, getTimeOfDay } from '../../lib/astro';
import { hpaToInHg } from '../../lib/units';
import {
  known, unknown,
  type LakeSnapshot, type LakeWaterFacts, type LakeWeather, type LakeDerived,
  type SkyEnum, type TempEnum, type WindEnum, type PressureEnum,
} from './types';

export interface UserConditions {
  time?: string | null;
  sky?: string | null;
  temp?: string | null;
  wind?: string | null;
  pressure?: string | null;
}

export interface BuildSnapshotInput {
  water: LakeWaterFacts;
  now?: Date;
  /** OpenWeatherMap key; when absent the weather block stays unavailable. */
  weatherApiKey?: string;
  /** Skip the network call and use only these (e.g. offline / tests). */
  userConditions?: UserConditions;
  fetchImpl?: typeof fetch;
}

const MONTH_LABEL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function seasonNote(month: number): string {
  if (month >= 2 && month <= 4) return 'Pre-spawn / spawn — fish moving shallow, aggressive and territorial.';
  if (month === 5) return 'Post-spawn — recovering fish, strong topwater window early and late.';
  if (month >= 6 && month <= 8) return 'Summer — deep midday, shallow at dawn/dusk, oxygen and shade matter.';
  if (month >= 9 && month <= 10) return 'Fall feed — fish chasing baitfish, best reaction-bait season.';
  return 'Winter — slow and deep, finesse presentations, patience.';
}

function degToCompass(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function skyFromOwm(weatherId: number, cloudPct: number): SkyEnum {
  if (weatherId >= 200 && weatherId < 600) return 'rainy';
  if (weatherId >= 600 && weatherId < 700) return 'overcast'; // snow
  if (cloudPct >= 80) return 'overcast';
  if (cloudPct >= 30) return 'partly';
  return 'sunny';
}
function tempEnum(f: number): TempEnum {
  return f < 45 ? 'cold' : f < 60 ? 'cool' : 'warm';
}
function windEnum(mph: number): WindEnum {
  return mph <= 5 ? 'calm' : mph <= 14 ? 'light' : 'strong';
}
// A single reading only ever tells you the LEVEL (low/high vs. the ~1013 hPa
// baseline), never a trend — that needs two readings over time. Never returns
// 'falling'/'rising' here; those are reserved for the angler's own report.
function pressureLevelEnum(hpa: number): PressureEnum {
  return hpa < 1013 ? 'steady_low' : 'steady_high';
}

function emptyWeather(): LakeWeather {
  return {
    observedAt: null, provider: null, place: null,
    airTempF: unknown(), waterTempF: unknown(), cloudPct: unknown(),
    humidityPct: unknown(), windMph: unknown(), windDir: unknown(),
    pressureHpa: unknown(), pressureInHg: unknown(), pressureTrend: unknown(),
    conditionText: unknown(),
  };
}

async function fetchOwm(
  lat: number, lon: number, key: string, fetchImpl: typeof fetch,
): Promise<LakeWeather | null> {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=imperial`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetchImpl(url, { signal: controller.signal });
    const data: any = await res.json();
    if (String(data?.cod) !== '200') return null;

    const w = emptyWeather();
    w.provider = 'openweathermap';
    w.observedAt = new Date((data.dt ?? Date.now() / 1000) * 1000).toISOString();
    w.place = data.name || null;
    if (typeof data.main?.temp === 'number') w.airTempF = known(Math.round(data.main.temp), 'openweathermap');
    if (typeof data.clouds?.all === 'number') w.cloudPct = known(data.clouds.all, 'openweathermap');
    if (typeof data.main?.humidity === 'number') w.humidityPct = known(data.main.humidity, 'openweathermap');
    if (typeof data.wind?.speed === 'number') w.windMph = known(Math.round(data.wind.speed), 'openweathermap');
    if (typeof data.wind?.deg === 'number') w.windDir = known(degToCompass(data.wind.deg), 'openweathermap');
    if (typeof data.main?.pressure === 'number') {
      w.pressureHpa = known(data.main.pressure, 'openweathermap');
      w.pressureInHg = known(hpaToInHg(data.main.pressure), 'openweathermap');
    }
    if (data.weather?.[0]?.description) w.conditionText = known(String(data.weather[0].description), 'openweathermap');
    // pressureTrend + waterTempF stay unavailable — the free endpoint has neither.
    return w;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function buildLakeSnapshot(input: BuildSnapshotInput): Promise<LakeSnapshot> {
  const now = input.now ?? new Date();
  const fetchImpl = input.fetchImpl ?? (typeof fetch !== 'undefined' ? fetch : undefined as any);
  const { water } = input;

  // ── Weather ────────────────────────────────────────────────────────
  let weather = emptyWeather();
  if (water.lat != null && water.lon != null && input.weatherApiKey && fetchImpl) {
    const fetched = await fetchOwm(water.lat, water.lon, input.weatherApiKey, fetchImpl);
    if (fetched) weather = fetched;
  }

  // ── Astro (computed) ───────────────────────────────────────────────
  const sun = water.lat != null && water.lon != null
    ? getSunTimes(water.lat, water.lon, now)
    : undefined;
  const moon = getMoonPhase(now);
  const astro = {
    sunriseISO: sun?.sunrise ? sun.sunrise.toISOString() : null,
    sunsetISO: sun?.sunset ? sun.sunset.toISOString() : null,
    isDaylight: sun?.isDaylight ?? false,
    moonName: moon.name,
    moonFeedRating: moon.feedRating,
    moonIlluminationPct: moon.illuminationPct,
    // Moonrise/set need a fuller lunar ephemeris than lib/astro.ts implements —
    // left explicitly unavailable rather than guessed.
    moonriseISO: unknown<string>(),
    moonsetISO: unknown<string>(),
  };

  // ── Season (computed) ──────────────────────────────────────────────
  const month = now.getMonth();
  const season = { month, label: MONTH_LABEL[month], note: seasonNote(month) };

  // ── Derived enums — user override wins, then fetched weather ───────
  const uc = input.userConditions ?? {};
  const derived: LakeDerived = {
    timeOfDay: (uc.time as any) || getTimeOfDay(now, sun),
    sky: (uc.sky as SkyEnum) || null,
    temp: (uc.temp as TempEnum) || null,
    wind: (uc.wind as WindEnum) || null,
    pressure: (uc.pressure as PressureEnum) || null,
  };
  if (!derived.sky && weather.conditionText.available && weather.cloudPct.available) {
    // Reconstruct an id-free sky guess from description + clouds.
    const txt = (weather.conditionText.value || '').toLowerCase();
    const id = /thunder|storm|drizzle|rain/.test(txt) ? 300 : /snow/.test(txt) ? 600 : 800;
    derived.sky = skyFromOwm(id, weather.cloudPct.value as number);
  }
  if (!derived.temp && weather.airTempF.available) derived.temp = tempEnum(weather.airTempF.value as number);
  if (!derived.wind && weather.windMph.available) derived.wind = windEnum(weather.windMph.value as number);
  if (!derived.pressure && weather.pressureHpa.available) derived.pressure = pressureLevelEnum(weather.pressureHpa.value as number);

  // Tag user-sourced overrides for transparency.
  const userTag = (k: keyof typeof uc) => (uc[k] ? 'you' : null);
  if (uc.sky) weather.conditionText = { ...weather.conditionText, source: weather.conditionText.source ?? userTag('sky') };

  // ── What's missing ─────────────────────────────────────────────────
  const unavailable: string[] = [];
  if (!weather.provider) unavailable.push('Live weather (no key or location, or the request failed)');
  if (!weather.waterTempF.available) unavailable.push('Water temperature');
  if (!weather.pressureTrend.available) unavailable.push('Barometric trend (rising/falling over time — needs repeated readings)');
  if (!astro.moonriseISO.available) unavailable.push('Moonrise / moonset time');
  unavailable.push('Water clarity / color / level', 'Depth & bathymetry', 'Forage / bait activity');
  if (!water.curatedKey) unavailable.push('Verified species & regulations (not in NovaCast\'s database)');

  return { water, weather, astro, season, derived, unavailable, builtAt: now.toISOString() };
}
