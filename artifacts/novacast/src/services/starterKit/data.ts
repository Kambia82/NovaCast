// Curated beginner-tackle table for the NovaCast-generated starter list.
//
// Everything here is a GENERIC category ("1/8 oz bullet weights"), the kind of
// thing you ask a store clerk for — not a fabricated branded product and never
// a price. `generate.ts` filters/assembles these by the angler's criteria.

import type { KitItem, KitSpecies, KitEnvironment, KitPlatform } from './types';

/** Applies to every kit regardless of species. */
export const BASE_ITEMS: KitItem[] = [
  { category: 'container', name: 'Small hard tackle tray (3600 size)', qty: '1', why: 'Holds everything in this list. Don\'t oversize it to start.', essential: true, minBudget: 'minimal' },
  { category: 'line', name: 'Monofilament line, 8–10 lb', qty: '1 spool', why: 'Forgiving, cheap, good stretch for learning. Fill your reel with this first.', essential: true, minBudget: 'minimal' },
  { category: 'hooks', name: 'Assorted octopus/bait hooks, #4–1/0', qty: '1 pack', why: 'Live bait and cut bait. The most-used hook for a beginner.', essential: true, minBudget: 'minimal' },
  { category: 'weights', name: 'Split shot assortment', qty: '1 pack', why: 'Pinch-on weights to sink a bait or bobber rig. No knots needed.', essential: true, minBudget: 'minimal' },
  { category: 'floats', name: 'Bobbers, 1" and 1.5" (clip-on)', qty: '2–3', why: 'Bite detection and depth control for bait fishing.', essential: true, minBudget: 'minimal' },
  { category: 'tools', name: 'Needle-nose pliers (fishing, rust-resistant)', qty: '1', why: 'Unhooking fish, pinching split shot, bending hooks free.', essential: true, minBudget: 'minimal' },
  { category: 'tools', name: 'Line clippers or nail clippers', qty: '1', why: 'Trimming knots. A cheap nail clipper works fine.', essential: true, minBudget: 'standard' },
  { category: 'terminal', name: 'Barrel swivels, size 10', qty: '1 pack', why: 'Cuts line twist on spinning gear and joins leaders.', essential: false, minBudget: 'standard' },
  { category: 'tools', name: 'Fluorocarbon leader, 8–12 lb', qty: '1 small spool', why: 'A 2 ft leader for clear water, tied to your main line.', essential: false, minBudget: 'complete' },
];

/** Species-specific additions. */
export const SPECIES_ITEMS: Record<KitSpecies, KitItem[]> = {
  bass: [
    { category: 'soft-plastics', name: 'Soft plastic stick worms, green pumpkin (5")', qty: '1 pack', why: 'Wacky-rig or Texas-rig. The most reliable beginner bass bait there is.', essential: true, minBudget: 'minimal' },
    { category: 'hooks', name: 'EWG worm hooks, 3/0–4/0', qty: '1 pack', why: 'For Texas-rigging the stick worms weedless.', essential: true, minBudget: 'minimal' },
    { category: 'weights', name: 'Bullet/worm weights, 1/8 & 1/4 oz', qty: '1 pack', why: 'Texas-rig weights. Start light.', essential: true, minBudget: 'minimal' },
    { category: 'spinnerbait', name: 'Spinnerbait, 3/8 oz, chartreuse/white', qty: '1', why: 'Covers water fast, hard to fish wrong — just cast and reel.', essential: true, minBudget: 'standard' },
    { category: 'chatterbait', name: 'Bladed jig (chatterbait), 3/8 oz', qty: '1', why: 'Vibration bait for stained water and grass edges.', essential: false, minBudget: 'standard' },
    { category: 'hard-baits', name: 'Squarebill crankbait, shad pattern (shallow)', qty: '1', why: 'Deflects off cover to trigger reaction strikes.', essential: false, minBudget: 'standard' },
    { category: 'topwater', name: 'Hollow-body frog or popper', qty: '1', why: 'Early/late and over grass — the most fun way to catch a bass.', essential: false, minBudget: 'complete' },
    { category: 'soft-plastics', name: 'Ned rig heads (1/10 oz) + short stick baits', qty: '1 each', why: 'When nothing else works. Tiny, non-threatening, always catches.', essential: false, minBudget: 'complete' },
  ],
  panfish: [
    { category: 'hooks', name: 'Long-shank panfish hooks, #6–#8', qty: '1 pack', why: 'Small mouths need small hooks; long shank makes unhooking easy.', essential: true, minBudget: 'minimal' },
    { category: 'soft-plastics', name: 'Curly-tail grubs, 1" (assorted)', qty: '1 pack', why: 'On a tiny jighead under a bobber — deadly on bluegill and crappie.', essential: true, minBudget: 'minimal' },
    { category: 'terminal', name: 'Jigheads, 1/32 & 1/16 oz', qty: '1 pack', why: 'Match to the grubs; the lighter the better in calm water.', essential: true, minBudget: 'standard' },
    { category: 'hard-baits', name: 'Small in-line spinner (1/16 oz)', qty: '1', why: 'Cast-and-reel search bait for aggressive panfish.', essential: false, minBudget: 'standard' },
  ],
  catfish: [
    { category: 'hooks', name: 'Circle hooks, 2/0–5/0', qty: '1 pack', why: 'Self-setting — the fish hooks itself in the corner of the mouth.', essential: true, minBudget: 'minimal' },
    { category: 'weights', name: 'Egg/no-roll sinkers, 1/2–1 oz', qty: '1 pack', why: 'Hold bottom in current for a slip-sinker rig.', essential: true, minBudget: 'minimal' },
    { category: 'terminal', name: 'Bait-holder hooks + sponge/dip worms', qty: '1 pack', why: 'For punch/dip bait if you go that route.', essential: false, minBudget: 'standard' },
    { category: 'tools', name: 'Bait knife + small cutting board', qty: '1', why: 'Cut bait is the top natural catfish bait in most rivers.', essential: false, minBudget: 'complete' },
  ],
  trout: [
    { category: 'hooks', name: 'Bait hooks, #8–#12', qty: '1 pack', why: 'Small hooks for dough bait, worms, or salmon eggs.', essential: true, minBudget: 'minimal' },
    { category: 'weights', name: 'Removable split shot (small)', qty: '1 pack', why: 'Just enough to get a bait down without dragging.', essential: true, minBudget: 'minimal' },
    { category: 'hard-baits', name: 'Small spoons + in-line spinners (1/16–1/8 oz)', qty: '1 each', why: 'Casting metal for stocked-trout lakes and streams.', essential: false, minBudget: 'standard' },
    { category: 'floats', name: 'Clear casting bubble', qty: '1', why: 'Adds casting weight while keeping bait/fly near the surface.', essential: false, minBudget: 'complete' },
  ],
  multi: [
    { category: 'soft-plastics', name: 'Soft plastic stick worms, green pumpkin (5")', qty: '1 pack', why: 'Works for bass; smaller pieces work for panfish too.', essential: true, minBudget: 'minimal' },
    { category: 'hooks', name: 'EWG worm hooks 3/0 + panfish hooks #6', qty: '1 each', why: 'Covers a Texas rig and a bobber rig with one purchase.', essential: true, minBudget: 'minimal' },
    { category: 'terminal', name: 'Jigheads 1/16 oz + curly-tail grubs', qty: '1 each', why: 'The single most versatile "catch anything" combo.', essential: true, minBudget: 'standard' },
    { category: 'spinnerbait', name: 'Spinnerbait, 3/8 oz, chartreuse/white', qty: '1', why: 'Search bait for bass; smaller fish will chase it too.', essential: false, minBudget: 'standard' },
  ],
};

