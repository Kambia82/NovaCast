// NovaCastReference.jsx
// Full rebuild of the Reference / Learn section
// Categories: Reels, Lures (by species), Knots, Beginner Inventory, Where to Buy
// Aimed at women learning to fish — plain language, no assumed knowledge

import { useState } from 'react';
import { X, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

// ─── DATA ────────────────────────────────────────────────────────────────────

const REELS = [
  {
    name: 'Spinning Reel',
    icon: '🎣',
    difficulty: 'Beginner',
    diffColor: '#00e5c7',
    price: '$20–$150+',
    summary: 'The most popular reel for beginners and casual anglers. The spool is fixed and a wire bail flips open to release line.',
    pros: ['Easy to cast — very forgiving', 'Works great with lighter line and smaller lures', 'Less likely to tangle than a baitcaster', 'Good for finesse techniques (drop shot, shaky head, ned rig)'],
    cons: ['Less accurate on longer casts than a baitcaster', 'Not ideal for very heavy lures or thick line'],
    bestFor: 'Bass finesse, crappie, bluegill, trout, beginners learning to cast',
    howToUse: 'Open the bail (flip the wire arm), hold the line against the rod with your finger, cast, and release your finger at the right moment. Close the bail by turning the handle.',
    brands: ['Ugly Stik GX2 Combo (~$40)', 'Shimano Sienna (~$30)', 'Penn Battle (~$60)'],
    tutorialUrl: 'https://www.youtube.com/results?search_query=how+to+use+spinning+reel+beginners',
  },
  {
    name: 'Spincast (Closed Face)',
    icon: '🎯',
    difficulty: 'Easiest',
    diffColor: '#5cc8e0',
    price: '$15–$60',
    summary: 'Push-button reel with a closed nose cone covering the line. The classic "Zebco" style most people learned on as kids.',
    pros: ['Absolute easiest to cast — just push a button', 'Almost impossible to get a backlash tangle', 'Cheap and durable', 'Great for kids and absolute beginners'],
    cons: ['Less sensitive — harder to feel subtle bites', 'Not great for light line or finesse', 'Lower casting distance and accuracy'],
    bestFor: 'True beginners, kids, casual bank fishing, bait fishing',
    howToUse: 'Press and hold the thumb button, cast forward, release the button at the right moment. That\'s it.',
    brands: ['Zebco 33 (~$25)', 'Zebco 202 (~$15)', 'Shakespeare Ugly Stik Spincast (~$30)'],
    tutorialUrl: 'https://www.youtube.com/results?search_query=how+to+use+spincast+reel+zebco+beginners',
  },
  {
    name: 'Baitcasting Reel',
    icon: '⚙️',
    difficulty: 'Intermediate',
    diffColor: '#c0c8d8',
    price: '$40–$300+',
    summary: 'Sits on top of the rod (not underneath). More accurate and powerful once you learn it — but there\'s a learning curve. Backlash ("bird\'s nests") happen while you\'re learning.',
    pros: ['Much more accurate for targeted casting', 'Handles heavier line and bigger lures better', 'Better for power techniques: flipping, pitching, frogging', 'Preferred by most experienced bass anglers'],
    cons: ['Learning curve — backlashes are frustrating at first', 'Not great for light lures under 1/4 oz', 'More expensive for quality models'],
    bestFor: 'Heavier bass lures (chatterbait, spinnerbait, crankbait, swimbaits), flipping docks, experienced anglers',
    howToUse: 'Press the thumb bar to release line, use your thumb to control the spool during the cast to prevent backlash. Start with the brakes turned all the way up and gradually reduce as you improve.',
    brands: ['Abu Garcia Black Max (~$50)', 'Lew\'s Speed Spool (~$80)', 'Shimano SLX (~$120)'],
    tutorialUrl: 'https://www.youtube.com/results?search_query=how+to+use+baitcaster+reel+beginners+no+backlash',
  },
  {
    name: 'Fly Reel',
    icon: '🪶',
    difficulty: 'Advanced',
    diffColor: '#7a8ea6',
    price: '$40–$400+',
    summary: 'Used exclusively with fly fishing tackle. The casting motion is completely different — you\'re casting the weight of the line, not the lure.',
    pros: ['Incredibly satisfying once learned', 'Great for trout, bass, and panfish in streams', 'Quiet and natural presentation'],
    cons: ['Steep learning curve — casting technique takes practice', 'Specialized gear required', 'Not practical for most Missouri lake fishing'],
    bestFor: 'Streams and rivers, trout, small bass and panfish on the surface',
    howToUse: 'Strip line off the reel, use false casts to load the rod with line weight, then shoot the line forward to your target. Takes real practice — look for local fly fishing clubs or YouTube.',
    brands: ['Redington Minnow Combo (~$60)', 'Orvis Clearwater (~$200)', 'Echo Base (~$80)'],
    tutorialUrl: 'https://www.youtube.com/results?search_query=fly+fishing+beginners+how+to+cast',
  },
];

const LURES_BY_SPECIES = {
  bass: [
    {
      name: 'Texas Rig (Senko or Worm)',
      icon: '🪱',
      type: 'Soft Plastic',
      price: '~$5–8 per pack',
      difficulty: 'Beginner',
      summary: 'A soft plastic worm rigged weedless — the hook point is buried in the plastic so it doesn\'t snag. The most versatile bass setup ever made.',
      technique: 'Cast near cover, let it sink on slack line. Slowly drag it along the bottom with small hops. When you feel anything different — extra weight, a tap, a thump — reel fast and set the hook hard.',
      bestConditions: 'Any conditions. Clear to stained water. Works year-round.',
      colors: 'Green pumpkin (clear water), black/blue or junebug (murky/night), watermelon red (stained)',
      tip: 'The Senko (Gary Yamamoto 5" stick bait) is the most effective bass lure of the last 20 years. If you only buy one soft plastic, make it this.',
      whereToGet: 'Walmart, Bass Pro, Amazon',
    },
    {
      name: 'Chatterbait (Bladed Jig)',
      icon: '⚡',
      type: 'Bladed Jig',
      price: '~$5–9 each',
      difficulty: 'Beginner',
      summary: 'A jig with a vibrating metal blade on the front. Creates flash and a thumping vibration as you retrieve it. One of the best murky-water lures.',
      technique: 'Cast and reel at a steady medium pace. Keep your rod at 10 o\'clock. If you feel grass or weeds, rip it hard — that deflection triggers strikes. Trailer a soft plastic chunk on the back hook.',
      bestConditions: 'Murky or stained water. Overcast days. Pre-spawn and post-spawn.',
      colors: 'White/chartreuse (murky), green pumpkin/brown (clear), black/blue (dark water)',
      tip: 'This is Kristina\'s go-to. Add a matching soft plastic trailer (a craw or chunk) on the hook — it slows the fall and adds action.',
      whereToGet: 'Walmart, Bass Pro, Academy',
    },
    {
      name: 'Spinnerbait',
      icon: '🌀',
      type: 'Bladed Bait',
      price: '~$4–8 each',
      difficulty: 'Beginner',
      summary: 'A wire frame with spinning metal blades that flash and vibrate. Very forgiving — you can\'t fish it wrong, just cast and reel.',
      technique: 'Cast to the bank and reel at a steady pace. Try a slow-roll (just fast enough to keep the blades spinning) near the bottom in cold water. Speed up in warm water.',
      bestConditions: 'Murky to stained water. Overcast. Wind-blown banks. Spring and fall.',
      colors: 'Chartreuse/white (murky), white (clear/overcast), black (night)',
      tip: 'Cast into the wind-blown bank — not the calm side. Baitfish get disoriented there and bass stack up to eat them.',
      whereToGet: 'Walmart, Bass Pro, Amazon',
    },
    {
      name: 'Ned Rig (Z-Man TRD)',
      icon: '🍄',
      type: 'Finesse',
      price: '~$7–10 for kit',
      difficulty: 'Beginner',
      summary: 'A tiny mushroom-shaped jighead with a short soft plastic bait. Simple and devastatingly effective — catches bass when nothing else will.',
      technique: 'Cast, let it sink to the bottom. Drag it very slowly with your rod tip. Small hops. Don\'t overwork it — the bait does the work. Set the hook when you feel anything unusual.',
      bestConditions: 'Clear to stained water. Tough bites. Pressured fish. Any season.',
      colors: 'Green pumpkin (clear), black/blue (dark), natural shad (open water)',
      tip: 'The Z-Man ElaZtech plastic floats — so the tail stands up off the bottom even when sitting still. That action at rest is what makes fish bite it.',
      whereToGet: 'Bass Pro, Amazon, tackle shops',
    },
    {
      name: 'Wacky Rig Senko',
      icon: '〰️',
      type: 'Soft Plastic',
      price: '~$6–9 per pack',
      difficulty: 'Beginner',
      summary: 'The same Senko stick bait, but hooked through the middle. Both ends wiggle as it falls. The most natural-looking fall of any bass lure.',
      technique: 'Hook the Senko through the middle with a small hook or O-ring. Cast it out. Let it sink on completely slack line — don\'t touch it. Watch your line. When it twitches or moves sideways, reel fast and set hard.',
      bestConditions: 'Clear water. Post-cold front. Pressured fish who\'ve seen everything.',
      colors: 'Natural shad, green pumpkin, watermelon',
      tip: 'Use an O-ring tool to save your Senkos — they tear quickly without one. You can get 10x the life out of each bait.',
      whereToGet: 'Bass Pro, Amazon, most tackle shops',
    },
    {
      name: 'Lipless Crankbait',
      icon: '🐟',
      type: 'Hard Bait',
      price: '~$7–12 each',
      difficulty: 'Beginner',
      summary: 'A sinking hard plastic lure that vibrates and rattles. No diving lip — it sinks when you stop reeling. Best lure for a falling barometer.',
      technique: 'Cast long. Yo-yo it: reel 3 turns, pause and let it sink a foot, reel 3 more. Most strikes come on the pause. Keep your rod tip low.',
      bestConditions: 'Falling barometer (before a storm). Spring grass beds. Any water color.',
      colors: 'Red craw (early spring, near grass), chrome/blue (clear water), chartreuse (murky)',
      tip: 'The red craw color in early spring when bass are relating to shallow grass is one of the most reliable pattern/lure matches in Missouri fishing.',
      whereToGet: 'Walmart (Bill Lewis Rat-L-Trap), Bass Pro, Amazon',
    },
    {
      name: 'T-Plopper / Walking Topwater',
      icon: '💦',
      type: 'Topwater',
      price: '~$8–15 each',
      difficulty: 'Beginner-Intermediate',
      summary: 'A hard lure that stays on the surface and walks side to side as you reel. Creates a "walk the dog" motion. Bass blow up on these — it\'s the most exciting bite in fishing.',
      technique: 'Cast near cover at dawn or dusk. Reel slowly while twitching your rod tip left-right-left to create the walking motion. Pause at cover. When a bass explodes on it — wait a half second before setting the hook. They miss on the first strike often.',
      bestConditions: 'Dawn, dusk, overcast days. Calm water. Summer and fall. Near surface cover.',
      colors: 'Frog/natural (clear water), white/bone (any condition), chrome (open water)',
      tip: 'Don\'t set the hook the moment you see the explosion — reel tight, feel the weight, THEN set. It\'s hard to wait but you\'ll land way more fish.',
      whereToGet: 'Bass Pro, Academy, Amazon',
    },
  ],
  crappie: [
    {
      name: 'Curly-Tail Grub on 1/16 oz Jig',
      icon: '🦐',
      type: 'Soft Plastic Jig',
      price: '~$4–6 per pack',
      difficulty: 'Beginner',
      summary: 'The ultimate crappie lure. A tiny jig head with a soft plastic curly tail grub. Drop it straight down next to any structure.',
      technique: 'Drop it straight down next to a dock piling or brush pile. Lift it 6 inches, let it fall back. Repeat. Most hits come on the fall — when your line twitches, set the hook with a gentle upward motion (not a hard bass set).',
      bestConditions: 'Year-round. Especially effective during spawn (April–May) when crappie stack shallow.',
      colors: 'Pink/white (clear), chartreuse (murky), black/chartreuse (any)',
      tip: 'Crappie have soft mouths — if you set the hook too hard you\'ll rip it out. Lift firmly but not violently.',
      whereToGet: 'Walmart, Bass Pro, Academy',
    },
    {
      name: 'Live Minnow on Bobber',
      icon: '🐠',
      type: 'Live Bait',
      price: '~$4–5 per dozen',
      difficulty: 'Easiest',
      summary: 'A live minnow under a small bobber, set at 3–5 feet. The most reliable crappie method, especially when they won\'t hit artificials.',
      technique: 'Hook the minnow through the lips or behind the dorsal fin. Set your bobber at 3–5 ft depth. Cast near brush, docks, or flooded timber. When the bobber goes under, reel fast and lift.',
      bestConditions: 'Any. Especially good in cold water when crappie are finicky.',
      colors: 'N/A — live bait',
      tip: 'Buy minnows at a bait shop the morning of your trip. Most STL-area Walmarts carry them in the sporting goods section.',
      whereToGet: 'Walmart sporting goods counter, local bait shops',
    },
  ],
  catfish: [
    {
      name: 'Chicken Liver on Bottom Rig',
      icon: '🫀',
      type: 'Natural Bait',
      price: '~$2–3 at grocery store',
      difficulty: 'Easiest',
      summary: 'Chicken liver on a circle hook, weighted to the bottom. Catfish hunt by smell — liver puts out a massive scent trail. Buy it in the meat section, not the fishing aisle.',
      technique: 'Thread liver onto a circle hook (size 2/0–4/0). Add an egg sinker above a swivel. Cast to deeper water and wait. When the rod tip bounces, don\'t jerk — just start reeling. Circle hooks set themselves.',
      bestConditions: 'Night fishing. Summer evenings. Any water color.',
      colors: 'N/A — natural bait',
      tip: 'Liver falls off hooks easily. Use a mesh bait bag or wrap it in pantyhose scraps to keep it on longer.',
      whereToGet: 'Any grocery store — meat department',
    },
    {
      name: 'Stink Bait / Dip Bait',
      icon: '💀',
      type: 'Prepared Bait',
      price: '~$4–6',
      difficulty: 'Beginner',
      summary: 'Commercially prepared catfish bait that smells terrible to humans but irresistible to catfish. Magic Bait and Danny King\'s are popular brands.',
      technique: 'Use a dip worm or bait holder treble hook. Dip it in the bait, cast to the bottom. Re-check every 15 minutes — catfish clean it off without you noticing.',
      bestConditions: 'Warm water. Summer. Any time of day but best at dawn/dusk/night.',
      colors: 'N/A',
      tip: 'Wear gloves. Seriously.',
      whereToGet: 'Walmart fishing aisle, Bass Pro',
    },
  ],
  bluegill: [
    {
      name: 'Live Cricket on #8 Hook',
      icon: '🦗',
      type: 'Live Bait',
      price: '~$3 per container',
      difficulty: 'Easiest',
      summary: 'Bluegill literally cannot resist a cricket. Tiny hook, small bobber, light line. This is the perfect setup for beginners and kids.',
      technique: 'Put the cricket on a #8 hook through the thorax. Use a small bobber set at 2–3 ft. Cast near weedy banks or any visible cover. When the bobber twitches, lift gently — bluegill have small mouths.',
      bestConditions: 'Spring through fall. Any water. Shallow banks.',
      colors: 'N/A',
      tip: 'Most STL-area Walmarts carry live crickets at the sporting goods counter. Ask if you don\'t see them.',
      whereToGet: 'Walmart sporting goods, bait shops',
    },
    {
      name: 'Beetle Spin (1/32 oz, White or Chartreuse)',
      icon: '🪲',
      type: 'Spinner',
      price: '~$3–5 each',
      difficulty: 'Beginner',
      summary: 'A tiny spinner with a soft plastic grub. Been catching STL-area bluegill for 50 years. One of the best beginner lures ever made.',
      technique: 'Cast along weedy banks and reel very slowly. The tiny spinning blade creates flash bluegill can see from a distance. Set the hook gently.',
      bestConditions: 'Spring through fall. Any water color.',
      colors: 'White (clear water), chartreuse (murky), yellow (general)',
      tip: 'Downsize your line to 4–6 lb monofilament for bluegill. Heavy line kills the action on tiny lures like this.',
      whereToGet: 'Walmart, Bass Pro, any tackle shop',
    },
  ],
  smallmouth: [
    {
      name: 'Tube Bait (3", Smoke or Green)',
      icon: '🫧',
      type: 'Soft Plastic',
      price: '~$4–6 per pack',
      difficulty: 'Beginner',
      summary: 'A hollow soft plastic shaped like a tube with tentacles. Dragged along a rocky bottom, it mimics a crawfish — smallmouth\'s favorite food.',
      technique: 'Cast upstream at a 45-degree angle. Let it bounce along the bottom with the current. Don\'t reel — just keep the line tight enough to feel the bottom. Set the hook on anything that feels different.',
      bestConditions: 'Clear to stained river water. Spring through fall. Rocky bottoms.',
      colors: 'Smoke/clear (clear water), green pumpkin (stained), brown/orange (any)',
      tip: 'Wade quietly upstream. Smallmouth spook easily — approach from downstream and cast ahead of you.',
      whereToGet: 'Bass Pro, Amazon, tackle shops',
    },
    {
      name: 'Inline Spinner (Mepps #2, Silver)',
      icon: '🌟',
      type: 'Spinner',
      price: '~$5–8 each',
      difficulty: 'Beginner',
      summary: 'A classic spinner with a single spinning blade. Inline spinners have been catching smallmouth for 80+ years. Simple and effective.',
      technique: 'Cast across current at a 45-degree angle. Let the current swing the spinner downstream. Reel just fast enough to keep the blade spinning. Strikes often come at the end of the swing.',
      bestConditions: 'Overcast days. Moving water. Anywhere smallmouth are actively feeding.',
      colors: 'Silver blade (any), gold blade (murky/stained), dressed (any)',
      tip: 'The Mepps Aglia is the classic. Size #2 is perfect for Missouri smallmouth.',
      whereToGet: 'Bass Pro, Cabela\'s, Amazon',
    },
  ],
};

const KNOTS = [
  {
    name: 'Palomar Knot',
    difficulty: 'Easy',
    diffColor: '#00e5c7',
    strength: '95%+ line strength',
    use: 'Attaching hooks, lures, swivels — your go-to knot for almost everything',
    steps: [
      'Double about 6 inches of line and pass the loop through the eye of the hook.',
      'Tie a simple overhand knot with the doubled line — just a loose loop, don\'t pull tight yet.',
      'Pass the hook or lure through the loop you just made.',
      'Pull both tag end and main line to tighten. Trim the tag end close.',
    ],
    tip: 'This is the strongest common fishing knot. Learn this one first and use it for everything. Wet the knot with saliva before pulling tight — it seats better.',
    imageSearch: 'palomar knot fishing steps diagram',
    tutorialUrl: 'https://www.youtube.com/results?search_query=palomar+knot+fishing+how+to+tie',
  },
  {
    name: 'Improved Clinch Knot',
    difficulty: 'Easy',
    diffColor: '#00e5c7',
    strength: '85–95% line strength',
    use: 'The most common beginner knot. Works for hooks and lures with monofilament or fluorocarbon.',
    steps: [
      'Thread the line through the hook eye, leaving 6–8 inches of tag end.',
      'Wrap the tag end around the main line 5–7 times (5 for heavier line, 7 for lighter).',
      'Pass the tag end through the small loop just above the hook eye.',
      'Pass the tag end back through the large loop you just created. Pull tight and trim.',
    ],
    tip: 'The most popular beginner knot. Works great for mono line up to about 20lb test. Always wet it before tightening.',
    imageSearch: 'improved clinch knot fishing steps diagram',
    tutorialUrl: 'https://www.youtube.com/results?search_query=improved+clinch+knot+fishing+how+to+tie',
  },
  {
    name: 'Loop Knot (Non-Slip Mono Loop)',
    difficulty: 'Intermediate',
    diffColor: '#c0c8d8',
    strength: '90%+ line strength',
    use: 'Hard baits like crankbaits and jerkbaits — gives the lure freedom to move naturally',
    steps: [
      'Tie a simple overhand knot in the line about 10 inches from the end — don\'t tighten.',
      'Thread the tag end through the lure eye, then back through the overhand knot.',
      'Wrap the tag end around the main line 4–6 times above the overhand knot.',
      'Pass the tag end back through the overhand knot from the same side it came out. Tighten and trim.',
    ],
    tip: 'This knot creates a loop that lets your crankbait wobble freely. Tied directly to the eye, the knot can restrict action. Worth learning for all hard baits.',
    imageSearch: 'non-slip mono loop knot fishing diagram',
    tutorialUrl: 'https://www.youtube.com/results?search_query=non+slip+loop+knot+fishing+crankbait',
  },
  {
    name: 'Double Uni Knot',
    difficulty: 'Intermediate',
    diffColor: '#c0c8d8',
    strength: '80–90% line strength',
    use: 'Joining two lines — connecting fluorocarbon leader to braid, or replacing a section of line',
    steps: [
      'Overlap the two lines 6 inches. Take one line and double back, making 3–4 wraps around both lines.',
      'Pass the tag end through the loop you created. Pull to snug — but not tight.',
      'Repeat with the other line — wrap 3–4 times, pass through the loop, snug.',
      'Pull both main lines in opposite directions to slide the two knots together. Trim both tags.',
    ],
    tip: 'If you want to use a fluorocarbon leader on your spinning reel (for clear water), this is how you attach it to your main line.',
    imageSearch: 'double uni knot fishing diagram braid to leader',
    tutorialUrl: 'https://www.youtube.com/results?search_query=double+uni+knot+how+to+tie+braid+to+fluorocarbon',
  },
];

const BEGINNER_INVENTORY = {
  hardware: [
    { item: 'Hook — EWG (Extra Wide Gap), 3/0', qty: 'Pack of 25', price: '~$4', why: 'The standard hook for Texas-rigged soft plastics. 3/0 is the most versatile size for bass.' },
    { item: 'Hook — Wide Gap, 1/0 or 2/0', qty: 'Pack of 25', price: '~$3', why: 'For smaller soft plastics and finesse rigging. Wacky rig, ned rig, drop shot.' },
    { item: 'Hook — Aberdeen #4 or #6', qty: 'Pack of 20', price: '~$3', why: 'For crappie and bluegill with live bait. Thin wire is kind to live minnows.' },
    { item: 'Hook — Circle Hook 2/0', qty: 'Pack of 20', price: '~$4', why: 'For catfish with natural bait. The hook sets itself — just reel, no jerk needed.' },
    { item: 'Bullet Sinker (1/8 oz, 1/4 oz)', qty: 'Pack of 10 each', price: '~$3–4', why: 'For Texas rigs and Carolina rigs. 1/8 oz for lighter finesse, 1/4 oz for wind and depth.' },
    { item: 'Split Shot Sinkers (assorted)', qty: 'Assortment pack', price: '~$3', why: 'Pinch onto the line to add weight without re-rigging. Great for drop shot and live bait.' },
    { item: 'Barrel Swivels (size 7 or 8)', qty: 'Pack of 20', price: '~$3', why: 'Prevents line twist when using spinning lures. Required for Carolina rigs.' },
    { item: 'Snap Swivels (size 7)', qty: 'Pack of 20', price: '~$3', why: 'Lets you change lures without re-tying. Attach to your line and clip lures in seconds.' },
    { item: 'Bobbers / Floats — round, 3/4"', qty: 'Pack of 10', price: '~$3', why: 'For crappie and bluegill with live bait. Sets the depth. Red/white classic.' },
    { item: 'Jig Heads — 1/16 oz, size 2 hook', qty: 'Pack of 10', price: '~$4', why: 'For crappie grubs and bluegill. Drop straight down next to structure.' },
    { item: 'Worm Weights (tungsten, 1/4 oz)', qty: 'Pack of 5', price: '~$5', why: 'Better feel than lead — you can feel every rock and root. Worth the upgrade.' },
  ],
  softPlastics: [
    { item: 'Senko / Stick Bait 5" (Gary Yamamoto or YUM)', qty: 'Pack of 10', price: '~$6–9', why: 'The most effective bass lure made. Green pumpkin and watermelon red are must-have colors.' },
    { item: 'Finesse Worm 4–5" (Zoom or Roboworm)', qty: 'Pack of 20', price: '~$4–5', why: 'For drop shot, shaky head, and Carolina rig. Green pumpkin, red shad, morning dawn colors.' },
    { item: 'Z-Man TRD (Ned Rig bait)', qty: 'Pack of 6', price: '~$5', why: 'The specific plastic designed for ned rigs. Floats tail-up off the bottom.' },
    { item: 'Craw / Chunk (Zoom Super Chunk or Missile Craw)', qty: 'Pack of 8', price: '~$4–5', why: 'Trailer for chatterbaits and jigs. Adds bulk and slows the fall. Green pumpkin or black/blue.' },
    { item: 'Curly-Tail Grub 2" (Bobby Garland or Kalin\'s)', qty: 'Pack of 15', price: '~$4', why: 'Crappie and bluegill go-to. White, pink, and chartreuse are top colors.' },
  ],
  hardBaits: [
    { item: 'Chatterbait 3/8 oz (Z-Man or Strike King)', qty: '2 (white/chartreuse + green pumpkin)', price: '~$6–8 each', why: 'One of the most effective search baits for murky-water bass. Add a craw trailer.' },
    { item: 'Spinnerbait 3/8 oz (Strike King or War Eagle)', qty: '2 (white + chartreuse/white)', price: '~$5–7 each', why: 'The most beginner-friendly bass lure. Can\'t fish it wrong — just cast and reel.' },
    { item: 'Bill Lewis Rat-L-Trap (1/2 oz)', qty: '1–2', price: '~$6–8 each', why: 'The iconic lipless crankbait. Red craw in spring, chrome in open water.' },
    { item: 'Beetle Spin 1/32 oz (Johnson)', qty: '3 (white, chartreuse, yellow)', price: '~$3–5 each', why: 'Best bluegill lure ever made. Also catches bass, crappie, and everything else.' },
  ],
  terminal: [
    { item: 'Monofilament Line 8lb test (Stren or Trilene)', qty: '1 spool', price: '~$5–7', why: 'All-purpose line for spinning reels. Good stretch absorbs shock. Start here.' },
    { item: 'Fluorocarbon Leader 8lb (Seaguar)', qty: '1 spool or leader pack', price: '~$8–12', why: 'Invisible in water. Tie as a 2-foot leader for clear-water finesse. More sensitive than mono.' },
    { item: 'Needle-nose pliers', qty: '1', price: '~$8–15', why: 'For removing hooks from fish. Buy fishing-specific — rust-resistant.' },
    { item: 'Line clippers / nail clippers', qty: '1', price: '~$3–5', why: 'For trimming knot tag ends. A small nail clipper works perfectly.' },
    { item: 'Small tackle box or Plano organizer', qty: '1', price: '~$8–15', why: 'A 3700-size Plano box fits everything in this list. Don\'t overthink it.' },
  ],
};

const STORES = [
  { name: 'Walmart', icon: '🏪', detail: 'Fishing aisle in sporting goods. Best for basics, live bait, terminal tackle, and budget lures. Prices beat everyone else on commodity items.', url: 'https://www.walmart.com/browse/sports-outdoors/fishing/4125_4134' },
  { name: 'Bass Pro Shops', icon: '🎣', detail: 'Full selection of everything. Staff can actually help you. Worth the trip when you\'re learning — ask questions. Closest STL location: 1365 South 5th St, St. Charles.', url: 'https://www.basspro.com' },
  { name: 'Cabela\'s', icon: '🦌', detail: 'Sister company to Bass Pro. Same ownership, similar selection. Great sales and clearance racks.', url: 'https://www.cabelas.com' },
  { name: 'Academy Sports + Outdoors', icon: '🏆', detail: 'Strong fishing department, competitive prices, good brand selection. Usually less crowded than Bass Pro.', url: 'https://www.academy.com/c/sports/fishing' },
  { name: 'Amazon', icon: '📦', detail: 'Best for buying in bulk, specialty plastics, and brands not stocked locally. Check reviews carefully. Subscribe & Save on things you use constantly (hooks, split shot, bobbers).', url: 'https://www.amazon.com/s?k=fishing+lures+bass' },
  { name: 'TackleDirect', icon: '🌐', detail: 'Online-only specialty retailer. Great for fluorocarbon line, quality hooks, and gear not found at big box stores.', url: 'https://www.tackledirect.com' },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function NovaCastReference({ onClose }) {
  const [activeTab, setActiveTab] = useState('reels');
  const [expanded, setExpanded] = useState(null);
  const [activeFishTab, setActiveFishTab] = useState('bass');
  const [activeInventoryTab, setActiveInventoryTab] = useState('hardware');

  const toggle = (key) => setExpanded(expanded === key ? null : key);

  const TABS = [
    { key: 'reels',     label: '🎣 Reels' },
    { key: 'lures',     label: '🪝 Lures' },
    { key: 'knots',     label: '🪢 Knots' },
    { key: 'inventory', label: '📦 Starter Kit' },
    { key: 'stores',    label: '🛒 Where to Buy' },
  ];

  const FISH_TABS = [
    { key: 'bass',       label: '🐟 Bass' },
    { key: 'crappie',    label: '🐠 Crappie' },
    { key: 'catfish',    label: '🐱 Catfish' },
    { key: 'bluegill',   label: '🫐 Bluegill' },
    { key: 'smallmouth', label: '🏔️ Smallmouth' },
  ];

  const INV_TABS = [
    { key: 'hardware',     label: 'Hooks & Weights' },
    { key: 'softPlastics', label: 'Soft Plastics' },
    { key: 'hardBaits',    label: 'Hard Baits' },
    { key: 'terminal',     label: 'Line & Tools' },
  ];

  const DiffBadge = ({ label, color }) => (
    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: `${color}22`, color, fontWeight: '600', border: `1px solid ${color}44` }}>
      {label}
    </span>
  );

  const SectionHeader = ({ label }) => (
    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#7a8ea6', fontWeight: '600', marginBottom: '10px', marginTop: '4px' }}>
      {label}
    </div>
  );

  const TabBar = ({ tabs, active, onSelect, small = false }) => (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onSelect(t.key)}
          style={{
            padding: small ? '4px 10px' : '6px 12px',
            borderRadius: '999px',
            fontSize: small ? '11px' : '12px',
            fontWeight: '600',
            cursor: 'pointer',
            border: `1.5px solid ${active === t.key ? '#00e5c7' : '#1e3a5f'}`,
            background: active === t.key ? 'rgba(0,229,199,0.1)' : '#152a4f',
            color: active === t.key ? '#00e5c7' : '#7a8ea6',
            transition: 'all 0.15s',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  // ── REELS TAB ─────────────────────────────────────────────────────────────
  const ReelsTab = () => (
    <div>
      <div style={{ fontSize: '13px', color: '#7a8ea6', marginBottom: '14px', lineHeight: '1.6' }}>
        Not sure what reel you have? The easiest way to tell: a spinning reel hangs underneath the rod. A baitcaster sits on top. A spincast has a closed nose cone with a push button.
      </div>
      {REELS.map((r, i) => (
        <div key={r.name} style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '14px', padding: '16px', marginBottom: '10px' }}>
          <div
            onClick={() => toggle(`reel-${i}`)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <span style={{ fontSize: '22px' }}>{r.icon}</span>
              <div>
                <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>{r.name}</div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <DiffBadge label={r.difficulty} color={r.diffColor} />
                  <span style={{ fontSize: '11px', color: '#7a8ea6' }}>{r.price}</span>
                </div>
              </div>
            </div>
            {expanded === `reel-${i}` ? <ChevronUp size={16} color="#7a8ea6" /> : <ChevronDown size={16} color="#7a8ea6" />}
          </div>

          {expanded === `reel-${i}` && (
            <div style={{ marginTop: '14px', borderTop: '1px solid #1e3a5f', paddingTop: '14px' }}>
              <p style={{ fontSize: '13px', color: '#c0c8d8', lineHeight: '1.6', marginBottom: '12px' }}>{r.summary}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div style={{ background: 'rgba(0,229,199,0.06)', border: '1px solid rgba(0,229,199,0.2)', borderRadius: '10px', padding: '10px' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#00e5c7', fontWeight: '600', marginBottom: '6px' }}>Pros</div>
                  {r.pros.map((p, j) => <div key={j} style={{ fontSize: '12px', color: '#c0c8d8', marginBottom: '3px', lineHeight: '1.4' }}>✓ {p}</div>)}
                </div>
                <div style={{ background: 'rgba(224,92,92,0.06)', border: '1px solid rgba(224,92,92,0.2)', borderRadius: '10px', padding: '10px' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#e05c5c', fontWeight: '600', marginBottom: '6px' }}>Cons</div>
                  {r.cons.map((c, j) => <div key={j} style={{ fontSize: '12px', color: '#c0c8d8', marginBottom: '3px', lineHeight: '1.4' }}>✗ {c}</div>)}
                </div>
              </div>

              <div style={{ background: '#152a4f', borderRadius: '10px', padding: '10px', marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#7a8ea6', fontWeight: '600', marginBottom: '6px' }}>Best For</div>
                <div style={{ fontSize: '12px', color: '#c0c8d8' }}>{r.bestFor}</div>
              </div>

              <div style={{ background: '#152a4f', borderRadius: '10px', padding: '10px', marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#7a8ea6', fontWeight: '600', marginBottom: '6px' }}>How to Use It</div>
                <div style={{ fontSize: '12px', color: '#c0c8d8', lineHeight: '1.5' }}>{r.howToUse}</div>
              </div>

              <div style={{ background: '#152a4f', borderRadius: '10px', padding: '10px', marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#7a8ea6', fontWeight: '600', marginBottom: '6px' }}>Budget-Friendly Picks</div>
                {r.brands.map((b, j) => <div key={j} style={{ fontSize: '12px', color: '#c0c8d8', marginBottom: '2px' }}>• {b}</div>)}
              </div>

              <a
                href={r.tutorialUrl}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#5cc8e0', textDecoration: 'none' }}
              >
                <ExternalLink size={13} /> Watch tutorials on YouTube
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // ── LURES TAB ─────────────────────────────────────────────────────────────
  const LuresTab = () => {
    const lures = LURES_BY_SPECIES[activeFishTab] || [];
    return (
      <div>
        <TabBar tabs={FISH_TABS} active={activeFishTab} onSelect={setActiveFishTab} small />
        {lures.map((l, i) => (
          <div key={l.name} style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '14px', padding: '16px', marginBottom: '10px' }}>
            <div onClick={() => toggle(`lure-${activeFishTab}-${i}`)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '18px' }}>{l.icon}</span>
                    <span style={{ fontWeight: '600', fontSize: '14px' }}>{l.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(26,107,138,0.3)', color: '#5cc8e0', fontWeight: '500' }}>{l.type}</span>
                    <span style={{ fontSize: '11px', color: '#7a8ea6' }}>{l.price}</span>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(0,229,199,0.1)', color: '#00e5c7', fontWeight: '500' }}>{l.difficulty}</span>
                  </div>
                </div>
                {expanded === `lure-${activeFishTab}-${i}` ? <ChevronUp size={16} color="#7a8ea6" /> : <ChevronDown size={16} color="#7a8ea6" />}
              </div>
            </div>

            {expanded === `lure-${activeFishTab}-${i}` && (
              <div style={{ marginTop: '14px', borderTop: '1px solid #1e3a5f', paddingTop: '14px' }}>
                <p style={{ fontSize: '13px', color: '#c0c8d8', lineHeight: '1.6', marginBottom: '12px' }}>{l.summary}</p>

                <div style={{ background: '#152a4f', borderRadius: '10px', padding: '10px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#00e5c7', fontWeight: '600', marginBottom: '5px' }}>How to Fish It</div>
                  <div style={{ fontSize: '12px', color: '#c0c8d8', lineHeight: '1.5' }}>{l.technique}</div>
                </div>

                <div style={{ background: '#152a4f', borderRadius: '10px', padding: '10px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#7a8ea6', fontWeight: '600', marginBottom: '5px' }}>Best Conditions</div>
                  <div style={{ fontSize: '12px', color: '#c0c8d8' }}>{l.bestConditions}</div>
                </div>

                <div style={{ background: '#152a4f', borderRadius: '10px', padding: '10px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#7a8ea6', fontWeight: '600', marginBottom: '5px' }}>Best Colors</div>
                  <div style={{ fontSize: '12px', color: '#c0c8d8' }}>{l.colors}</div>
                </div>

                <div style={{ background: 'rgba(192,200,216,0.06)', border: '1px solid rgba(192,200,216,0.2)', borderRadius: '10px', padding: '10px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#c0c8d8', lineHeight: '1.5' }}>
                    <strong style={{ color: '#fff' }}>Pro Tip:</strong> {l.tip}
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#7a8ea6' }}>📍 Find it at: {l.whereToGet}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // ── KNOTS TAB ─────────────────────────────────────────────────────────────
  const KnotsTab = () => (
    <div>
      <div style={{ fontSize: '13px', color: '#7a8ea6', marginBottom: '14px', lineHeight: '1.6' }}>
        You only need to know 2 knots to fish confidently. Learn the Palomar first — it's the strongest and simplest. The Improved Clinch is the backup. The rest come later.
      </div>
      {KNOTS.map((k, i) => (
        <div key={k.name} style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '14px', padding: '16px', marginBottom: '10px' }}>
          <div onClick={() => toggle(`knot-${i}`)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontWeight: '600', fontSize: '15px' }}>{k.name}</span>
                <DiffBadge label={k.difficulty} color={k.diffColor} />
              </div>
              <div style={{ fontSize: '11px', color: '#7a8ea6' }}>{k.use}</div>
            </div>
            {expanded === `knot-${i}` ? <ChevronUp size={16} color="#7a8ea6" /> : <ChevronDown size={16} color="#7a8ea6" />}
          </div>

          {expanded === `knot-${i}` && (
            <div style={{ marginTop: '14px', borderTop: '1px solid #1e3a5f', paddingTop: '14px' }}>
              <div style={{ background: 'rgba(0,229,199,0.08)', border: '1px solid rgba(0,229,199,0.2)', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', fontSize: '12px', color: '#00e5c7' }}>
                Line strength retained: {k.strength}
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#7a8ea6', fontWeight: '600', marginBottom: '8px' }}>Steps</div>
                {k.steps.map((step, j) => (
                  <div key={j} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,229,199,0.15)', border: '1px solid rgba(0,229,199,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', color: '#00e5c7', fontWeight: '700' }}>{j + 1}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#c0c8d8', lineHeight: '1.5', paddingTop: '2px' }}>{step}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(192,200,216,0.06)', border: '1px solid rgba(192,200,216,0.2)', borderRadius: '10px', padding: '10px', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', color: '#c0c8d8', lineHeight: '1.5' }}>
                  <strong style={{ color: '#fff' }}>Tip:</strong> {k.tip}
                </div>
              </div>

              <a
                href={k.tutorialUrl}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#5cc8e0', textDecoration: 'none' }}
              >
                <ExternalLink size={13} /> Watch on YouTube — visual step-by-step
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // ── INVENTORY TAB ─────────────────────────────────────────────────────────
  const InventoryTab = () => {
    const items = BEGINNER_INVENTORY[activeInventoryTab] || [];
    return (
      <div>
        <div style={{ fontSize: '13px', color: '#7a8ea6', marginBottom: '12px', lineHeight: '1.6' }}>
          Everything you need to start fishing seriously — no fluff, no duplicates. Total cost if you bought everything: roughly $80–120. You can spread it out.
        </div>
        <TabBar tabs={INV_TABS} active={activeInventoryTab} onSelect={setActiveInventoryTab} small />
        {items.map((item, i) => (
          <div key={i} style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '12px 14px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', color: '#e8f0f8', flex: 1, paddingRight: '8px' }}>{item.item}</div>
              <div style={{ fontSize: '11px', color: '#00e5c7', fontWeight: '600', flexShrink: 0 }}>{item.price}</div>
            </div>
            <div style={{ fontSize: '11px', color: '#7a8ea6', marginBottom: '4px' }}>{item.qty}</div>
            <div style={{ fontSize: '12px', color: '#c0c8d8', lineHeight: '1.5' }}>{item.why}</div>
          </div>
        ))}
      </div>
    );
  };

  // ── STORES TAB ────────────────────────────────────────────────────────────
  const StoresTab = () => (
    <div>
      <div style={{ fontSize: '13px', color: '#7a8ea6', marginBottom: '14px', lineHeight: '1.6' }}>
        For basics and live bait — Walmart. For learning and quality gear — Bass Pro. For bulk and specialty — Amazon. That's the short version.
      </div>
      {STORES.map((s, i) => (
        <div key={i} style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '14px', padding: '16px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '20px' }}>{s.icon}</span>
                <span style={{ fontWeight: '600', fontSize: '15px' }}>{s.name}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#c0c8d8', lineHeight: '1.5' }}>{s.detail}</div>
            </div>
          </div>
          <a
            href={s.url}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '10px', fontSize: '12px', color: '#5cc8e0', textDecoration: 'none' }}
          >
            <ExternalLink size={12} /> Browse online
          </a>
        </div>
      ))}
    </div>
  );

  // ── MAIN RENDER ───────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.97)', zIndex: 50,
      overflowY: 'auto', fontFamily: "'DM Sans', sans-serif", color: '#e8f0f8',
    }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 16px 100px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', paddingBottom: '16px', borderBottom: '1px solid #1e3a5f', marginBottom: '16px' }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '2px', color: '#00e5c7' }}>Reference Guide</div>
            <div style={{ fontSize: '12px', color: '#7a8ea6' }}>Everything you need to know — no assumed experience</div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#7a8ea6', cursor: 'pointer' }}>
              <X size={22} />
            </button>
          )}
        </div>

        {/* Main tabs */}
        <TabBar tabs={TABS} active={activeTab} onSelect={setActiveTab} />

        {activeTab === 'reels'     && <ReelsTab />}
        {activeTab === 'lures'     && <LuresTab />}
        {activeTab === 'knots'     && <KnotsTab />}
        {activeTab === 'inventory' && <InventoryTab />}
        {activeTab === 'stores'    && <StoresTab />}
      </div>
    </div>
  );
}
