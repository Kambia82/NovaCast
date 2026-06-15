export interface Lure {
  name: string;
  reason: string;
  score: number;
  for: string[];
  talkingPoint?: string;
  technique?: string;
  tooltip?: string;
  isBold?: boolean;
}

export interface Spot {
  name: string;
  detail: string;
  shallow?: boolean;
  deep?: boolean;
  always?: boolean;
}

export interface FishMovement {
  title: string;
  depthPct: number;
  moveText: string;
}

export interface ColorRec {
  name: string;
  hex: string;
  tooltip?: string;
}

export interface ColorResult {
  colors: ColorRec[];
  reason: string;
}

export interface WalmartItem {
  name: string;
  detail: string;
  price: string;
}

export const TOOLTIPS: Record<string, string> = {
  'Chartreuse': 'A bright yellow-green color. Stands out in murky water like a highlighter.',
  'Texas Rig': 'A weedless setup where the hook point is buried inside the soft plastic bait so it doesn\'t snag on weeds or rocks.',
  'Carolina Rig': 'A setup with a weight separated from the hook by a swivel and leader line, letting the bait float naturally above the bottom.',
  'Drop Shot': 'A finesse rig where the hook is tied above a bottom weight, keeping the bait suspended off the bottom.',
  'Shaky Head': 'A small jighead with a light wire hook, designed to be shaken in place rather than retrieved.',
  'Ned Rig': 'A tiny mushroom-shaped jighead with a short soft plastic bait. Incredibly simple and effective.',
  'Wacky Rig': 'A soft plastic stick bait hooked through the middle so both ends wiggle as it falls.',
  'Chatterbait': 'A jig with a vibrating metal blade on the front that creates flash and vibration as you retrieve it.',
  'Spinnerbait': 'A wire frame with spinning metal blades that flash and vibrate through the water.',
  'Football Jig': 'A jighead shaped like a football that stays upright on rocky bottoms.',
  'Buzzbait': 'A surface lure with a spinning blade that churns the water as you reel it in.',
  'Crankbait': 'A hard plastic lure with a lip that makes it dive and wobble like a swimming baitfish.',
  'Lipless Crankbait': 'A sinking crankbait without a diving lip. You yo-yo it up and down off the bottom.',
  'Tube Bait': 'A hollow soft plastic shaped like a small tube with tentacles. Mimics a crawfish or baitfish.',
  'Beetle Spin': 'A tiny spinner lure with a soft plastic grub. A classic beginner bluegill lure.',
  'Palomar Knot': 'One of the strongest and easiest fishing knots. Great for attaching hooks and lures.',
  'Improved Clinch Knot': 'The most common beginner knot. Simple to tie and works well for most line sizes.',
  'Quick-Snap': 'A small metal clip that lets you change lures without re-tying. Saves tons of time.',
  'Finesse': 'A slow, subtle fishing style using small baits and gentle movements. The opposite of power fishing.',
  'Slow-Roll': 'Reeling a lure just fast enough to keep the blade spinning — very slow and near the bottom.',
  'Jig Vertically': 'Dropping your lure straight down and lifting it up and down in one spot, usually next to a dock or brush.',
  'Carolina Keepers': 'Small rubber weights that pinch onto your line to adjust depth without re-tying.',
};

export const KNOT_GUIDES = {
  palomar: {
    name: 'Palomar Knot',
    steps: [
      'Double about 6 inches of line and pass the loop through the eye of the hook.',
      'Tie an overhand knot with the doubled line — just a simple loop, don\'t pull tight yet.',
      'Pull the hook/lure through the loop you just made, then pull both ends to tighten.',
    ],
    tip: 'This is the strongest knot for most fishing. It retains about 95% of line strength. Use it for everything.',
  },
  clinch: {
    name: 'Improved Clinch Knot',
    steps: [
      'Thread the line through the hook eye, then wrap the tag end around the main line 5–7 times.',
      'Pass the tag end through the small loop just above the eye of the hook.',
      'Then pass it back through the big loop you just created and pull tight. Trim the tag end.',
    ],
    tip: 'The most popular beginner knot. Works great for monofilament line up to about 20lb test.',
  },
  quicksnap: {
    name: 'Using Quick-Snaps',
    steps: [
      'Tie a Quick-Snap swivel to the end of your line using a Palomar knot.',
      'To change lures, simply open the snap, slide the old lure off and the new one on, then close it.',
      'Keep 2–3 Quick-Snaps in your tacklebox. They save you from re-tying every time you switch lures.',
    ],
    tip: 'Quick-Snaps are a game-changer for beginners. You\'ll switch lures 5x faster and spend more time fishing.',
  },
};

export function getFishMovement(time: string, sky: string): FishMovement {
  if (time === 'night') return { title: 'Night — Fish Roaming Shallow & Aggressive', depthPct: 22, moveText: 'Water temp evens out top-to-bottom at night — no hot surface layer pushing fish down. Bass and crappie move very shallow (1–4 ft) to feed on baitfish near the bank. One of the most underrated windows. Stay quiet — no lights in the water, no splashing.' };
  if (time === 'dawn') return { title: 'Dawn — Best Window of the Day', depthPct: 18, moveText: 'Water is at its coolest and most oxygenated. Fish are still in shallow feeding mode from the night. The first 90 minutes after sunrise is statistically the top time on the water. They\'re sitting in 2–5 ft along the bank.' };
  if (time === 'morning') return { title: 'Morning — Active, Moving to Structure', depthPct: 32, moveText: 'Surface water is warming but hasn\'t hit uncomfortable levels. Bass are still fairly shallow (3–6 ft) but shifting toward structure — docks, fallen trees, brush — rather than open bank. Work dock edges and cover.' };
  if (time === 'midday') {
    if (sky === 'overcast' || sky === 'rainy') return { title: 'Midday — Overcast Keeps Fish Higher', depthPct: 42, moveText: 'No direct sun means the surface hasn\'t baked. Fish stay shallower than a sunny midday — maybe 4–7 ft. Cloud cover is working in your favor right now. Still focus on structure but don\'t go too deep.' };
    return { title: 'Midday Sunny — Fish Deep or in Shade', depthPct: 80, moveText: 'Sun is heating the top 3–4 ft of water. Fish have moved into shaded structure (under docks, brush) or dropped to 8–15 ft where it\'s cooler. Don\'t waste casts on open shallow water. Find shade or go deep.' };
  }
  if (time === 'afternoon') return { title: 'Afternoon — Starting to Come Back Up', depthPct: 52, moveText: 'Surface is cooling from peak midday heat. Fish begin shifting from deep structure back toward mid-depth (5–8 ft) as afternoon goes on. Work transition areas — drop-offs and edges between deep and shallow.' };
  if (time === 'evening') return { title: 'Evening — Second Best Window, Back Shallow', depthPct: 24, moveText: 'As sun drops, surface cools and fish move back shallow to feed. Aggressive and easy to find — back in 2–5 ft along bank structure and coves. Evening topwater can be explosive. Second best window of the day.' };
  return { title: 'Fish Movement', depthPct: 40, moveText: '' };
}

