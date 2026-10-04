// NovaCast reference / learning content — single typed source of truth.
//
// Blueprint §16–19: the learning system must be a maintainable content/data
// structure, NOT content hard-coded across unrelated UI components. Every
// category below is rendered generically by <NovaCastReferenceSection>. Add a
// new lesson by adding a `RefEntry` to a category, or a whole new subject by
// adding a `RefCategory` — no component changes required.
//
// Migration status: `troubleshooting`, `quick-connections`, `reading-water` and
// `live-bait` now live here and are the single source. `reels`, `knots`, `line`,
// `lures`, `rigs` still have their own rich renderers inside
// NovaCastReference.tsx and should be migrated into this shape next; see
// PLANNED_TOPICS for subjects not yet written at all.

export type RefBlock =
  | { kind: 'note'; title?: string; text: string; tone?: 'neutral' | 'warn' | 'good' }
  | { kind: 'list'; title?: string; items: string[] }
  | { kind: 'steps'; title?: string; steps: { text: string; why?: string }[] }
  | { kind: 'doDont'; dos: string[]; donts: string[] };

export interface RefEntry {
  id: string;
  title: string;
  /** One-line teaser shown collapsed. */
  summary?: string;
  blocks: RefBlock[];
}

export interface RefCategory {
  id: string;
  label: string;
  /** Emoji, kept out of `label` so hosts can style it separately. */
  icon: string;
  blurb?: string;
  entries: RefEntry[];
}

