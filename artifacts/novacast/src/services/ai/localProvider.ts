// Local, deterministic fishing-intelligence provider.
//
// Grounded entirely in the pure functions in `data/recommendations.ts` plus the
// context the app already has — it never invents a lake fact, a weather value,
// or a regulation. This is the always-available fallback and, until a hosted
// model is configured, the default. It composes the individual recommendation
// outputs into the single narrative "Read" the blueprint asks for (§1, §10, §18)
// and folds in the environmental snapshot, the angler's observations, and their
// own catch history when those are present.

import {
  getFishMovement,
  applyRecentWeatherToDepth,
  getBarometricImpact,
  getLures,
  getColors,
  getGeneralBestRecommendation,
  type Lure,
} from '../../data/recommendations';
import type {
  FishingContext,
  FishingInsight,
  FishingIntelligenceProvider,
  InsightTechnique,
  CtxConditions,
} from './types';

const TIME_LABEL: Record<string, string> = {
  night: 'after dark', dawn: 'at first light', morning: 'this morning',
  midday: 'through midday', afternoon: 'this afternoon', evening: 'this evening',
};
const WATER_LABEL: Record<string, string> = {
  clear: 'clear water', stained: 'stained water', murky: 'murky water', green: 'algae-green water',
};

// Fill missing condition enums from raw environmental numbers so the provider is
// robust no matter how complete the caller's `conditions` object is.
function mergeConditions(ctx: FishingContext): CtxConditions {
  const c = { ...ctx.conditions };
  const env = ctx.environment;
  if (env) {
    if (!c.temp && env.airTempF != null) c.temp = env.airTempF < 45 ? 'cold' : env.airTempF < 60 ? 'cool' : 'warm';
    if (!c.wind && env.windMph != null) c.wind = env.windMph <= 5 ? 'calm' : env.windMph <= 14 ? 'light' : 'strong';
    // A single reading only ever tells you the LEVEL (vs. the ~1013 hPa
    // baseline) — never 'falling'/'rising' here, that's a fabricated trend
    // without a second reading over time. True trend (env.pressureTrend)
    // stays honestly unavailable unless the angler reported it themselves.
    if (!c.pressure && env.pressureHpa != null) c.pressure = env.pressureHpa < 1013 ? 'steady_low' : 'steady_high';
    if (!c.sky && env.cloudPct != null) {
      const t = (env.conditionText || '').toLowerCase();
      c.sky = /thunder|storm|rain|drizzle/.test(t) ? 'rainy' : env.cloudPct >= 80 ? 'overcast' : env.cloudPct >= 30 ? 'partly' : 'sunny';
    }
    if (!c.time && env.isDaylight === false) c.time = 'night';
  }
  return c;
}

function depthStrategyText(depthPct: number, hasStructureHint: boolean): string {
  if (depthPct <= 25) {
    return `Fish are shallow (roughly 1–5 ft). Work the bank, cover, and the first drop — ${
      hasStructureHint ? 'hit visible structure first' : 'anything breaking up the shoreline'
    }. You do not need to reach deep water right now.`;
  }
  if (depthPct <= 55) {
    return 'Fish are holding mid-depth (about 5–10 ft). Target transitions — points, channel swings, the outside edge of weed lines and docks where shallow meets deep.';
  }
  return 'Fish have pulled deep (10 ft+) or tucked tight to shade. Fish the deepest nearby structure, keep the bait on or near bottom, and slow everything down.';
}

function toTechnique(l: Lure, ownedSet: Set<string>): InsightTechnique {
  return {
    lure: l.name,
    presentation: l.technique || l.reason,
    why: l.talkingPoint || l.reason,
    owned: ownedSet.has(l.name),
  };
}