export function getGeneralBestRecommendation(month: number): { lures: Lure[]; colors: ColorResult; tip: string } {
  const isSpawn = month >= 3 && month <= 5;
  const isSummer = month >= 6 && month <= 8;
  const isFall = month >= 9 && month <= 11;

  if (isSpawn) {
    return {
      lures: [
        { name: 'Spinnerbait (Chartreuse/White)', reason: 'Spring spawn staple. Covers water fast and triggers reaction strikes from aggressive bass.', score: 5, for: ['bass', 'anything'], talkingPoint: 'Bass are territorial during spawn — they\'ll hit a spinnerbait to chase it away from their bed, not just to eat it.', technique: 'Cast parallel to the bank and reel at a steady medium pace. If you feel a bump, don\'t set the hook immediately — count to 2 first.', isBold: true },
        { name: 'Curly-tail Grub on 1/16 oz Jig', reason: 'The ultimate spring crappie lure. Jig vertically next to structure at 3–5 ft.', score: 5, for: ['crappie', 'anything'], talkingPoint: 'Crappie stack around brush and docks during spawn. A small jig dropped right in front of them is almost guaranteed.', technique: 'Drop it straight down next to a dock piling. Lift it up 6 inches, let it fall. Repeat. Most hits come on the fall.' },
        { name: 'Ned Rig (Z-Man TRD)', reason: 'Most versatile lure ever. Works in almost any condition for multiple species.', score: 3, for: ['bass', 'anything', 'smallmouth'], talkingPoint: 'The Ned Rig catches fish when nothing else will. It\'s small, non-threatening, and looks like an easy meal.', technique: 'Cast it out, let it sink to the bottom, then drag it slowly with your rod tip. Small hops. Don\'t overwork it.' },
      ],
      colors: { colors: [{ name: 'Chartreuse', hex: '#d4f542', tooltip: 'A bright yellow-green color. Stands out in murky water like a highlighter.' }, { name: 'Green Pumpkin', hex: '#5a7a2a', tooltip: 'A natural olive-green. The most versatile soft plastic color ever made.' }, { name: 'White', hex: '#f0f0f0' }], reason: 'Spring colors: chartreuse for reaction strikes, green pumpkin for natural presentations, white for visibility.' },
      tip: 'Spring is the best time to start fishing. Bass and crappie are shallow and aggressive. Focus on banks, docks, and any visible structure.',
    };
  }
  if (isSummer) {
    return {
      lures: [
        { name: 'Topwater Popper / Frog', reason: 'Early morning and evening topwater is explosive in summer.', score: 5, for: ['bass', 'anything'], talkingPoint: 'Summer bass ambush baitfish from cover. A popper mimics a struggling baitfish on the surface — they can\'t resist it.', technique: 'Cast near lily pads or weed edges. Pop it once, wait 3 seconds, pop again. The pause is when they strike.' },
        { name: 'Drop Shot (Finesse Worm)', reason: 'When fish go deep in midday heat, a drop shot keeps your bait at their level.', score: 4, for: ['bass', 'anything'], talkingPoint: 'Summer heat pushes bass deep. A drop shot suspends your bait right in front of them without spooking them.', technique: 'Drop it straight down, keep the line tight, and barely wiggle the rod tip. The bait does the work.' },
        { name: 'Ned Rig (Z-Man TRD)', reason: 'Versatile finesse option that works in any depth.', score: 3, for: ['bass', 'anything', 'smallmouth'], talkingPoint: 'The Ned Rig catches fish when nothing else will. It\'s small, non-threatening, and looks like an easy meal.', technique: 'Cast it out, let it sink to the bottom, then drag it slowly with your rod tip. Small hops. Don\'t overwork it.' },
      ],
      colors: { colors: [{ name: 'White', hex: '#f0f0f0' }, { name: 'Watermelon Red', hex: '#a83248' }, { name: 'Shad', hex: '#9aacb8' }], reason: 'Summer colors: white for topwater, natural shad colors for deeper presentations.' },
      tip: 'Summer means early mornings and late evenings are your best windows. Fish deep during midday. Topwater at dawn is the most fun you can have fishing.',
    };
  }
  if (isFall) {
    return {
      lures: [
        { name: 'Lipless Crankbait (Shad Color)', reason: 'Fall bass chase shad aggressively. A lipless crankbait covers water fast.', score: 5, for: ['bass', 'anything'], talkingPoint: 'Fall means the shad migration — bass are feeding heavily on baitfish schools. A crankbait that looks like a shad is automatic.', technique: 'Cast long and reel at a medium-fast pace. Yo-yo it: reel 3 turns, pause, let it sink a foot, reel 3 more. Hits come on the pause.' },
        { name: 'Spinnerbait (White/Chartreuse)', reason: 'Fall bass are aggressive and a spinnerbait triggers reaction strikes.', score: 4, for: ['bass', 'anything'], talkingPoint: 'Fall bass are putting on weight for winter. They\'ll chase a spinnerbait further than any other time of year.', technique: 'Cast to the bank and reel steadily. Vary your speed until you find what they want. If you get a short strike, speed up.' },
        { name: 'Curly-tail Grub on 1/16 oz Jig', reason: 'Crappie feed heavily in fall before winter. Jig vertically near brush.', score: 4, for: ['crappie', 'anything'], talkingPoint: 'Fall crappie school up in deeper brush piles. Find one and you can catch 20 in a single spot.', technique: 'Drop it straight down next to brush. Lift and drop slowly. When you feel weight, set the hook — crappie have soft mouths.' },
      ],
      colors: { colors: [{ name: 'Shad', hex: '#9aacb8' }, { name: 'Chartreuse', hex: '#d4f542', tooltip: 'A bright yellow-green color. Stands out in murky water like a highlighter.' }, { name: 'Orange', hex: '#ff6b1a' }], reason: 'Fall colors: match the shad with natural tones, or go bold with orange/chartreuse for aggressive fish.' },
      tip: 'Fall is the best feeding window of the year. Fish are aggressive and predictable. Cover water fast with search baits.',
    };
  }
  // Winter
  return {
    lures: [
      { name: 'Football Jig (Brown/Orange)', reason: 'Cold water = crawfish. Drag it painfully slowly along the bottom.', score: 5, for: ['bass', 'anything'], talkingPoint: 'Winter bass barely move. A football jig dragged right past their nose is one of the few things they\'ll eat.', technique: 'Cast, let it sink, then drag it 6 inches and wait 10 seconds. Drag 6 more inches, wait. When you think you\'re going slow enough — go slower.' },
      { name: 'Drop Shot (Finesse Worm)', reason: 'Suspended presentation for lethargic cold-water fish.', score: 4, for: ['bass', 'anything'], talkingPoint: 'In cold water, bass won\'t chase. A drop shot keeps the bait in their face until they decide to eat it.', technique: 'Drop it straight down in the deepest water you can find. Barely move it. Patience is everything in winter.' },
      { name: 'Live Minnow on Bobber', reason: 'When nothing else works, live bait always works.', score: 4, for: ['crappie', 'anything'], talkingPoint: 'Winter crappie will eat a live minnow when they won\'t touch anything artificial. It\'s not cheating — it\'s smart.', technique: 'Set your bobber at 8–12 ft deep near brush piles. Let the minnow do the work. Check it every 15 minutes.' },
    ],
    colors: { colors: [{ name: 'Brown/Orange', hex: '#8b4513' }, { name: 'Green Pumpkin', hex: '#5a7a2a', tooltip: 'A natural olive-green. The most versatile soft plastic color ever made.' }, { name: 'Smoke', hex: '#c8c8c8' }], reason: 'Winter colors: natural and subtle. Fish are sluggish and suspicious — match what they eat.' },
    tip: 'Winter fishing is slow but rewarding. The key is patience and depth. Fish the deepest water near structure and slow everything down.',
  };
}