export const ENVIRONMENT_ITEMS: Record<KitEnvironment, KitItem[]> = {
  pond: [
    { category: 'soft-plastics', name: 'Weedless/Texas-rig setup (extra hooks + light weights)', qty: '1', why: 'Small ponds are often weedy and shallow — keep the hook point covered.', essential: false, minBudget: 'standard' },
  ],
  lake: [],
  river: [
    { category: 'weights', name: 'Extra heavier weights (3/8–3/4 oz)', qty: '1 pack', why: 'Current means you need more weight to hold or swing a bait.', essential: false, minBudget: 'standard' },
    { category: 'floats', name: 'Slip float + bead + stop knots', qty: '1 set', why: 'Drift a bait at a set depth through current seams.', essential: false, minBudget: 'complete' },
  ],
  reservoir: [
    { category: 'hard-baits', name: 'Lipless crankbait, 1/2 oz, shad', qty: '1', why: 'Big open water — you need a bait that covers depth and distance.', essential: false, minBudget: 'standard' },
  ],
};

export const PLATFORM_ITEMS: Record<KitPlatform, KitItem[]> = {
  bank: [
    { category: 'container', name: 'Sling/backpack tackle bag', qty: '1', why: 'You carry everything on foot — hands-free beats a hard box on the bank.', essential: false, minBudget: 'standard' },
    { category: 'tools', name: 'Compact landing net (folding)', qty: '1', why: 'Landing fish up a bank without one loses fish and breaks line.', essential: false, minBudget: 'complete' },
  ],
  kayak: [
    { category: 'safety', name: 'PFD (life jacket) — required', qty: '1', why: 'Non-negotiable on any paddlecraft. Not optional gear.', essential: true, minBudget: 'minimal' },
    { category: 'platform', name: 'Leashes for rod + pliers', qty: '2', why: 'Anything not leashed on a kayak eventually goes overboard.', essential: false, minBudget: 'standard' },
    { category: 'tools', name: 'Short floating landing net', qty: '1', why: 'A floating net you can drop and recover from the seated position.', essential: false, minBudget: 'standard' },
  ],
  boat: [
    { category: 'safety', name: 'PFD (life jacket)', qty: '1 per person', why: 'Required aboard. Wear it under way.', essential: true, minBudget: 'minimal' },
    { category: 'platform', name: 'Larger tackle system (3700 trays + bag)', qty: '1', why: 'A boat lets you carry more — organize by technique.', essential: false, minBudget: 'complete' },
    { category: 'tools', name: 'Full-size landing net', qty: '1', why: 'Boat-side landing needs a longer handle and bigger hoop.', essential: false, minBudget: 'standard' },
  ],
};