// ─────────────────────────────────────────────────────────────────────────────
// TROUBLESHOOTING (blueprint §19) — instructional, not a "what other anglers do"
// feed. Backlash content is the canonical version; NovaCastTacklebox's inline
// copy should be pointed here.
// ─────────────────────────────────────────────────────────────────────────────
export const TROUBLESHOOTING: RefCategory = {
  id: 'troubleshooting',
  label: 'Fixing Problems',
  icon: '🔧',
  blurb: "What to do when it goes wrong on the water. Stay calm — almost everything here is recoverable without cutting line.",
  entries: [
    {
      id: 'backlash',
      title: "Bird's Nest / Backlash",
      summary: 'The spool kept spinning after the lure slowed down. Fixable in under a minute.',
      blocks: [
        {
          kind: 'note',
          text: "A backlash happens on a baitcaster when the spool spins faster than line is leaving the rod — on the cast, or when the lure stops (hits the water, a tree, the wind). The loose loops pile up and catch. It is not a broken reel and you did not do anything unusual.",
        },
        {
          kind: 'steps',
          title: 'Clearing it',
          steps: [
            { text: 'Stop reeling immediately. Reeling against a backlash tightens the knot.', why: 'Tension is what turns loose loops into a locked jam.' },
            { text: 'Thumb the spool and pull the line straight off the front, past the pile, with steady light pressure.', why: 'This lets the buried loops stand up so you can see them.' },
            { text: 'Pick the standing loops out one at a time with your fingers. Work the closest one first.', why: 'Each freed loop releases tension on the next.' },
            { text: 'When it feels loose, reel slowly and watch the line lay back evenly. Re-thumb if it bunches.', why: 'A clean lay now prevents the next one.' },
          ],
        },
        {
          kind: 'doDont',
          dos: [
            'Set spool tension first: with the lure tied on, the lure should fall slowly when you press the thumb bar, and the spool should stop when the lure lands.',
            'Keep brakes (magnetic/centrifugal) high while you are learning; back them off as your thumb improves.',
            'Feather the spool with your thumb through the whole cast, and press down just before splashdown.',
            'Make smooth, lobbed casts — line speed, not arm strength, is what fills the spool.',
          ],
          donts: [
            "Don't yank hard on the main line — it drives the loops into a knot.",
            "Don't keep casting with the reel half-jammed hoping it works out.",
            "Don't panic-cut the line unless a loop is genuinely fused; most nests look worse than they are.",
          ],
        },
      ],
    },
    {
      id: 'snag',
      title: 'Snagged Lure',
      summary: 'Hung on the bottom or in cover. Change the angle before you pull harder.',
      blocks: [
        {
          kind: 'note',
          title: 'Bottom snag vs. cover snag',
          text: "A bottom snag feels dead and solid and usually won't move. A cover snag (wood, dock, weeds) often has a little give and may free with a shake. Work out which before deciding how hard to pull.",
        },
        {
          kind: 'steps',
          title: 'Getting it back',
          steps: [
            { text: 'Point the rod straight at the lure and pull with the reel, not the rod tip. Steady pressure, then release.', why: 'A low straight pull works the hook back the way it went in; a high rod-tip pull just buries it and risks the tip.' },
            { text: 'If it holds, move — walk down the bank or around the far side and pull from the opposite direction.', why: 'Most snags release from the angle opposite the one they caught on.' },
            { text: 'Try slack-line pops: throw a bow of slack, then snap it. The lure jumps backward.', why: 'The rebound can flip a treble or jig head off the branch.' },
            { text: 'Still stuck: wrap the line around a stick or a gloved hand (never bare) and pull steadily until it frees or breaks at the knot.', why: 'A gloved straight pull breaks at the weakest point predictably instead of snapping back at your face.' },
          ],
        },
        {
          kind: 'doDont',
          dos: ['Wear eye protection or turn your face away on the final hard pull.', 'Retie after any hard pull — the line above the knot is now weak.'],
          donts: ["Don't high-stick (rod bent past vertical toward you) — that is how rods break.", "Don't pull with the drag slipping; lock it down for the recovery pull only."],
        },
      ],
    },
    {
      id: 'bottom-fouling',
      title: 'Bottom Fouling (Algae / Debris)',
      summary: 'Every cast comes back with a salad on the hook.',
      blocks: [
        { kind: 'note', text: "If the lure keeps dragging back gunk, it is running too deep or too slow for this spot. The fish can't find a fouled bait, so this is worth fixing before you keep casting." },
        {
          kind: 'list',
          title: 'Adjustments, in order',
          items: [
            'Speed up the retrieve and keep the rod tip higher to lift the bait off the bottom.',
            'Switch to a lure that runs shallower, or a lighter weight so it sinks slower.',
            'Go weedless: Texas-rig the plastic, or use a bladed/single-hook bait instead of trebles.',
            'Move to a cleaner bottom — a hard spot, a point, a wind-blown bank where debris does not settle.',
          ],
        },
      ],
    },
    {
      id: 'line-problems',
      title: 'Line Problems — Twist, Fray, Knot Failure',
      summary: 'When to fix it and when to just cut and retie.',
      blocks: [
        {
          kind: 'list',
          title: 'Line twist (pigtails, loops forming at the rod tip)',
          items: [
            'Usually from a spinning reel: closing the bail by hand instead of with the handle, or reeling against the drag while a fish pulls.',
            'To remove it: cut off the lure, let 40–60 ft of bare line trail behind a slow-moving boat or in current for a minute, then reel back under light tension.',
            'Close the bail by hand from now on, and don\'t reel when the drag is slipping.',
          ],
        },
        {
          kind: 'list',
          title: 'Fray / nicks',
          items: [
            'Run the last few feet of line through your fingers after every fish and after fishing around rock or wood.',
            'If you feel roughness or see a nick, cut back past it and retie. A nicked line breaks at the nick, always at the worst moment.',
          ],
        },
        {
          kind: 'note',
          tone: 'warn',
          title: 'When to just retie',
          text: "Retie any time you feel a nick, after a hard snag pull, after a big fish, if a knot slipped once, or if the knot looks curled/pigtailed (a sign it failed or nearly did). A knot takes 20 seconds; a lost fish takes all day to get over.",
        },
      ],
    },
    {
      id: 'stuck-in-cover',
      title: 'Stuck in Heavy Cover',
      summary: 'Buried in a laydown, brush pile, or dock — troubleshoot before you break off.',
      blocks: [
        {
          kind: 'steps',
          steps: [
            { text: 'Stop pulling and go tight, not hard. Feel where it is caught.', why: 'Blind force wedges a hook deeper into wood.' },
            { text: 'Get the boat or yourself directly over or beside the snag and lift straight up with a gentle shake.', why: 'A vertical angle slides the hook out along the branch instead of levering it in.' },
            { text: 'Slack-line pop it from a couple of different angles.', why: 'The bait needs room to fall off the branch it is hung on.' },
            { text: 'If a fish buried you in the cover: keep steady pressure and let it tire rather than horsing it — many come back out the hole they went in.', why: 'Panic-reeling snaps line on the cover edge.' },
          ],
        },
        {
          kind: 'note',
          text: "If you fish heavy cover a lot, this is a tackle answer as well as a technique one: heavier line, a stouter rod, and weedless/single-hook baits mean fewer of these situations — but the recovery steps above are the same regardless of gear.",
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// QUICK-CHANGE CONNECTIONS (blueprint §17) — teach when it helps and when it
// doesn't, not "always use a swivel".
// ─────────────────────────────────────────────────────────────────────────────
export const QUICK_CONNECTIONS: RefCategory = {
  id: 'quick-connections',
  label: 'Snaps & Swivels',
  icon: '🔗',
  blurb: 'Hardware for changing lures fast — and where it quietly hurts your presentation.',
  entries: [
    {
      id: 'overview',
      title: 'Snap, Swivel, Snap Swivel, Direct Tie',
      blocks: [
        {
          kind: 'list',
          items: [
            'Direct tie (knot straight to the lure): the most sensitive and least visible connection. The default for most fishing.',
            'Snap: a small clip you tie on once, then clip lures on and off. Saves retying when you change hard baits often.',
            'Swivel: a rotating joint that stops line twist. Useful with baits that spin (inline spinners, some spoons) or a Carolina rig.',
            'Snap swivel: both in one. Convenient, but the bulkiest option and the most intrusive on action.',
          ],
        },
        {
          kind: 'doDont',
          dos: [
            'Use a snap with lipped crankbaits and jerkbaits — a loose connection lets them wobble freely, and you change them a lot.',
            'Use a swivel (or snap swivel) with inline spinners and anything that rotates, or you will twist your line badly within minutes.',
            'Match hardware size to the lure — the smallest that is rated above your line test.',
          ],
          donts: [
            "Don't put a snap or swivel on a finesse plastic, a jig, a topwater walking bait, or a drop shot — it kills the subtle action and adds visible hardware in clear water.",
            "Don't assume a swivel is always needed. Most presentations do not twist line; a swivel there is just something extra for a fish to look at.",
            "Don't buy the cheapest snaps — a snap that opens under load loses you the fish and the lure.",
          ],
        },
        {
          kind: 'note',
          text: "Rule of thumb: the more a lure depends on a tight, direct feel or a delicate action, the more you want a plain knot. The more a lure is a 'search bait' you swap constantly, the more a good snap earns its place.",
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// READING WATER — migrated from NovaCastTacklebox's inline `renderReadWater`.
// ─────────────────────────────────────────────────────────────────────────────
export const READING_WATER: RefCategory = {
  id: 'reading-water',
  label: 'Reading Water',
  icon: '💧',
  blurb: 'Where the fish are likely to be, before you make a cast.',
  entries: [
    {
      id: 'sun',
      title: "Where to Cast When It's Sunny",
      blocks: [
        {
          kind: 'note',
          text: 'Look for shade lines, docks, overhanging trees, bridge pilings, and deeper water edges. Fish avoid intense sunlight much like people avoid standing in a parking lot at noon. If you can find shade, you can often find fish.',
        },
      ],
    },
    {
      id: 'wind',
      title: 'Wind Strategy',
      blocks: [
        {
          kind: 'note',
          text: 'Wind pushes plankton and baitfish toward shore, and predator fish follow. Focus on wind-blown banks and points. Cast into, across, or along the windward shoreline whenever it is practical to do so.',
        },
      ],
    },
    {
      id: 'clarity',
      title: 'Water Clarity Rule',
      blocks: [
        { kind: 'list', title: 'Clear water', items: ['Natural bait colors', 'Smaller presentations', 'Quiet approaches', 'Less vibration and noise'] },
        { kind: 'list', title: 'Dirty / stained water', items: ['Bright colors and chartreuse', 'Black/blue contrast patterns', 'Rattles and vibration', 'Larger profile lures'] },
        {
          kind: 'note',
          tone: 'good',
          title: 'Quick rule',
          text: 'If fish cannot easily see your lure, help them find it with vibration, noise, silhouette, or bright color.',
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// LIVE BAIT — migrated from NovaCastTacklebox's inline `baitGroups`.
// ─────────────────────────────────────────────────────────────────────────────
export const LIVE_BAIT: RefCategory = {
  id: 'live-bait',
  label: 'Live Bait',
  icon: '🪱',
  blurb: 'How to hook the common baits so they stay on and stay lively.',
  entries: [
    {
      id: 'bass',
      title: 'Bass',
      blocks: [
        {
          kind: 'list',
          items: [
            'Minnows — hook through both lips for current, or behind the dorsal fin (avoid the spine) for a natural swim.',
            'Bluegill (where legal as bait) — hook behind the dorsal fin, keep it swimming.',
            'Crawfish — run the hook through the tail from bottom to top so it stays active.',
          ],
        },
      ],
    },
    {
      id: 'catfish',
      title: 'Catfish',
      blocks: [
        {
          kind: 'list',
          items: [
            'Nightcrawlers — thread several times onto the hook, leave a piece dangling.',
            'Cut bait (shad) — hook through a tough section near the head or tail so it survives the cast.',
            'Chicken liver — use a bait-holder hook and thread it through several times, or a small mesh bag.',
          ],
        },
      ],
    },
    {
      id: 'panfish',
      title: 'Panfish / Crappie',
      blocks: [
        {
          kind: 'list',
          items: [
            'Crickets — hook under the collar behind the head without crushing the body.',
            'Red worms — thread part of the worm on, leave the tail free to wiggle.',
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SEASONAL PATTERNS — mirrors the seasonal logic data/recommendations.ts and
// the wizard's spawn-stage calendar already use (same month bands, same
// claims), written out as an actual lesson instead of only living inside
// generated recommendation text.
// ─────────────────────────────────────────────────────────────────────────────
export const SEASONAL_PATTERNS: RefCategory = {
  id: 'seasonal',
  label: 'Seasonal Patterns',
  icon: '🍂',
  blurb: 'Where fish are and how they feed changes with the season — the same pattern NovaCast\'s recommendations are built on.',
  entries: [
    {
      id: 'spring',
      title: 'Spring — Pre-Spawn & Spawn',
      summary: 'Fish move shallow to spawn. Aggressive, territorial, predictable.',
      blocks: [
        { kind: 'note', text: 'As water warms into the 50s–60s°F, bass move from deep winter areas toward shallow spawning flats, feeding heavily to build energy (pre-spawn). Once water holds around 60–65°F+, they bed in 1–4 ft of water and turn territorial — they bite out of aggression toward anything near the bed, not hunger.' },
        { kind: 'list', title: 'What that means for you', items: ['Pre-spawn: reaction baits (spinnerbait, lipless crankbait) covering water fast.', 'Spawn: slow, weedless baits worked right through a visible bed — a Texas-rigged worm or a wacky Senko.', 'Crappie stack around brush and docks at the same time — small jigs shine.'] },
      ],
    },
    {
      id: 'summer',
      title: 'Summer',
      summary: 'Early and late are your windows; midday means deep or shade.',
      blocks: [
        { kind: 'note', text: 'Once the surface heats up, fish hold shallow only in low light (dawn/dusk) or move to deeper, cooler water and shaded cover during the heat of the day.' },
        { kind: 'list', items: ['Dawn/dusk: topwater and moving baits along the bank.', 'Midday: drop shot or a Carolina rig fished deep, or any bait worked in shade (under docks, overhanging trees).'] },
      ],
    },
    {
      id: 'fall',
      title: 'Fall — The Feed',
      summary: 'Bass chase baitfish aggressively before winter. The best reaction-bait season.',
      blocks: [
        { kind: 'note', text: 'Cooling water triggers a baitfish migration into coves and creek arms, and bass follow to feed heavily before winter. This is generally considered the most aggressive, most predictable feeding window of the year.' },
        { kind: 'list', items: ['Lipless crankbaits and spinnerbaits that imitate shad, covering water fast.', 'Follow the bait — where you see baitfish flipping on the surface, bass are usually close.'] },
      ],
    },
    {
      id: 'winter',
      title: 'Winter',
      summary: 'Slow and deep. Patience over power.',
      blocks: [
        { kind: 'note', text: 'Cold water slows a fish\'s metabolism dramatically. They group up in the deepest nearby water and won\'t chase — a fast retrieve just gets ignored.' },
        { kind: 'list', items: ['Football jig or a Carolina rig, dragged painfully slowly along the bottom.', 'A live minnow under a bobber, set deep near brush, remains one of the most reliable winter tactics.'] },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// WATER TEMPERATURE — the exact cold/cool/warm bands ConditionsPanel, the Lake
// Snapshot, and the lure-selection logic in data/recommendations.ts already
// use (45°F / 60°F), explained as a lesson.
// ─────────────────────────────────────────────────────────────────────────────
export const WATER_TEMPERATURE: RefCategory = {
  id: 'water-temperature',
  label: 'Water Temperature',
  icon: '🌡️',
  blurb: 'Temperature drives fish metabolism more than almost anything else NovaCast tracks.',
  entries: [
    {
      id: 'bands',
      title: 'Cold / Cool / Warm — what NovaCast means by each',
      blocks: [
        {
          kind: 'list',
          items: [
            'Cold (below 45°F air / low-40s water): fish are lethargic and grouped in the deepest nearby water. Slow way down — football jig, drop shot, live bait. A fast retrieve gets ignored.',
            'Cool (45–60°F): a transition zone. Fish are more willing to move than in cold water but still favor a slower, natural presentation. Crawfish-colored baits (browns, oranges) match this window well.',
            'Warm (60°F+): metabolism is up, fish chase and react. This is when reaction baits — spinnerbaits, chatterbaits, crankbaits, topwater — earn their keep.',
          ],
        },
        { kind: 'note', text: 'These are air-temperature bands NovaCast uses as a proxy when live water temperature isn\'t available (it usually isn\'t — see Lake Snapshot). Actual water temperature lags air temperature, especially in bigger, deeper water.' },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// WEATHER & PRESSURE — mirrors getBarometricImpact() in data/recommendations.ts
// (same four pressure states, same claims) as an actual lesson.
// ─────────────────────────────────────────────────────────────────────────────
export const WEATHER_CONDITIONS: RefCategory = {
  id: 'weather',
  label: 'Weather & Pressure',
  icon: '⛅',
  blurb: 'Sky and barometric pressure change how aggressively fish are willing to feed.',
  entries: [
    {
      id: 'sky',
      title: 'Sky Conditions',
      blocks: [
        {
          kind: 'list',
          items: [
            'Sunny / bright: fish tuck tight to shade and cover. Target docks, overhangs, and anything casting a shadow.',
            'Partly cloudy: a middle ground — fish roam a bit more than full sun but still relate to structure.',
            'Overcast: fish sit higher in the water column and roam more confidently. Prime topwater and moving-bait conditions.',
            'Rainy: often triggers active feeding, especially as rain begins. Runoff can also muddy water and concentrate fish along new current lines.',
          ],
        },
      ],
    },
    {
      id: 'pressure',
      title: 'Barometric Pressure',
      summary: 'The single biggest weather-driven feeding trigger NovaCast tracks.',
      blocks: [
        { kind: 'note', tone: 'good', title: 'Falling', text: 'A front is moving in. One of the best feeding triggers in fishing — fish sense the change and feed aggressively beforehand. Cover water fast with reaction baits; the window can close quickly once the front arrives.' },
        { kind: 'note', title: 'Low & steady', text: 'A front has settled in. Fish have adjusted and are often slightly shallower and less pressured by bright sun — generally good, steady conditions.' },
        { kind: 'note', tone: 'warn', title: 'Rising', text: 'The toughest condition in fishing. Right after a front passes, fish go lockjaw — tight to cover, unwilling to chase. Slow way down: finesse worms, drop shot, shaky head.' },
        { kind: 'note', title: 'High & steady', text: 'Clear, stable weather. Fish settle into predictable patterns but hold tight to structure — catchable, but you need to put the bait right on them.' },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// STRUCTURE & COVER — the physical things fish relate to, referenced throughout
// the app's spot recommendations (DEFAULT_SPOTS, getCustomSpots) but not
// previously taught as their own topic.
// ─────────────────────────────────────────────────────────────────────────────
export const STRUCTURE_COVER: RefCategory = {
  id: 'structure',
  label: 'Structure & Cover',
  icon: '🪵',
  blurb: 'Fish relate to physical things in the water — learn to spot them and you\'ll always have somewhere to cast.',
  entries: [
    {
      id: 'types',
      title: 'The structure that actually holds fish',
      blocks: [
        {
          kind: 'list',
          items: [
            'Docks — shade, cover, and often the deepest nearby water. Fish every piling, not just the corners.',
            'Laydowns / timber — a fallen tree is an ambush point and a highway between deep and shallow water at once.',
            'Weed lines / grass edges — the outside edge (where grass meets open water) concentrates both baitfish and predators.',
            'Points — a finger of land extending into the water is a natural travel route between shallow and deep.',
            'Drop-offs / ledges — a sharp depth change lets fish move a few feet vertically to change comfort zones.',
            'Riprap / rock — rock holds heat and crawfish; good in cooler water and low light.',
          ],
        },
        { kind: 'note', text: 'When conditions are tough, structure matters more, not less — active fish roam open water, but pressured or uncomfortable fish pull tight to the nearest cover.' },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// BASS BEHAVIOR — consolidates the behavioral claims already made across
// data/recommendations.ts talking points into one coherent lesson.
// ─────────────────────────────────────────────────────────────────────────────
export const BASS_BEHAVIOR: RefCategory = {
  id: 'bass-behavior',
  label: 'Bass Behavior',
  icon: '🐟',
  blurb: 'Why the recommendations say what they say — the behavior underneath the advice.',
  entries: [
    {
      id: 'basics',
      title: 'What actually drives a bite',
      blocks: [
        {
          kind: 'list',
          items: [
            'Feeding windows: dawn and dusk are consistently the most active low-light feeding periods — bass hunt more confidently when they can\'t easily be seen themselves.',
            'Shade-seeking: in bright sun bass position under cover rather than roam, conserving energy and staying hidden from prey and predators alike.',
            'Reaction strikes: a fast-moving bait deflecting off cover can trigger a strike out of instinct even when a fish isn\'t actively feeding.',
            'Territorial aggression: during the spawn, bass guard beds and strike out of defense, not hunger — this is why slow, weedless baits worked right through a bed can out-produce anything else.',
            'Cold lethargy: below roughly 45°F, metabolism drops sharply and bass simply won\'t chase — presentation has to come to them, slowly.',
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// RETRIEVE TECHNIQUES — names the techniques already embedded inside individual
// lure descriptions across the app, as a standalone skill glossary.
// ─────────────────────────────────────────────────────────────────────────────
export const RETRIEVE_TECHNIQUES: RefCategory = {
  id: 'retrieve-techniques',
  label: 'Retrieve Techniques',
  icon: '🎣',
  blurb: 'How you move a bait matters as much as which bait you picked.',
  entries: [
    {
      id: 'glossary',
      title: 'The retrieves NovaCast\'s recommendations use',
      blocks: [
        {
          kind: 'list',
          items: [
            'Steady retrieve — constant speed, constant depth. The default for spinnerbaits and crankbaits; let the lure\'s own action do the work.',
            'Slow-roll — reeling just fast enough to keep a spinnerbait\'s blade turning while it stays near the bottom. Cold-water staple.',
            'Burn — a fast, aggressive retrieve near the surface to trigger reaction strikes from active fish.',
            'Stop-and-go (twitch-pause) — move the bait, then pause. Most jerkbait and topwater strikes come during the pause, not the movement.',
            'Yo-yo — reel a few turns, let the bait sink back on a controlled fall, repeat. Used with lipless crankbaits worked vertically.',
            'Deadstick — cast it out and barely move it at all. The last resort for lockjaw fish (rising pressure, cold fronts) — let the bait just sit.',
            'Drag-and-hop — pull a bottom bait (jig, Texas rig) a short distance, pause, repeat. Keeps it in contact with the bottom the whole retrieve.',
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// LURE SELECTION — blueprint §18: don't just list advantages, teach failure
// modes so a theoretically great lure isn't recommended somewhere it can't
// actually be fished.
// ─────────────────────────────────────────────────────────────────────────────
export const LURE_SELECTION: RefCategory = {
  id: 'lure-selection',
  label: 'Choosing the Right Lure',
  icon: '🧭',
  blurb: 'The best lure isn\'t the best lure if you can\'t fish it in that spot. Know the downside before you tie it on.',
  entries: [
    {
      id: 'downsides',
      title: 'Where good lures fail',
      blocks: [
        {
          kind: 'list',
          items: [
            'Spinnerbait / chatterbait — the exposed hook and blade foul on algae, moss, and bottom debris. In thick weeds, switch to weedless (Texas rig) instead of fighting it.',
            'Crankbait / jerkbait (treble hooks) — snag heavily in wood, rock, and heavy cover, and can sink too deep over submerged debris. Great in open water, a liability tight to laydowns.',
            'Topwater (frogs excepted) — needs relatively calm water to read as a struggling baitfish; a stiff chop or heavy current defeats it. Also a poor pick in cold water when fish won\'t come up.',
            'Texas rig / weedless plastics — the trade-off is a slightly lower hookup rate in open water since the point starts covered. It\'s the answer specifically when the baits above can\'t be fished cleanly.',
          ],
        },
        { kind: 'note', text: 'See Fix-It → Bottom Fouling for what to do when a bait keeps coming back with debris on it instead of just switching blind.' },
      ],
    },
  ],
};

// Subjects still genuinely unwritten — kept honest and visible rather than
// silently absent. Most of the blueprint's requested topics now have a home
// above or in NovaCastReference.tsx's Reels/Lures/Line/Knots tabs.
export const PLANNED_TOPICS: string[] = [
  'Fly casting technique',
  'Depth/bathymetry reading',
  'Species-specific regulations (needs an authoritative data source)',
];

/** Categories that are written and rendered from data today. */
export const REFERENCE_CATEGORIES: RefCategory[] = [
  READING_WATER,
  SEASONAL_PATTERNS,
  WATER_TEMPERATURE,
  WEATHER_CONDITIONS,
  STRUCTURE_COVER,
  BASS_BEHAVIOR,
  RETRIEVE_TECHNIQUES,
  LURE_SELECTION,
  TROUBLESHOOTING,
  QUICK_CONNECTIONS,
  LIVE_BAIT,
];