export function applyRecentWeatherToDepth(mv: FishMovement, rw: string[]): FishMovement {
  if (!rw || rw.length === 0) return mv;
  const result = { ...mv };
  if (rw.includes('heavy_rain_24h')) {
    result.depthPct = Math.max(10, result.depthPct - 25);
    result.moveText += ' Heavy recent rain has pushed fish into newly flooded shallow areas — look for water that just recently covered brush, grass, and bank vegetation.';
  }
  if (rw.includes('temp_drop')) {
    result.depthPct = Math.min(90, result.depthPct + 20);
    result.moveText += ' The recent cold front dropped fish deeper and made them lethargic. Expect them 2–4 ft deeper than normal for this time of day.';
  }
  if (rw.includes('warm_streak')) {
    result.depthPct = Math.max(10, result.depthPct - 15);
    result.moveText += ' The warm streak has accelerated spawning — fish are shallower than you\'d normally expect for this time of day.';
  }
  return result;
}

export function getRecentWeatherImpact(rw: string[]): string[] | null {
  if (!rw || rw.length === 0) return null;
  const impacts: string[] = [];
  if (rw.includes('heavy_rain_24h')) impacts.push('<strong>Heavy rain in last 24hrs:</strong> Runoff has muddied the water and raised the level. Fish moved into newly flooded areas — shallow bushes, grass, and timber that\'s now underwater. Work those edges aggressively with a spinnerbait or chatterbait. The murky water actually helps you.');
  if (rw.includes('light_rain_yesterday')) impacts.push('<strong>Light rain yesterday:</strong> Water is slightly off-color and fish are transitioning back to normal. They\'re a little sluggish but feeding. Focus on structure near the bank rather than open water.');
  if (rw.includes('rain_2_3_days')) impacts.push('<strong>Rained 2–3 days ago:</strong> Clarity is recovering. Fish are settling back into normal patterns but still holding slightly deeper than usual. Check both shallow and mid-depth — it\'s a transitional day.');
  if (rw.includes('temp_drop')) impacts.push('<strong>Recent temperature drop:</strong> Cold front aftermath — this is the toughest condition in fishing. Fish went deep and stopped chasing. Finesse only: drop shot, shaky head, slow jig. Patience required. Morning and evening are your only real windows today.');
  if (rw.includes('warm_streak')) impacts.push('<strong>Warm streak (3+ days):</strong> Water has warmed faster than seasonal average. Spawn is further along — some bass are already on beds. Fish are shallower than normal for this time of year. Check the shallowest water first.');
  if (rw.includes('no_rain_week')) impacts.push('<strong>No rain in a week+:</strong> Water is clear and settled — fish have returned to predictable structure. Go finesse and natural colors. They\'ve seen every lure thrown at them this week, so downsize and slow down.');
  return impacts;
}

