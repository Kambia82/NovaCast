import { useState } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  Heart,
  Trash2,
  Disc,
  Anchor,
  Bug,
  Waves,
  CheckCircle2,
  Sun,
  Wind,
  Eye,
} from 'lucide-react';

// ── TYPES ──────────────────────────────────────────────────────────────
interface ExternalTacklebox {
  lures: string[];
  colors: string[];
  walmart: string[];
}

interface NovaCastTackleboxProps {
  onBack: () => void;
  externalTacklebox: ExternalTacklebox;
  onToggleSaved: (category: 'lures' | 'colors' | 'walmart', item: string) => void;
}

type DualView = 'saved' | 'guide';
type GuideTab = 'reels' | 'knots' | 'bait' | 'water';

// ── FIELD GUIDE CONTENT ────────────────────────────────────────────────
const reels = [
  {
    title: 'Spincast Reel (Closed-Face)',
    bestFor: [
      'First-time anglers',
      'Kids and casual fishing',
      'Simple shore fishing',
      'Light lures and bait rigs',
    ],
    castSteps: [
      'Press and hold the thumb button.',
      'Bring the rod backward and smoothly swing forward.',
      'Release the button as the rod points toward your target.',
    ],
    fix: 'Line Trapping: If line gets trapped under itself inside the reel, remove tension, pull out several feet of line, and rewind under steady pressure.',
    extra: 'Spincast reels are the easiest reel type to learn because the line is enclosed and protected.',
  },
  {
    title: 'Spinning Reel (Open-Face)',
    bestFor: [
      'Beginner to advanced anglers',
      'Bass, panfish, trout, and walleye',
      'Light and medium-weight lures',
      'Long-distance casting',
    ],
    castSteps: [
      'Open the bail and hold the line against the rod with your finger.',
      'Swing the rod forward toward your target.',
      'Release the line at about eye level and close the bail manually.',
    ],
    fix: 'Line Twist: Let line trail behind a moving boat or current with nothing attached. Reel it back under tension to remove twists.',
    extra: 'The spinning reel is the most versatile reel style and the easiest upgrade from a spincast reel.',
  },
  {
    title: 'Baitcaster Reel',
    bestFor: [
      'Heavy cover and structure',
      'Bass fishing',
      'Accurate casting around docks and trees',
      'Heavy lures and power techniques',
    ],
    castSteps: [
      'Press the thumb bar while keeping your thumb lightly on the spool.',
      'Make a smooth casting motion.',
      'Feather the spool with your thumb throughout the cast and stop it before splashdown.',
    ],
    fix: "Bird's Nest / Backlash: Stop pulling immediately. Loosen pressure, pull line gently, and work loops out one at a time.",
    extra: 'Baitcasters provide unmatched casting precision but require spool control.',
    backlashGuide: [
      {
        title: 'Set Spool Tension First',
        text: 'Tie on your lure and tighten the spool tension knob until the lure barely falls. Slowly loosen until it drops steadily without overrunning the spool.',
      },
      {
        title: 'Use Brakes Aggressively While Learning',
        text: 'Set magnetic or centrifugal brakes high during practice. Reduce them gradually as your control improves.',
      },
      {
        title: 'Avoid Power Casting',
        text: 'Most beginner backlashes happen because of excessive force. Smooth casts outperform hard casts.',
      },
      {
        title: 'Master Thumb Feathering',
        text: 'Keep your thumb lightly touching the spool during flight. Apply gentle pressure if the spool begins spinning faster than the lure is traveling.',
      },
      {
        title: 'Stop Before Splashdown',
        text: 'Press your thumb firmly onto the spool just before the lure hits the water to prevent overruns.',
      },
    ],
  },
];

