import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { RefBlock, RefCategory } from './data/reference';

// Generic renderer for a reference/learning category. All learning content is
// data (see data/reference.ts) — this component is the only place that decides
// how a block looks, so new lessons never touch UI code.

function Block({ block }: { block: RefBlock }) {
  if (block.kind === 'note') {
    const tone = block.tone ?? 'neutral';
    const cls =
      tone === 'warn'
        ? 'bg-[rgba(252,129,129,0.06)] border-[rgba(252,129,129,0.2)] text-[#FCA5A5]'
        : tone === 'good'
        ? 'bg-[rgba(124,203,232,0.07)] border-[rgba(124,203,232,0.25)] text-[#BAE8FF]'
        : 'bg-[#060b10] border-[#1A3346] text-[#A8C8D8]';
    return (
      <div className={`rounded-xl border px-3 py-2.5 ${cls}`}>
        {block.title && <div className="text-xs font-semibold mb-1">{block.title}</div>}
        <div className="text-[12px] leading-relaxed">{block.text}</div>
      </div>
    );
  }

  if (block.kind === 'list') {
    return (
      <div>
        {block.title && (
          <div className="text-[10px] uppercase tracking-[2px] text-[#4A6878] font-semibold mb-1.5">{block.title}</div>
        )}
        <ul className="space-y-1">
          {block.items.map((it, i) => (
            <li key={i} className="text-[12px] text-[#A8C8D8] leading-relaxed flex gap-2">
              <span className="text-[#4A6878] mt-0.5 shrink-0">•</span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (block.kind === 'steps') {
    return (
      <div>
        {block.title && (
          <div className="text-[10px] uppercase tracking-[2px] text-[#4A6878] font-semibold mb-1.5">{block.title}</div>
        )}
        <ol className="space-y-2">
          {block.steps.map((s, i) => (
            <li key={i} className="bg-[#060b10] border border-[#1A3346] rounded-xl p-3">
              <div className="text-[12px] text-[#C8E4F0] flex gap-2">
                <span className="text-[#7CCBE8] font-semibold shrink-0">{i + 1}.</span>
                <span>{s.text}</span>
              </div>
              {s.why && <div className="text-[11px] text-[#4A6878] leading-relaxed mt-1 pl-5">Why: {s.why}</div>}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  // doDont
  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="bg-[rgba(124,203,232,0.05)] border border-[rgba(124,203,232,0.2)] rounded-xl p-3">
        <div className="text-[10px] uppercase tracking-[2px] text-[#7CCBE8] font-semibold mb-1.5">Do</div>
        <ul className="space-y-1">
          {block.dos.map((d, i) => (
            <li key={i} className="text-[12px] text-[#A8C8D8] leading-relaxed flex gap-2">
              <span className="text-[#7CCBE8] mt-0.5 shrink-0">✓</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-[rgba(252,129,129,0.05)] border border-[rgba(252,129,129,0.2)] rounded-xl p-3">
        <div className="text-[10px] uppercase tracking-[2px] text-[#FC8181] font-semibold mb-1.5">Don't</div>
        <ul className="space-y-1">
          {block.donts.map((d, i) => (
            <li key={i} className="text-[12px] text-[#A8C8D8] leading-relaxed flex gap-2">
              <span className="text-[#FC8181] mt-0.5 shrink-0">✗</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface Props {
  section: RefCategory;
  /** Show the section blurb above the entries. Default true. */
  showBlurb?: boolean;
  /**
   * Deep-link target from contextual "Learn" links (e.g. a Game Plan
   * recommendation). If this section owns that entry it opens and scrolls to
   * it; otherwise it's ignored (another stacked section on the same tab may
   * own it instead) and this section falls back to its default.
   */
  initialEntryId?: string | null;
}

export default function NovaCastReferenceSection({ section, showBlurb = true, initialEntryId }: Props) {
  const owned = initialEntryId != null && section.entries.some((e) => e.id === initialEntryId);
  const [openId, setOpenId] = useState<string | null>(owned ? initialEntryId! : section.entries[0]?.id ?? null);
  const entryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Re-sync when a new deep-link target arrives (e.g. user taps "Learn" again
  // for a different lure while already on this tab).
  useEffect(() => {
    if (owned) {
      setOpenId(initialEntryId!);
      entryRefs.current[initialEntryId!]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEntryId]);

  return (
    <div className="space-y-2">
      {showBlurb && section.blurb && (
        <div className="text-[12px] text-[#7a8ea6] leading-relaxed mb-1">{section.blurb}</div>
      )}
      {section.entries.map((entry) => {
        const open = openId === entry.id;
        return (
          <div
            key={entry.id}
            ref={(el) => { entryRefs.current[entry.id] = el; }}
            className={`bg-[#0c1822] border rounded-2xl overflow-hidden transition-colors ${open && entry.id === initialEntryId ? 'border-[rgba(186,232,255,0.4)]' : 'border-[#1A3346]'}`}
          >
            <button
              onClick={() => setOpenId(open ? null : entry.id)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
            >
              <div className="min-w-0 pr-2">
                <div className="font-semibold text-sm text-[#C8E4F0]">{entry.title}</div>
                {entry.summary && !open && (
                  <div className="text-[11px] text-[#4A6878] mt-0.5 leading-snug">{entry.summary}</div>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-[#4A6878] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <div className="px-4 pb-4 space-y-3 border-t border-[#1A3346] pt-3">
                {entry.blocks.map((b, i) => (
                  <Block key={i} block={b} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
