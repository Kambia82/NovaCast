// Maps a recommendation's lure/technique/condition name to where it's actually
// taught in NovaCastReference — the glue behind every "Learn" link in the app
// (blueprint: recommendation -> "Learn this technique" without losing fishing
// context). Pure string matching against vocabulary the app already uses
// (lure names from data/recommendations.ts, category ids from data/reference.ts)
// — it never invents a topic, it only points at content that already exists.

export interface LearnTarget {
  /** NovaCastReference tab key. */
  tab: string;
  /** RefEntry id within one of that tab's stacked RefCategory sections, if any. */
  entryId?: string;
}

interface Rule { match: RegExp; target: LearnTarget }

// Ordered most-specific first — the first match wins.
const RULES: Rule[] = [
  // Rigs / specific lures with a named entry in the Lures tab.
  { match: /texas rig/i, target: { tab: 'lures' } },
  { match: /carolina rig/i, target: { tab: 'lures' } },
  { match: /wacky rig/i, target: { tab: 'lures' } },
  { match: /ned rig/i, target: { tab: 'lures' } },
  { match: /drop ?shot/i, target: { tab: 'lures' } },
  { match: /shaky ?head/i, target: { tab: 'lures' } },
  { match: /chatterbait|bladed jig/i, target: { tab: 'lures' } },
  { match: /spinnerbait/i, target: { tab: 'lures' } },
  { match: /(lipless )?crankbait/i, target: { tab: 'lures' } },
  { match: /jerkbait/i, target: { tab: 'lures' } },
  { match: /topwater|popper|buzzbait|walking|frog/i, target: { tab: 'lures' } },
  { match: /football jig|flipping jig|\bjig\b/i, target: { tab: 'lures' } },
  { match: /tube bait/i, target: { tab: 'lures' } },
  { match: /beetle spin/i, target: { tab: 'lures' } },
  { match: /inline spinner/i, target: { tab: 'lures' } },
  { match: /grub|minnow|chicken liver|stink bait|cricket|nightcrawler|worm on/i, target: { tab: 'lures' } },

  // Lure downsides / choosing between options.
  { match: /snag|weedless|hook point|treble/i, target: { tab: 'technique', entryId: 'downsides' } },

  // Retrieve technique words.
  { match: /slow-?roll|burn it|stop-?and-?go|dead ?stick|yo-?yo|drag.{0,10}hop|steady retrieve/i, target: { tab: 'technique', entryId: 'glossary' } },

  // Reels / casting / backlash.
  { match: /baitcast/i, target: { tab: 'reels' } },
  { match: /spinning reel/i, target: { tab: 'reels' } },
  { match: /spincast/i, target: { tab: 'reels' } },
  { match: /fly reel/i, target: { tab: 'reels' } },
  { match: /backlash|bird'?s nest/i, target: { tab: 'fixit', entryId: 'backlash' } },

  // Knots.
  { match: /palomar|clinch|loop knot|uni knot|\bknot\b/i, target: { tab: 'knots' } },

  // Troubleshooting.
  { match: /line twist|fray|line problem/i, target: { tab: 'fixit', entryId: 'line-problems' } },
  { match: /bottom foul|algae|debris/i, target: { tab: 'fixit', entryId: 'bottom-fouling' } },
  { match: /stuck in cover|buried in/i, target: { tab: 'fixit', entryId: 'stuck-in-cover' } },

  // Conditions / seasonal / behavior.
  { match: /barometric|pressure/i, target: { tab: 'conditions', entryId: 'pressure' } },
  { match: /overcast|sunny|sky|cloud/i, target: { tab: 'conditions', entryId: 'sky' } },
  { match: /water temp|cold water|cool water|warm water/i, target: { tab: 'conditions', entryId: 'bands' } },
  { match: /dock|laydown|timber|weed line|point|drop-?off|ledge|riprap|structure/i, target: { tab: 'conditions', entryId: 'types' } },
  { match: /spawn|pre-spawn|post-spawn/i, target: { tab: 'seasonal', entryId: 'spring' } },
  { match: /summer pattern/i, target: { tab: 'seasonal', entryId: 'summer' } },
  { match: /fall feed/i, target: { tab: 'seasonal', entryId: 'fall' } },
  { match: /winter/i, target: { tab: 'seasonal', entryId: 'winter' } },
  { match: /bass behavior|feeding window|shade-?seeking/i, target: { tab: 'seasonal', entryId: 'basics' } },

  // Live bait.
  { match: /live bait|crawfish|cut bait/i, target: { tab: 'stores' } },
];

/** Best-effort learning target for a lure/technique/condition name. Null if no match. */
export function findLearnTarget(text: string): LearnTarget | null {
  if (!text) return null;
  for (const rule of RULES) {
    if (rule.match.test(text)) return rule.target;
  }
  return null;
}
