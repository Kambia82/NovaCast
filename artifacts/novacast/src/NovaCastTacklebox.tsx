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
  BookMarked,
  Plus,
  Pencil,
} from 'lucide-react';
import NovaCastReferenceSection from './NovaCastReferenceSection';
import { LIVE_BAIT, READING_WATER } from './data/reference';
import NovaCastLearnLink from './NovaCastLearnLink';
import type { LearnTarget } from './lib/learnLink';

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
  /** Opens the Catch Log — this tile is "lures, spots, catches". */
  onOpenCatchLog?: () => void;
  /** Opens Learning focused on a saved item's topic, when one exists. */
  onLearnTopic?: (target: LearnTarget) => void;
  /** Lure names in the current fishing recommendation, if any — flags overlap. */
  recommendedLures?: string[];
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

// ── TACKLEBOX CATEGORY LABELS ──────────────────────────────────────────
const CATEGORY_LABELS: Record<keyof ExternalTacklebox, string> = {
  lures: 'Lures',
  colors: 'Colors',
  walmart: 'Gear Picks',
};
const ADD_PLACEHOLDER: Record<keyof ExternalTacklebox, string> = {
  lures: 'e.g. Texas-rig worm',
  colors: 'e.g. Watermelon Red',
  walmart: 'e.g. Rat-L-Trap 1/2 oz',
};