export function getBarometricImpact(pressure: string): { title: string; text: string; depthAdj: number; activityMod: number } | null {
  switch (pressure) {
    case 'falling':
      return { title: 'Falling Barometer', text: 'Barometric pressure is dropping — a front is moving in. This is one of the best feeding triggers in fishing. Fish sense the change and feed aggressively before the weather hits. Cover water fast with search baits. This window can be short — fish it hard.', depthAdj: -10, activityMod: 2 };
    case 'steady_low':
      return { title: 'Low Pressure (Steady)', text: 'Low pressure means a front has arrived or is sitting overhead. Fish are still adjusting — they\'ve moved slightly shallower and are less pressured by bright sun. Good conditions overall. Work slightly shallower than normal.', depthAdj: -8, activityMod: 1 };
    case 'rising':
      return { title: 'Rising Barometer', text: 'Pressure is climbing after a front passed through. This is the toughest barometric condition — fish are sluggish, tucked tight to cover, and not chasing anything. Slow way down. Finesse presentations only. Fish the thickest cover you can find.', depthAdj: 15, activityMod: -2 };
    case 'steady_high':
      return { title: 'High Pressure (Steady)', text: 'High pressure means clear skies and stable weather. Fish have settled into predictable patterns but are holding tighter to structure. They\'re catchable but not aggressive — you need to put the bait right on them. Focus on shade and structure.', depthAdj: 8, activityMod: -1 };
    default:
      return null;
  }
}

export function getSpots(spots: Spot[], time: string, sky: string): Spot[] {
  const isDeep = time === 'midday' && (sky === 'sunny' || sky === 'partly');
  const isShallow = ['night', 'dawn', 'morning', 'evening'].includes(time) || sky === 'overcast' || sky === 'rainy';
  return [...spots].sort((a, b) => {
    const sA = (a.always ? 3 : 0) + (isShallow && a.shallow ? 2 : 0) + (isDeep && a.deep ? 2 : 0);
    const sB = (b.always ? 3 : 0) + (isShallow && b.shallow ? 2 : 0) + (isDeep && b.deep ? 2 : 0);
    return sB - sA;
  });
}