const knotSections = [
  {
    title: 'Palomar Knot',
    strength: 'Excellent for braided line and hooks',
    steps: [
      { step: 'Double 6–8 inches of line and pass the loop through the hook eye.', why: 'Doubling the line creates extra strength and load distribution.' },
      { step: 'Tie a loose overhand knot using the doubled line.', why: 'This forms the foundation of the knot.' },
      { step: 'Pass the hook through the large loop.', why: 'This locks the hook into the knot structure.' },
      { step: 'Wet the knot and pull evenly from both ends.', why: 'Water reduces friction that can weaken the line.' },
      { step: 'Trim excess tag end.', why: 'Leaves a clean, finished knot.' },
    ],
  },
  {
    title: 'Improved Clinch Knot',
    strength: 'Great all-purpose monofilament knot',
    steps: [
      { step: 'Pass line through the hook eye.', why: 'Creates the anchor point.' },
      { step: 'Wrap the tag end around the main line 5–7 times.', why: 'These wraps create gripping friction.' },
      { step: 'Feed the tag end through the small loop above the eye.', why: 'Begins locking the knot together.' },
      { step: 'Pass the tag end through the larger loop created.', why: 'Creates the improved locking structure.' },
      { step: 'Wet and tighten slowly.', why: 'Prevents heat damage and improves knot strength.' },
      { step: 'Trim the tag end.', why: 'Finishes the knot cleanly.' },
    ],
  },
];

const baitGroups = [
  {
    fish: 'Bass',
    items: [
      { bait: 'Minnows', rig: 'Hook through both lips for current fishing or behind the dorsal fin for natural swimming action.' },
      { bait: 'Bluegills', rig: 'Hook behind the dorsal fin while avoiding the spine. Keep the bait lively and swimming naturally.' },
      { bait: 'Crawfish', rig: 'Run the hook through the tail section from bottom to top so the crawfish remains active.' },
    ],
  },
  {
    fish: 'Catfish',
    items: [
      { bait: 'Nightcrawlers', rig: 'Thread the worm onto the hook several times, leaving a portion dangling naturally.' },
      { bait: 'Cut Bait (Shad)', rig: 'Hook through a tough section of skin near the head or tail so it stays attached during casts.' },
      { bait: 'Chicken Liver', rig: 'Use a bait holder hook and thread the liver securely through multiple times.' },
    ],
  },
  {
    fish: 'Panfish / Crappie',
    items: [
      { bait: 'Crickets', rig: 'Insert the hook under the collar behind the head without crushing the body.' },
      { bait: 'Red Worms', rig: 'Thread part of the worm onto the hook while leaving the tail free to wiggle.' },
    ],
  },
];

// ── TACKLEBOX CATEGORY LABELS ──────────────────────────────────────────
const CATEGORY_LABELS: Record<keyof ExternalTacklebox, string> = {
  lures: 'Lures',
  colors: 'Colors',
  walmart: 'Walmart Picks',
};

