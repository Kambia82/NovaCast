// Sun and moon math — fully computed from date + coordinates, no API.
//
// Used by the Lake Snapshot / environmental model. These are real, derivable
// facts (not fabricated conditions): given a location and a timestamp, sunrise,
// sunset and moon phase are deterministic.

export interface SunTimes {
  /** Local Date of sunrise, or null above/below the polar circles when the sun doesn't rise/set. */
  sunrise: Date | null;
  sunset: Date | null;
  /** True when `at` is between sunrise and sunset. */
  isDaylight: boolean;
}

const RAD = Math.PI / 180;

/**
 * NOAA sunrise/sunset approximation. Accurate to ~1 minute for mid-latitudes,
 * which is all the fishing model needs.
 */
export function getSunTimes(lat: number, lon: number, at: Date = new Date()): SunTimes {
  const dayMs = 86400000;
  const janFirst = Date.UTC(at.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()) - janFirst) / dayMs) + 1;

  // Fractional year (radians)
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (at.getUTCHours() - 12) / 24);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma)); // minutes
  const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma); // radians

  const zenith = 90.833 * RAD; // includes atmospheric refraction + solar disc
  const cosH = (Math.cos(zenith) - Math.sin(lat * RAD) * Math.sin(decl)) / (Math.cos(lat * RAD) * Math.cos(decl));

  const midnightUTC = Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate());
  let sunrise: Date | null = null;
  let sunset: Date | null = null;

  if (cosH >= -1 && cosH <= 1) {
    const ha = Math.acos(cosH) / RAD; // degrees
    // minutes from UTC midnight
    const sunriseMin = 720 - 4 * (lon + ha) - eqTime;
    const sunsetMin = 720 - 4 * (lon - ha) - eqTime;
    sunrise = new Date(midnightUTC + sunriseMin * 60000);
    sunset = new Date(midnightUTC + sunsetMin * 60000);
  }

  const isDaylight = !!(sunrise && sunset && at >= sunrise && at <= sunset);
  return { sunrise, sunset, isDaylight };
}

export interface MoonPhase {
  /** 0..1 through the synodic cycle (0 = new, 0.5 = full). */
  fraction: number;
  name: string;
  /** Rough feeding influence, 1 (low) .. 5 (peak). */
  feedRating: number;
  /** 0..100, illuminated disc fraction — standard cosine approximation, deterministic from `fraction`. */
  illuminationPct: number;
}

/** Conway-style moon phase from a Julian-day approximation. */
export function getMoonPhase(at: Date = new Date()): MoonPhase {
  const year = at.getUTCFullYear();
  const month = at.getUTCMonth() + 1;
  const day = at.getUTCDate();
  let jd: number;
  if (month < 3) {
    const y = year - 1;
    const m = month + 12;
    jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day - 1524.5;
  } else {
    jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day - 1524.5;
  }
  const raw = ((jd - 2451550.1) / 29.530588853) % 1;
  const fraction = raw < 0 ? raw + 1 : raw;

  // Standard cosine approximation for illuminated disc fraction — deterministic
  // from the synodic-cycle fraction, not a separate measurement.
  const illuminationPct = Math.round(((1 - Math.cos(2 * Math.PI * fraction)) / 2) * 100);

  const classified = (() => {
    if (fraction < 0.0625 || fraction >= 0.9375) return { name: 'New Moon', feedRating: 5 };
    if (fraction < 0.1875) return { name: 'Waxing Crescent', feedRating: 3 };
    if (fraction < 0.3125) return { name: 'First Quarter', feedRating: 3 };
    if (fraction < 0.4375) return { name: 'Waxing Gibbous', feedRating: 4 };
    if (fraction < 0.5625) return { name: 'Full Moon', feedRating: 5 };
    if (fraction < 0.6875) return { name: 'Waning Gibbous', feedRating: 4 };
    if (fraction < 0.8125) return { name: 'Last Quarter', feedRating: 3 };
    return { name: 'Waning Crescent', feedRating: 2 };
  })();

  return { fraction, illuminationPct, ...classified };
}

export type TimeOfDay = 'night' | 'dawn' | 'morning' | 'midday' | 'afternoon' | 'evening';

/**
 * Time-of-day bucket relative to actual sunrise/sunset when we have coordinates,
 * falling back to clock hours when we don't. Matches the vocabulary used by
 * data/recommendations.ts.
 */
export function getTimeOfDay(at: Date, sun?: SunTimes): TimeOfDay {
  const mins = at.getHours() * 60 + at.getMinutes();

  if (sun && sun.sunrise && sun.sunset) {
    const rise = sun.sunrise.getHours() * 60 + sun.sunrise.getMinutes();
    const set = sun.sunset.getHours() * 60 + sun.sunset.getMinutes();
    if (mins < rise - 60 || mins > set + 75) return 'night';
    if (mins < rise + 75) return 'dawn';
    if (mins > set - 75) return 'evening';
    if (mins < rise + 210) return 'morning';
    if (mins > set - 210) return 'afternoon';
    return 'midday';
  }

  const h = at.getHours();
  if (h < 5) return 'night';
  if (h < 8) return 'dawn';
  if (h < 11) return 'morning';
  if (h < 15) return 'midday';
  if (h < 18) return 'afternoon';
  if (h < 22) return 'evening';
  return 'night';
}