export function getLures(sky: string, water: string, temp: string, fish: string, time: string, pressure?: string): Lure[] {
  const isNight = time === 'night';
  const isDawn = time === 'dawn' || time === 'evening';
  const isMidSun = time === 'midday' && (sky === 'sunny' || sky === 'partly');
  const isOvercast = sky === 'overcast' || sky === 'rainy';
  const isMurky = water === 'murky' || water === 'stained';
  const isClear = water === 'clear' || water === 'green';
  const isCold = temp === 'cold';
  const isCool = temp === 'cool';
  const isWarm = temp === 'warm';
  const isFalling = pressure === 'falling';
  const isRising = pressure === 'rising';
  const isHighSteady = pressure === 'steady_high';

  const ALL_LURES: Lure[] = [
    // ── BASS / ANYTHING ──────────────────────────────────────────────────
    { name: 'Black Buzzbait', reason: 'Night + shallow = buzzbait territory. Surface disturbance draws bass up from below.', score: (isNight ? 5 : 0) + (isMurky ? 1 : 0), for: ['bass', 'anything'], talkingPoint: 'At night, bass hunt by sensing surface vibration. A buzzbait creates just enough commotion to draw them up from the depths.', technique: 'Cast parallel to the bank. Reel just fast enough to keep the blade spinning on the surface. Steady pace — don\'t stop.', isBold: false },
    { name: 'Black Jig w/ Crawfish Trailer', reason: 'Night fishing demands a big silhouette. Black creates the strongest outline in zero visibility.', score: (isNight ? 4 : 0) + (isCold || isCool ? 1 : 0), for: ['bass', 'anything'], talkingPoint: 'Bass can\'t see color at night — they see silhouettes. Black stands out against the sky above better than any other color.', technique: 'Cast to the bank, let it sink to the bottom, then drag it slowly. Lift your rod tip 6 inches, let it fall back. Most hits come on the fall.', isBold: false },
    { name: 'Topwater Popper / Frog', reason: isOvercast ? 'Overcast = topwater prime time. Fish sit higher, bolder. Long pauses, explosive strikes.' : 'Dawn/dusk topwater window. Work it slow with pauses along the bank edges.', score: (isOvercast && !isNight ? 4 : 0) + (isDawn && !isNight ? 3 : 0) + (isWarm ? 1 : 0), for: ['bass', 'anything'], talkingPoint: isOvercast ? 'Cloud cover makes bass feel safe near the surface. They\'ll hit a topwater when they\'d never chase a deep lure.' : 'Dawn and dusk are when baitfish are most active near the surface — bass know this and wait for them.', technique: 'Cast near cover (lily pads, docks, overhanging trees). Pop it once, wait 3 seconds. Pop again. The pause is when they strike — don\'t set the hook until you feel weight.', isBold: false },
    { name: 'Chatterbait / Bladed Jig', reason: isMurky && isOvercast ? 'IDEAL combo — murky + overcast means fish are aggressive and can\'t see well. Vibration + flash covers water fast.' : isMurky ? 'Murky water + vibrating blade = fish can feel it coming.' : 'Good all-around search bait for active fish.', score: (isMurky ? 3 : 0) + (isOvercast ? 2 : 0) + (!isCold ? 1 : 0), for: ['bass', 'anything'], talkingPoint: isMurky ? 'In murky water, fish find food by feeling vibration. A chatterbait\'s blade thumps like a heartbeat — they zero in on it.' : 'The chatterbait combines flash and vibration. It\'s like a spinnerbait that rattles — fish can\'t ignore it.', technique: 'Cast and reel at a steady medium pace. If you feel grass, rip it through hard — that\'s when strikes happen. Keep your rod tip at 10 o\'clock.', isBold: true },
    { name: 'Spinnerbait (Chartreuse/White)', reason: isMurky && isCool ? 'Murky + cool water is the spinnerbait\'s home turf. Slow-roll it near the bottom.' : 'Versatile search bait. Flash and vibration works in off-color water.', score: (isMurky ? 3 : 0) + (isCool || isCold ? 1 : 0) + (isOvercast ? 1 : 0), for: ['bass', 'anything'], talkingPoint: 'The spinnerbait is the most forgiving lure for beginners. You can\'t fish it wrong — just cast and reel. The blade does the work.', technique: 'Cast to the bank and reel steadily. Try different speeds until you get a bite. If you feel a tick, don\'t set the hook immediately — count to 2.', isBold: true },
    { name: 'Football Jig (Brown/Orange)', reason: isCold && isMidSun ? 'Cold water + midday = fish are deep and sluggish. Drag it inch-by-inch along the bottom.' : 'Cold/cool water = crawfish time. Drag painfully slow.', score: (isCold ? 4 : 0) + (isCool ? 2 : 0) + (isMidSun ? 1 : 0), for: ['bass', 'anything'], talkingPoint: 'Brown/orange mimics a crawfish — bass\'s #1 food source in cool water. When water is cold, crawfish are the only thing still moving slowly on the bottom.', technique: 'Cast, let it sink, then drag it along the bottom with your rod. 6 inches at a time, then pause. When you feel resistance, lean into it — don\'t jerk.', isBold: false },
    { name: 'Drop Shot (Finesse Worm)', reason: isMidSun && isClear ? 'Sunny midday + clear water = toughest conditions. Drop shot keeps your bait at their depth.' : 'Finesse presentation for pressured or deep fish.', score: (isMidSun ? 3 : 0) + (isClear ? 2 : 0) + (isCold || isCool ? 1 : 0), for: ['bass', 'anything'], talkingPoint: 'When fish are suspended or pressured, a drop shot puts the bait right in front of them and keeps it there. They don\'t have to chase it.', technique: 'Drop it straight down. Keep the line tight. Gently shake the rod tip — the worm dances in place. When you feel a tap, reel down and set the hook sideways.', isBold: false },
    { name: 'Shaky Head (Green Pumpkin Worm)', reason: isClear && !isMidSun ? 'Clear water + active fish = shaky head. Subtle, natural presentation.' : 'Clear water demands subtlety. Natural colors and slow presentation.', score: (isClear ? 3 : 0) + (!isMidSun ? 1 : 0) + (isCool || isWarm ? 1 : 0), for: ['bass', 'anything'], talkingPoint: 'In clear water, fish can see every detail. A shaky head with a green pumpkin worm looks exactly like a small creature on the bottom — they can\'t tell it\'s fake.', technique: 'Cast, let it sink, then barely shake your rod tip while reeling very slowly. The worm quivers in place. When you feel a tap, reel fast and set the hook.', isBold: false },
    { name: 'Shallow Crankbait (Shad Color)', reason: isClear && isOvercast ? 'Clear water + overcast = bass are aggressive. Crankbait covers water fast.' : 'Good covering bait when fish are active.', score: (isClear ? 2 : 0) + (isOvercast ? 2 : 0) + (isWarm ? 1 : 0) + (!isCold ? 1 : 0), for: ['bass', 'anything'], talkingPoint: 'A crankbait mimics a fleeing baitfish. Bass hit it out of instinct — they don\'t think, they react. That\'s why it works even when fish aren\'t hungry.', technique: 'Cast and reel at a steady medium pace. Bump it into rocks and wood — the deflection triggers strikes. Keep your rod at 10 o\'clock.', isBold: false },
    { name: 'Ned Rig (Z-Man TRD)', reason: 'The most versatile lure ever made. Works in almost any condition.', score: 1, for: ['bass', 'anything', 'smallmouth'], talkingPoint: 'The Ned Rig catches fish when nothing else will. It\'s small, non-threatening, and looks like an easy meal. Every pro keeps one tied on.', technique: 'Cast it out, let it sink to the bottom, then drag it slowly with your rod tip. Small hops. Don\'t overwork it — the bait does the work on its own.', isBold: false },
    // ── BAROMETRIC PRESSURE ──────────────────────────────────────────────
    { name: 'Lipless Crankbait (Red Craw)', reason: isFalling ? 'Falling barometer = aggressive feeding window. Cover water fast with reaction strikes.' : 'Good search bait when fish are active.', score: (isFalling ? 4 : 0) + (isWarm ? 1 : 0), for: ['bass', 'anything'], talkingPoint: isFalling ? 'Falling pressure triggers a feeding frenzy — fish know a front is coming and eat everything they can before it hits. This is your best window.' : 'A lipless crankbait vibrates and rattles on the retrieve. Fish attack it out of reflex.', technique: 'Cast long and yo-yo it: reel 3 turns, pause and let it sink a foot, reel 3 more. Most strikes come on the pause. Keep your rod tip low.', isBold: true },
    { name: 'Carolina Rig (Lizard or Brush Hog)', reason: isRising || isHighSteady ? 'Rising/high pressure = fish are sluggish. Slow bottom presentation for lockjaw fish.' : 'Slow bottom presentation for finicky fish.', score: (isRising ? 4 : 0) + (isHighSteady ? 2 : 0), for: ['bass', 'anything'], talkingPoint: isRising ? 'After a front passes, bass won\'t chase anything. A Carolina rig sits on the bottom and waits for them to come to it. Patience wins these days.' : 'The Carolina rig separates the weight from the bait, so your lure floats naturally above the bottom. Fish see it and eat it without suspicion.', technique: 'Cast, let it sink, then drag it slowly along the bottom. Long pauses. When you feel a tap, don\'t set the hook — wait until you feel the fish swimming away, then set.', isBold: false },
    { name: 'Wacky Rig (Senko)', reason: isRising ? 'Rising pressure after a front = the toughest bite. Wacky rig is the most non-threatening presentation.' : 'Finesse fallback that works when nothing else does.', score: (isRising ? 5 : 0) + (isHighSteady ? 2 : 0) + 1, for: ['bass', 'anything'], talkingPoint: isRising ? 'When the barometer is rising, bass have lockjaw. A wacky-rigged Senko falling on slack line is the only thing they\'ll consider eating. It looks that helpless.' : 'The Senko is the most successful bass lure of the last 20 years. Fished wacky style, both ends wiggle as it sinks — it drives bass crazy.', technique: 'Hook the Senko through the middle. Cast and let it sink on completely slack line. Don\'t move it. When you see your line twitch or move sideways, reel down and set the hook.', isBold: false },
    // ── SMALLMOUTH ──────────────────────────────────────────────────────
    { name: 'Tube Bait (Smoke/Green, 3")', reason: isClear ? 'Clear river water + tube = perfect match. Cast upstream, let it drift naturally.' : 'Tube on the bottom = crawfish. #1 smallmouth producer.', score: (isClear ? 3 : 0) + 3, for: ['smallmouth'], talkingPoint: 'Smallmouth eat crawfish like candy. A tube bait dragged along the bottom looks exactly like a crawfish in defense posture — they smash it.', technique: 'Cast upstream at a 45-degree angle. Let it bounce along the bottom with the current. Don\'t reel — just keep the line tight enough to feel the bottom. Set the hook on any different feeling.', isBold: false },
    { name: 'Small Jig (1/8 oz, Brown/Orange)', reason: isCold || isCool ? 'Cold + rocky bottom + brown jig = irresistible to smallmouth.' : 'Drag slowly along rocky bottom. Brown/orange = crawfish.', score: (isCold || isCool ? 3 : 0) + 2, for: ['smallmouth'], talkingPoint: 'Brown and orange are crawfish colors. Smallmouth root around rocks looking for crawfish — a brown jig looks like the real thing.', technique: 'Cast to rocky areas and drag it slowly along the bottom. Small hops. If you feel it get heavy or mushy, set the hook — smallmouth often just suck it in.', isBold: false },
    { name: 'Inline Spinner (Mepps #2, Silver)', reason: isOvercast ? 'Overcast + inline spinner = active smallmouth will chase it.' : 'Cast across current, let it swing. Smallmouth attack the flash.', score: (isOvercast ? 2 : 0) + (isWarm ? 1 : 0) + 1, for: ['smallmouth'], talkingPoint: 'Inline spinners have been catching smallmouth for 80 years. The spinning blade flashes like a fleeing baitfish — smallmouth can\'t resist chasing it.', technique: 'Cast across current at a 45-degree angle. Let the current swing the spinner downstream. Reel just fast enough to keep the blade spinning. Strikes often come at the end of the swing.', isBold: true },
    // ── CRAPPIE ────────────────────────────────────────────────────────
    { name: 'Curly-tail Grub on 1/16 oz Jig', reason: 'The ultimate crappie lure. Jig vertically next to structure at 3–5 ft.', score: 4, for: ['crappie', 'anything'], talkingPoint: 'Crappie stack around brush and docks. A small jig dropped right in front of them is almost guaranteed. They can\'t resist the curly tail action.', technique: 'Drop it straight down next to a dock piling or brush. Lift it up 6 inches, let it fall. Repeat. Most hits come on the fall — when your line twitches, set the hook gently.', isBold: false },
    { name: 'Live Minnow on Bobber', reason: isCold ? 'Cold water = live minnow wins. Set bobber at 4–5 ft near structure.' : 'Set bobber at 3–5 ft near structure. Can\'t beat live bait during spawn.', score: (isCold ? 2 : 0) + 3, for: ['crappie', 'anything'], talkingPoint: 'When crappie won\'t hit anything artificial, a live minnow still works. It\'s not cheating — it\'s the smartest thing you can do as a beginner.', technique: 'Hook the minnow through the lips or behind the dorsal fin. Set your bobber at 3–5 ft. Cast near brush or docks and wait. When the bobber goes under, reel fast and lift.', isBold: false },
    // ── CATFISH ────────────────────────────────────────────────────────
    { name: 'Chicken Liver on Bottom Rig', reason: isNight ? 'Night + chicken liver = catfish at their most active. They hunt by smell after dark.' : 'Scent is everything for catfish. Heavy Carolina rig on the bottom.', score: (isNight ? 2 : 0) + 3, for: ['catfish'], talkingPoint: 'Catfish find food by smell, not sight. Chicken liver puts out a massive scent trail in the water. They follow it right to your hook.', technique: 'Put the liver on a circle hook. Cast to the bottom and wait. When the rod tip starts bouncing, don\'t set the hook — just start reeling. Circle hooks set themselves.', isBold: false },
    { name: 'Cut Shad (Bottom Rig)', reason: 'Missouri catfish love fresh cut shad. Circle hook on a heavy rig.', score: 3, for: ['catfish'], talkingPoint: 'Cut shad is the #1 natural catfish food in Missouri rivers. The oily scent disperses through the water like a dinner bell.', technique: 'Cut the shad into 1-inch chunks. Thread it on a circle hook. Cast to current breaks and bottom structure. Wait for the rod to load up, then reel.', isBold: false },
    { name: 'Stink Bait (Magic Bait / Punch Bait)', reason: isWarm ? 'Warm water = catfish metabolism is up and they\'re chasing scent hard.' : 'Strong scent trail in any conditions.', score: (isWarm ? 2 : 0) + 2, for: ['catfish'], talkingPoint: 'Stink bait is exactly what it sounds like — it smells terrible to us but catfish love it. The worse it smells, the better it works.', technique: 'Use a dip worm or treble hook. Dip it in the bait, cast to the bottom. Re-check your bait every 15 minutes — catfish can clean it off without you feeling a thing.', isBold: true },
    // ── BLUEGILL ───────────────────────────────────────────────────────
    { name: 'Live Cricket on #8 Hook', reason: 'Bluegill literally cannot resist a cricket. Tiny bobber, 4lb line, small hook.', score: 4, for: ['bluegill', 'anything'], talkingPoint: 'Bluegill are the perfect beginner fish. They\'re abundant, aggressive, and a cricket under a bobber is all you need. Kids love this setup.', technique: 'Put the cricket on a tiny #8 hook under a small bobber. Cast near bank edges and weed lines. When the bobber twitches, lift gently — bluegill have small mouths.', isBold: false },
    { name: '1/32 oz Beetle Spin (White or Chartreuse)', reason: isMurky ? 'Murky water + Beetle Spin chartreuse = bluegill can find it.' : 'Classic spring bluegill lure. Cast along weedy banks.', score: (isMurky ? 1 : 0) + 3, for: ['bluegill', 'anything'], talkingPoint: 'The Beetle Spin has been catching STL-area bluegill for 50 years. It\'s cheap, simple, and it works. Every tacklebox should have one.', technique: 'Cast along weedy banks and reel very slowly. The small spinning blade creates flash that bluegill can see from a distance. Set the hook gently — they have soft mouths.', isBold: true },
    { name: 'Small Wax Worm / Red Worm on Jig', reason: isCold ? 'Cold water bluegill are slow. Drop a tiny worm straight down.' : 'Simple and effective. Drop it near any visible cover.', score: (isCold ? 3 : 0) + 2, for: ['bluegill'], talkingPoint: 'Wax worms and red worms are bluegill candy. When the water is cold and fish won\'t chase, a worm right in their face is irresistible.', technique: 'Tip a tiny jig head with a wax worm. Drop it straight down next to any cover. Barely move it. When you feel a tiny tap, lift gently.', isBold: false },
  ];

  const relevant = ALL_LURES
    .filter(l => l.for.includes(fish))
    .sort((a, b) => b.score - a.score);

  const result = relevant.slice(0, 3);
  if (result.length < 2 && !result.find(r => r.name.includes('Ned'))) {
    const ned = ALL_LURES.find(l => l.name.includes('Ned'));
    if (ned) result.push(ned);
  }
  return result.slice(0, 3);
}