export default function NovaCastTacklebox({ onBack, externalTacklebox, onToggleSaved }: NovaCastTackleboxProps) {
  const [dualView, setDualView] = useState<DualView>('saved');
  const [guideTab, setGuideTab] = useState<GuideTab>('reels');
  const [openCard, setOpenCard] = useState<string | null>(null);

  const toggleCard = (id: string) => setOpenCard(prev => (prev === id ? null : id));

  const totalSaved =
    externalTacklebox.lures.length + externalTacklebox.colors.length + externalTacklebox.walmart.length;

  const guideTabs: { id: GuideTab; label: string; icon: typeof Disc }[] = [
    { id: 'reels', label: 'Reels', icon: Disc },
    { id: 'knots', label: 'Knots', icon: Anchor },
    { id: 'bait', label: 'Live Bait', icon: Bug },
    { id: 'water', label: 'Read Water', icon: Waves },
  ];

  // ── SAVED GEAR ─────────────────────────────────────────────────────
  const renderSavedGear = () => {
    if (totalSaved === 0) {
      return (
        <div className="text-center py-16 px-4">
          <Heart className="w-8 h-8 text-[#1A3346] mx-auto mb-3" />
          <div className="text-sm text-[#4A6878] leading-relaxed">
            Nothing saved yet. Tap the heart on any lure, color, or Walmart pick in your Game Plan to save it here.
          </div>
        </div>
      );
    }

    const categories: (keyof ExternalTacklebox)[] = ['lures', 'colors', 'walmart'];

    return (
      <div className="space-y-3 pb-6">
        {categories.map(category => {
          const items = externalTacklebox[category];
          if (items.length === 0) return null;
          return (
            <div key={category} className="bg-[#0c1822] border border-[#1A3346] rounded-2xl p-4">
              <div className="text-[10px] uppercase tracking-[2px] text-[#4A6878] font-semibold mb-3">
                {CATEGORY_LABELS[category]}
              </div>
              <div className="space-y-2">
                {items.map(item => (
                  <div
                    key={item}
                    className="bg-[#060b10] border border-[#1A3346] rounded-xl px-3 py-2.5 flex items-center justify-between"
                  >
                    <span className="text-sm text-[#C8E4F0]">{item}</span>
                    <button
                      onClick={() => onToggleSaved(category, item)}
                      className="text-[#FC8181] hover:text-[#FC8181]/70 transition-colors shrink-0 ml-2"
                      aria-label={`Remove ${item}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── FIELD GUIDE ────────────────────────────────────────────────────
  const renderReels = () => (
    <div className="space-y-2">
      {reels.map(reel => {
        const id = `reel-${reel.title}`;
        const isOpen = openCard === id;
        return (
          <div key={id} className="bg-[#0c1822] border border-[#1A3346] rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleCard(id)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
            >
              <span className="font-semibold text-sm text-[#C8E4F0]">{reel.title}</span>
              <ChevronDown className={`w-4 h-4 text-[#4A6878] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="px-4 pb-4 space-y-3 border-t border-[#1A3346] pt-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[2px] text-[#4A6878] font-semibold mb-1.5">Best For</div>
                  <ul className="space-y-1">
                    {reel.bestFor.map((b, i) => (
                      <li key={i} className="text-xs text-[#A8C8D8] flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-[#7CCBE8] mt-0.5 shrink-0" /> {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[2px] text-[#4A6878] font-semibold mb-1.5">How To Cast</div>
                  <ol className="space-y-1">
                    {reel.castSteps.map((s, i) => (
                      <li key={i} className="text-xs text-[#A8C8D8] flex gap-2">
                        <span className="text-[#7CCBE8] font-semibold shrink-0">{i + 1}.</span> {s}
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="bg-[rgba(252,129,129,0.06)] border border-[rgba(252,129,129,0.2)] rounded-xl px-3 py-2.5">
                  <div className="text-xs text-[#FC8181] leading-relaxed">{reel.fix}</div>
                </div>
                {reel.backlashGuide && (
                  <div>
                    <div className="text-[10px] uppercase tracking-[2px] text-[#4A6878] font-semibold mb-1.5">Avoiding Backlash</div>
                    <div className="space-y-2">
                      {reel.backlashGuide.map((g, i) => (
                        <div key={i} className="bg-[#060b10] border border-[#1A3346] rounded-xl p-2.5">
                          <div className="text-xs font-semibold text-[#C8E4F0] mb-1">{g.title}</div>
                          <div className="text-[11px] text-[#4A6878] leading-relaxed">{g.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-xs text-[#7CCBE8] leading-relaxed border-l-2 border-[#1A3346] pl-2.5">{reel.extra}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderKnots = () => (
    <div className="space-y-2">
      {knotSections.map(knot => {
        const id = `knot-${knot.title}`;
        const isOpen = openCard === id;
        return (
          <div key={id} className="bg-[#0c1822] border border-[#1A3346] rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleCard(id)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
            >
              <div>
                <span className="font-semibold text-sm text-[#C8E4F0]">{knot.title}</span>
                <div className="text-[11px] text-[#4A6878] mt-0.5">{knot.strength}</div>
              </div>
              <ChevronDown className={`w-4 h-4 text-[#4A6878] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="px-4 pb-4 space-y-2.5 border-t border-[#1A3346] pt-3">
                {knot.steps.map((s, i) => (
                  <div key={i} className="bg-[#060b10] border border-[#1A3346] rounded-xl p-3">
                    <div className="text-xs text-[#C8E4F0] flex gap-2 mb-1.5">
                      <span className="text-[#7CCBE8] font-semibold shrink-0">{i + 1}.</span> {s.step}
                    </div>
                    <div className="text-[11px] text-[#4A6878] leading-relaxed pl-5">Why: {s.why}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderBait = () => (
    <div className="space-y-2">
      {baitGroups.map(group => {
        const id = `bait-${group.fish}`;
        const isOpen = openCard === id;
        return (
          <div key={id} className="bg-[#0c1822] border border-[#1A3346] rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleCard(id)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
            >
              <span className="font-semibold text-sm text-[#C8E4F0]">{group.fish}</span>
              <ChevronDown className={`w-4 h-4 text-[#4A6878] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="px-4 pb-4 space-y-2 border-t border-[#1A3346] pt-3">
                {group.items.map((it, i) => (
                  <div key={i} className="bg-[#060b10] border border-[#1A3346] rounded-xl p-3">
                    <div className="text-xs font-semibold text-[#C8E4F0] mb-1">{it.bait}</div>
                    <div className="text-[11px] text-[#A8C8D8] leading-relaxed">{it.rig}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderReadWater = () => {
    const sunnyOpen = openCard === 'water-sunny';
    const windOpen = openCard === 'water-wind';
    const clarityOpen = openCard === 'water-clarity';
    return (
      <div className="space-y-2">

        <div className="bg-[#0c1822] border border-[#1A3346] rounded-2xl overflow-hidden">
          <button
            onClick={() => toggleCard('water-sunny')}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left"
          >
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-[#FBBF24] shrink-0" />
              <span className="font-semibold text-sm text-[#C8E4F0]">Where To Cast When It's Sunny</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-[#4A6878] shrink-0 transition-transform ${sunnyOpen ? 'rotate-180' : ''}`} />
          </button>
          {sunnyOpen && (
            <div className="px-4 pb-4 border-t border-[#1A3346] pt-3">
              <p className="text-xs text-[#A8C8D8] leading-relaxed">
                Look for shade lines, docks, overhanging trees, bridge pilings, and deeper water edges.
                Fish avoid intense sunlight much like people avoid standing in a parking lot at noon.
                If you can find shade, you can often find fish.
              </p>
            </div>
          )}
        </div>

        <div className="bg-[#0c1822] border border-[#1A3346] rounded-2xl overflow-hidden">
          <button
            onClick={() => toggleCard('water-wind')}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left"
          >
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-[#7CCBE8] shrink-0" />
              <span className="font-semibold text-sm text-[#C8E4F0]">Wind Strategy</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-[#4A6878] shrink-0 transition-transform ${windOpen ? 'rotate-180' : ''}`} />
          </button>
          {windOpen && (
            <div className="px-4 pb-4 border-t border-[#1A3346] pt-3">
              <p className="text-xs text-[#A8C8D8] leading-relaxed">
                Wind pushes plankton and baitfish toward shore. Predator fish often follow.
                Focus on wind-blown banks and points. Cast into, across, or along the windward
                shoreline whenever practical.
              </p>
            </div>
          )}
        </div>

        <div className="bg-[#0c1822] border border-[#1A3346] rounded-2xl overflow-hidden">
          <button
            onClick={() => toggleCard('water-clarity')}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left"
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#BAE8FF] shrink-0" />
              <span className="font-semibold text-sm text-[#C8E4F0]">Water Clarity Rule</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-[#4A6878] shrink-0 transition-transform ${clarityOpen ? 'rotate-180' : ''}`} />
          </button>
          {clarityOpen && (
            <div className="px-4 pb-4 border-t border-[#1A3346] pt-3 space-y-2">
              <div className="bg-[#060b10] border border-[#1A3346] rounded-xl p-3">
                <div className="text-xs font-semibold text-[#4ADE80] mb-2">Clear Water</div>
                <ul className="space-y-1">
                  {['Natural bait colors', 'Smaller presentations', 'Quiet approaches', 'Less vibration and noise'].map(item => (
                    <li key={item} className="text-[11px] text-[#A8C8D8] flex items-start gap-1.5">
                      <span className="text-[#4A6878] mt-0.5">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#060b10] border border-[#1A3346] rounded-xl p-3">
                <div className="text-xs font-semibold text-[#FB923C] mb-2">Dirty / Stained Water</div>
                <ul className="space-y-1">
                  {['Bright colors and chartreuse', 'Black/blue contrast patterns', 'Rattles and vibration', 'Larger profile lures'].map(item => (
                    <li key={item} className="text-[11px] text-[#A8C8D8] flex items-start gap-1.5">
                      <span className="text-[#4A6878] mt-0.5">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[rgba(186,232,255,0.07)] border border-[rgba(186,232,255,0.15)] rounded-2xl px-4 py-3.5">
          <p className="text-xs text-[#BAE8FF] leading-relaxed">
            <span className="font-semibold">Quick Rule:</span> If fish cannot easily see your lure,
            help them find it with vibration, noise, silhouette, or bright color.
          </p>
        </div>

      </div>
    );
  };

  const renderFieldGuide = () => (
    <div className="pb-6">
      <div className="flex gap-1.5 mb-4 overflow-x-auto -mx-4 px-4 pb-1">
        {guideTabs.map(tab => {
          const Icon = tab.icon;
          const active = guideTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setGuideTab(tab.id); setOpenCard(null); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 border transition-all ${
                active
                  ? 'bg-[rgba(186,232,255,0.1)] border-[rgba(186,232,255,0.3)] text-[#BAE8FF]'
                  : 'bg-[#0c1822] border-[#1A3346] text-[#4A6878]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {guideTab === 'reels' && renderReels()}
      {guideTab === 'knots' && renderKnots()}
      {guideTab === 'bait' && renderBait()}
      {guideTab === 'water' && renderReadWater()}
    </div>
  );

  // ── MAIN RENDER ──────────────────────────────────────────────────────
  return (
    <div className="animate-fade-up px-4">
      <div className="pt-6 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[#4A6878] hover:text-[#7CCBE8] text-xs transition-colors bg-transparent border-none cursor-pointer mb-4"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="font-display text-[28px] tracking-[3px] text-[#BAE8FF] leading-none nova-glow">Tacklebox</div>
      </div>

      <div className="flex gap-2 mb-5 bg-[#0c1822] border border-[#1A3346] rounded-2xl p-1.5">
        <button
          onClick={() => setDualView('saved')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            dualView === 'saved' ? 'bg-[rgba(186,232,255,0.12)] text-[#BAE8FF]' : 'text-[#4A6878]'
          }`}
        >
          <Heart className="w-3.5 h-3.5" fill={dualView === 'saved' ? 'currentColor' : 'none'} />
          Saved Gear{totalSaved > 0 ? ` (${totalSaved})` : ''}
        </button>
        <button
          onClick={() => setDualView('guide')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            dualView === 'guide' ? 'bg-[rgba(186,232,255,0.12)] text-[#BAE8FF]' : 'text-[#4A6878]'
          }`}
        >
          <Disc className="w-3.5 h-3.5" /> Field Guide
        </button>
      </div>

      {dualView === 'saved' ? renderSavedGear() : renderFieldGuide()}
    </div>
  );
}