export const localProvider: FishingIntelligenceProvider = {
  id: 'local',
  isConfigured: () => true,
  async getInsight(ctx: FishingContext): Promise<FishingInsight> {
    const c = mergeConditions(ctx);
    const { tackle, month } = ctx;
    const env = ctx.environment;
    const ownedSet = new Set(tackle);
    const fish = c.fish || 'anything';
    const known = [c.sky, c.water, c.temp, c.wind, c.pressure].filter(Boolean).length;
    const confidence: FishingInsight['confidence'] = known >= 3 ? 'high' : known >= 1 ? 'medium' : 'low';

    // Depth / movement — same math the Game Plan card uses.
    let mv = getFishMovement(c.time || 'morning', c.sky || 'partly');
    mv = applyRecentWeatherToDepth(mv, c.recentWeather);
    const baro = c.pressure ? getBarometricImpact(c.pressure) : null;
    if (baro) mv = { ...mv, depthPct: Math.max(5, Math.min(95, mv.depthPct + baro.depthAdj)) };

    // Lures — condition-driven when we have conditions, else seasonal best.
    let lures: Lure[];
    if (known === 0) {
      lures = getGeneralBestRecommendation(month).lures;
    } else {
      lures = getLures(
        c.sky || 'partly', c.water || 'stained', c.temp || 'cool',
        fish, c.time || 'morning', c.pressure || undefined,
      );
    }
    const techniques = lures.slice(0, 3).map(l => toTechnique(l, ownedSet));

    const colors = getColors(c.sky || 'partly', c.water || 'stained', c.time || 'morning');
    const waterName = ctx.water.name || 'this water';
    const timePhrase = c.time ? TIME_LABEL[c.time] || 'today' : 'today';
    const clarityPhrase = c.water ? WATER_LABEL[c.water] || 'the current water color' : null;

    const summaryParts: string[] = [];
    summaryParts.push(
      `${mv.title.replace(/ —.*/, '')} — at ${waterName} ${timePhrase}, ${
        fish === 'anything' ? 'fish' : fish
      } are ${mv.depthPct <= 30 ? 'up shallow and catchable' : mv.depthPct <= 55 ? 'on mid-depth structure' : 'deep or in heavy shade'}.`,
    );
    if (clarityPhrase) {
      summaryParts.push(
        `With ${clarityPhrase}, lean on ${colors.colors.slice(0, 2).map(x => x.name).join(' and ')} — ${colors.reason.toLowerCase()}`,
      );
    }
    if (baro) summaryParts.push(baro.text);
    if (env) {
      if (env.moonFeedRating >= 4) summaryParts.push(`${env.moonName} — feeding activity runs high around dawn and dusk today.`);
      if (env.seasonNote) summaryParts.push(env.seasonNote);
    }
    if (known === 0) {
      summaryParts.push(
        "You haven't set any conditions, so this is the seasonal best-bet. Set sky, water color and pressure for a sharper read.",
      );
    }

    // Angler's own history at this water.
    const historyLine = buildHistoryLine(ctx);
    if (historyLine) summaryParts.push(historyLine);

    const adjustments: string[] = [];
    adjustments.push(
      techniques.length > 1
        ? `No takers in 15–20 casts? Switch from the ${techniques[0].lure} to the ${techniques[1].lure} and change your retrieve speed before you change spots.`
        : 'No takers in 15–20 casts? Change retrieve speed and cadence before you change lures, then move.',
    );
    if ((c.water === 'murky' || c.water === 'stained')) {
      adjustments.push('If a moving bait keeps fouling on algae or debris, slow down, raise your rod tip, or drop to a single-hook presentation you can keep cleaner.');
    }
    if (c.wind === 'strong') {
      adjustments.push('Wind pushing you around: fish the wind-blown bank and cast into it — bait piles up there — rather than fighting for the calm side.');
    }
    // Observations from the bank (blueprint §10).
    const obs = ctx.observations;
    if (obs) {
      if (obs.vegetation && /heavy|thick|matted/i.test(obs.vegetation)) {
        adjustments.push('Heavy vegetation reported: go weedless — Texas rig, a hollow-body frog over the top, or a bladed jig you can rip free — and skip open trebles here.');
      }
      if (obs.baitActivity && /none|no bait|dead/i.test(obs.baitActivity)) {
        adjustments.push('No bait activity where you are: move to wind-blown banks, points, or inflows where forage concentrates before working an area hard.');
      }
      if (obs.fishActivity && /surfac|schooling|busting|chasing/i.test(obs.fishActivity)) {
        adjustments.push('Fish are active up top — get a moving bait (lipless, spinnerbait, topwater) to the edge of the activity fast; the window is short.');
      }
      if (obs.clarity && /muddy|stain|dirty/i.test(obs.clarity)) {
        adjustments.push('Water looks dirtier than expected: upsize the profile, add rattle/vibration, and switch to chartreuse or black/blue.');
      }
    }
    adjustments.push('When you catch one, throw right back to the same spot two or three times — fish stack, and the commotion can turn the others on.');

    return {
      summary: summaryParts.join(' '),
      techniques,
      depthStrategy: depthStrategyText(mv.depthPct, ctx.water.curated),
      adjustments,
      provider: 'NovaCast (on-device)',
      confidence,
    };
  },
};

function buildHistoryLine(ctx: FishingContext): string | null {
  const h = ctx.history;
  if (!h || h.recentCatches.length === 0) return null;
  const here = ctx.water.name
    ? h.recentCatches.filter(c => c.waterName && c.waterName.toLowerCase() === ctx.water.name!.toLowerCase())
    : [];
  const pool = here.length ? here : h.recentCatches;
  const lureCounts = new Map<string, number>();
  for (const c of pool) {
    if (c.lure) lureCounts.set(c.lure, (lureCounts.get(c.lure) || 0) + 1);
  }
  if (lureCounts.size === 0) return null;
  const [topLure, n] = [...lureCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const scope = here.length ? `here` : `recently`;
  return `Your log: the ${topLure} has produced ${n === 1 ? 'a fish' : n + ' fish'} ${scope} — worth a few casts before anything else.`;
}