export function getColors(_sky: string, water: string, time: string): ColorResult {
  const isNight = ['night', 'dawn', 'evening'].includes(time);
  if (water === 'murky') return { colors: [{ name: 'Chartreuse', hex: '#d4f542', tooltip: 'A bright yellow-green color. Stands out in murky water like a highlighter.' }, { name: 'Bright Orange', hex: '#ff6b1a' }, { name: 'White', hex: '#f0f0f0' }], reason: 'Murky water = go loud. Chartreuse is the #1 murky-water color. Fish detect it in near-zero visibility.' };
  if (water === 'stained') {
    if (isNight) return { colors: [{ name: 'Black', hex: '#1a1a1a' }, { name: 'Chartreuse', hex: '#d4f542', tooltip: 'A bright yellow-green color. Stands out in murky water like a highlighter.' }, { name: 'Dark Blue', hex: '#1a1a4e' }], reason: 'At night in stained water, black creates the strongest silhouette. Chartreuse if there\'s any ambient light.' };
    return { colors: [{ name: 'Chartreuse', hex: '#d4f542', tooltip: 'A bright yellow-green color. Stands out in murky water like a highlighter.' }, { name: 'Watermelon Red', hex: '#a83248' }, { name: 'Black/Blue', hex: '#1a1a4e' }], reason: 'Stained water needs contrast. Bright for reaction strikes, dark for silhouette — both work.' };
  }
  if (water === 'clear') return { colors: [{ name: 'Green Pumpkin', hex: '#5a7a2a', tooltip: 'A natural olive-green. The most versatile soft plastic color ever made.' }, { name: 'Natural Shad', hex: '#9aacb8' }, { name: 'Smoke/Clear', hex: '#c8c8c8' }], reason: 'Clear water = match nature. Fish can see everything — subtle and natural wins. Avoid bright colors.' };
  if (water === 'green') return { colors: [{ name: 'White/Pearl', hex: '#f0f0ee' }, { name: 'Chartreuse', hex: '#d4f542', tooltip: 'A bright yellow-green color. Stands out in murky water like a highlighter.' }, { name: 'Yellow', hex: '#f5d020' }], reason: 'White and chartreuse stand out most against green water. Pearl is especially effective.' };
  return { colors: [{ name: 'Chartreuse', hex: '#d4f542', tooltip: 'A bright yellow-green color. Stands out in murky water like a highlighter.' }, { name: 'Green Pumpkin', hex: '#5a7a2a', tooltip: 'A natural olive-green. The most versatile soft plastic color ever made.' }], reason: 'All-purpose colors for variable conditions.' };
}