export default function NovaCastTacklebox({ onBack, externalTacklebox, onToggleSaved, onOpenCatchLog, onLearnTopic, recommendedLures = [] }: NovaCastTackleboxProps) {
  const [dualView, setDualView] = useState<DualView>('saved');
  const [guideTab, setGuideTab] = useState<GuideTab>('reels');
  const [openCard, setOpenCard] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState<keyof ExternalTacklebox | null>(null);
  const [addValue, setAddValue] = useState('');
  const [editingItem, setEditingItem] = useState<{ category: keyof ExternalTacklebox; name: string } | null>(null);
  const [editValue, setEditValue] = useState('');

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
  const startAdd = (category: keyof ExternalTacklebox) => { setAddingCategory(category); setAddValue(''); };
  const commitAdd = (category: keyof ExternalTacklebox) => {
    const name = addValue.trim();
    if (name && !externalTacklebox[category].includes(name)) onToggleSaved(category, name);
    setAddingCategory(null); setAddValue('');
  };
  const startEdit = (category: keyof ExternalTacklebox, name: string) => { setEditingItem({ category, name }); setEditValue(name); };
  const commitEdit = () => {
    if (!editingItem) return;
    const next = editValue.trim();
    if (next && next !== editingItem.name && !externalTacklebox[editingItem.category].includes(next)) {
      onToggleSaved(editingItem.category, editingItem.name); // remove old
      onToggleSaved(editingItem.category, next); // add new
    }
    setEditingItem(null); setEditValue('');
  };

  const renderSavedGear = () => {
    const categories: (keyof ExternalTacklebox)[] = ['lures', 'colors', 'walmart'];

    return (
      <div className="space-y-3 pb-6">
        {totalSaved === 0 && (
          <div className="text-center py-10 px-4">
            <Heart className="w-8 h-8 text-[#1A3346] mx-auto mb-3" />
            <div className="text-sm text-[#4A6878] leading-relaxed">
              Nothing saved yet. Tap the heart on any lure, color, or gear pick in Game Plan — or add your own below.
            </div>
          </div>
        )}
        {categories.map(category => {
          const items = externalTacklebox[category];
          const isAdding = addingCategory === category;
          return (
            <div key={category} className="bg-[#0c1822] border border-[#1A3346] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] uppercase tracking-[2px] text-[#4A6878] font-semibold">
                  {CATEGORY_LABELS[category]}
                </div>
                {!isAdding && (
                  <button onClick={() => startAdd(category)} className="text-[10px] text-[#7CCBE8] hover:text-[#BAE8FF] font-semibold bg-transparent border-none cursor-pointer flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                )}
              </div>

              {items.length === 0 && !isAdding && (
                <div className="text-xs text-[#4A6878] mb-1">None saved yet.</div>
              )}

              <div className="space-y-2">
                {items.map(item => {
                  const editing = editingItem?.category === category && editingItem.name === item;
                  const learnTarget = category === 'lures' ? item : '';
                  const isCurrent = category === 'lures' && recommendedLures.includes(item);
                  if (editing) {
                    return (
                      <div key={item} className="bg-[#060b10] border border-[rgba(186,232,255,0.35)] rounded-xl px-3 py-2 flex items-center gap-2">
                        <input
                          autoFocus
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingItem(null); }}
                          className="flex-1 bg-transparent text-sm text-[#C8E4F0] outline-none border-none"
                        />
                        <button onClick={commitEdit} className="text-[#7CCBE8] text-xs font-semibold bg-transparent border-none cursor-pointer shrink-0">Save</button>
                        <button onClick={() => setEditingItem(null)} className="text-[#4A6878] text-xs bg-transparent border-none cursor-pointer shrink-0">Cancel</button>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={item}
                      className="bg-[#060b10] border border-[#1A3346] rounded-xl px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-[#C8E4F0] min-w-0 truncate">{item}</span>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <button onClick={() => startEdit(category, item)} className="text-[#4A6878] hover:text-[#BAE8FF] transition-colors" aria-label={`Edit ${item}`}>
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleSaved(category, item)}
                            className="text-[#FC8181] hover:text-[#FC8181]/70 transition-colors"
                            aria-label={`Remove ${item}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {(isCurrent || (onLearnTopic && learnTarget)) && (
                        <div className="flex items-center gap-2 mt-1.5">
                          {isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(124,203,232,0.15)] text-[#7CCBE8] font-semibold">
                              MATCHES CURRENT RECOMMENDATION
                            </span>
                          )}
                          {onLearnTopic && learnTarget && <NovaCastLearnLink topic={learnTarget} onLearn={onLearnTopic} />}
                        </div>
                      )}
                    </div>
                  );
                })}

                {isAdding && (
                  <div className="bg-[#060b10] border border-[rgba(186,232,255,0.35)] rounded-xl px-3 py-2 flex items-center gap-2">
                    <input
                      autoFocus
                      value={addValue}
                      onChange={e => setAddValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') commitAdd(category); if (e.key === 'Escape') setAddingCategory(null); }}
                      placeholder={ADD_PLACEHOLDER[category]}
                      className="flex-1 bg-transparent text-sm text-[#C8E4F0] outline-none border-none placeholder-[#4A6878]"
                    />
                    <button onClick={() => commitAdd(category)} className="text-[#7CCBE8] text-xs font-semibold bg-transparent border-none cursor-pointer shrink-0">Save</button>
                    <button onClick={() => setAddingCategory(null)} className="text-[#4A6878] text-xs bg-transparent border-none cursor-pointer shrink-0">Cancel</button>
                  </div>
                )}
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

  // Live-bait and Read-Water content now comes from the shared, typed
  // data/reference.ts (consolidation — blueprint §16). The Reels and Knots
  // guides below still have their own data and should be migrated next.
  const renderBait = () => <NovaCastReferenceSection section={LIVE_BAIT} showBlurb={false} />;
  const renderReadWater = () => <NovaCastReferenceSection section={READING_WATER} showBlurb={false} />;

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

      {dualView === 'saved' && onOpenCatchLog && (
        <button
          onClick={onOpenCatchLog}
          className="w-full mb-3 py-3 bg-[#0c1822] border border-[#1A3346] rounded-2xl text-[#7CCBE8] text-sm font-semibold flex items-center justify-center gap-2 hover:border-[rgba(186,232,255,0.3)] transition-all"
        >
          <BookMarked className="w-4 h-4" /> Your Catch Log
        </button>
      )}

      {dualView === 'saved' ? renderSavedGear() : renderFieldGuide()}
    </div>
  );
}