export function getWalmart(fish: string, water: string, time: string): WalmartItem[] {
  const items: WalmartItem[] = [];
  const isNight = time === 'night';
  if (water === 'murky' || water === 'stained') {
    items.push({ name: 'Johnson Beetle Spin — Chartreuse', detail: 'One of the best murky-water lures ever. Works for bass, crappie, and bluegill. Spinner section.', price: '~$4–6' });
    items.push({ name: 'Strike King Spinnerbait (3/8 oz, Chart/White)', detail: 'Reliable brand stocked at most Walmarts. Get 3/8 oz size for spring bass.', price: '~$5–7' });
  }
  if (water === 'clear') {
    items.push({ name: 'Zoom Trick Worm — Green Pumpkin', detail: 'Classic soft plastic for clear water. Texas rig or shaky head. Pack of 20.', price: '~$4–5' });
  }
  if (fish === 'crappie' || fish === 'anything') {
    items.push({ name: 'Bobby Garland Crappie Grubs (Multi-pack)', detail: 'Small curly tail grubs made for crappie. Assorted color pack — pink, white, chartreuse.', price: '~$4–5' });
  }
  if (fish === 'catfish' || fish === 'anything') {
    items.push({ name: 'Magic Bait Catfish Dip Bait', detail: 'Stinky but effective. Use the included dip worm or bait holder hook.', price: '~$4–6' });
    items.push({ name: 'Chicken Liver — Meat Section', detail: 'Grocery aisle, not the fishing aisle. Best natural catfish bait, way cheaper than packaged.', price: '~$2–3' });
  }
  if (fish === 'bluegill' || fish === 'anything') {
    items.push({ name: 'Live Crickets (Sporting Goods counter)', detail: 'Most STL Walmarts carry live crickets. Best bluegill bait. Ask at the counter.', price: '~$3' });
  }
  if (fish === 'smallmouth') {
    items.push({ name: 'Z-Man TRD (Ned Rig kit)', detail: 'The best finesse kit for smallmouth. Green pumpkin or natural color.', price: '~$7–10' });
  }
  if (isNight) {
    items.push({ name: 'Clip-on Bobber Lights / Glow Sticks', detail: 'Lets you see your bobber and line at night. Fishing accessories peg hooks.', price: '~$3–5' });
  }
  items.push({ name: 'Berkley Gulp! Nightcrawlers', detail: 'Universal backup bait — works for everything. Always keep these in your box.', price: '~$5–7' });
  return items.slice(0, 5);
}

export function getProTip(sky: string, water: string, temp: string, wind: string, _fish: string, time: string, loc: string, pressure?: string): string {
  if (pressure === 'falling') return 'The barometer is dropping — this is the golden window. Fish can sense the pressure change and they feed hard before a front arrives. This bite can turn off suddenly once the front hits, so fish aggressively right now. Cover water with search baits (spinnerbait, crankbait, chatterbait).';
  if (pressure === 'rising') return 'Rising barometer after a cold front is the toughest fishing condition there is. Fish are lockjaw. The only way to catch them is to slow down dramatically — wacky rig, drop shot, shaky head. Put the bait right on their nose and barely move it. Patience wins these days.';
  if (loc === 'bigriver' || loc === 'bigriverarnold') return 'Big River has some of the clearest water near STL and the best wild smallmouth. Go light — 6lb line max, small natural presentations. Wade quietly upstream. The trophy designation means the fish get big here because people have to release them.';
  if (loc === 'cuivreisland') return 'Cuivre Island is worth the longer drive. The Mississippi backwater sloughs are completely different fishing from any STL-area lake — you may be the only person there. Spawn crappie stack in flooded timber like nowhere else nearby.';
  if (loc === 'missouririver' || loc === 'klondike') return 'The Missouri River spring white bass run is happening right now. White bass stack in current seams chasing baitfish moving upstream. Small white or chartreuse spinnerbaits or jigs worked in the current will get hammered.';
  if (time === 'night') return 'Night fishing is seriously underrated. The water temp is even, zero boat traffic, and bass feed aggressively in the dark. Stay quiet — no splashing, no lights shining in the water. The biggest fish of your season might be sitting 5 feet from the bank.';
  if (time === 'midday' && (sky === 'sunny' || sky === 'partly')) return 'Midday sun is the hardest window to fish. One dock can hold 10 bass. Cast parallel to the dock from the side — not from the end — so your lure stays in the shade zone for the whole retrieve.';
  if (sky === 'overcast' && (water === 'murky' || water === 'stained')) return 'Overcast + murky water is a sweet spot — fish are aggressive and less spooked. Move faster than normal and cover water. A spinnerbait or chatterbait lets you search a whole cove in 20 minutes.';
  if (wind === 'strong') return 'Wind is your friend — it disorients baitfish and oxygenates the water. Cast INTO the wind-blown bank. Fish stack there to pick off confused baitfish. The wavy side always outfishes the calm side.';
  if (temp === 'cold') return 'Cold water = slow metabolism. Count to 10 after your lure hits before you start retrieving. When you think you\'re slow enough — go slower. Fish won\'t chase. Bring the bait to them.';
  if (time === 'dawn') return 'You picked the best window of the day. The very first cast into a fresh untouched cove at dawn is often the best cast of the whole trip. Don\'t waste the first 30 minutes setting up — be ready to cast the moment there\'s enough light.';
  return 'When you catch a fish in a spot, don\'t leave. Cast right back to the same place 2–3 more times. Multiple fish stack in the same area and the commotion of one catch can trigger the others.';
}

export function getCustomSpots(type: string, notes: string): Spot[] {
  const hasDock = notes && notes.toLowerCase().includes('dock');
  const isShallow = notes && (notes.toLowerCase().includes('shallow') || type === 'pond');
  const base: Spot[] = [
    { name: 'Any Visible Structure', detail: 'Start at whatever structure you can see — fallen trees, dock pilings, rocks, weed lines. These are always where fish hold.', always: true },
    { name: hasDock ? 'Fish the Dock' : 'Shaded Bank / Cover', detail: hasDock ? 'Work every piling systematically. Bass and crappie park under docks, especially mid-day. Pitch a jig tight to each post.' : 'Find the most shaded bank — overhanging trees, bushes touching water. Fish hold in shade during daylight.', always: true },
    { name: type === 'river' || type === 'creek' ? 'Current Break / Eddy' : 'Deepest Visible Water', detail: type === 'river' || type === 'creek' ? 'Cast upstream of any rock or obstruction and let your lure drift naturally into the calm pocket behind it.' : 'The deepest area is a midday refuge. If you can spot a color change in the water (darker = deeper), that\'s your midday target.', deep: true },
  ];
  if (isShallow) {
    base.push({ name: 'Shallow Edges — Spawn Check', detail: 'Walk the shallow edges slowly and look for bedding fish (circular cleared spots on bottom). If you see them, pitch a lure past the bed and drag it through.', shallow: true });
  }
  return base;
}

export const DEFAULT_SPOTS: Spot[] = [
  { name: 'Main Fishing Bank', detail: 'Start at the most accessible bank and look for structure: fallen trees, dock pilings, rocks, and weed edges. These are always the best starting points.', always: true },
  { name: 'Any Visible Shade / Cover', detail: 'Bass and crappie relate to overhead cover and shade. Any dock, overhanging tree, or brush pile is worth several casts.', always: true },
  { name: 'Inlet / Outflow Areas', detail: 'Where water enters or leaves the lake concentrates oxygen and baitfish. Always worth checking first.', shallow: true },
];
