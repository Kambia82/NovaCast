import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, PackageOpen, ChevronDown } from 'lucide-react';
import {
  generateStarterKit, getPreassembledKits, preassembledKitsAvailable, STARTER_KIT_OPTIONS,
} from './services/starterKit';
import type {
  StarterKitCriteria, GeneratedKit, PreassembledKit,
} from './services/starterKit';
import { getGearOffers } from './services/retail';
import type { GearItemResult } from './services/retail';
import NovaCastLearnLink from './NovaCastLearnLink';
import type { LearnTarget } from './lib/learnLink';

const COST_LABEL = { low: '$', mid: '$$', high: '$$$' } as const;

interface Props {
  /** Optional — when provided, kit items resolve to a "Learn" link where NovaCast has a matching lesson. */
  onLearnTopic?: (target: LearnTarget) => void;
}

function Pills<T extends string>({
  options, value, onChange,
}: { options: readonly { value: string; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value as T)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            value === o.value
              ? 'bg-[rgba(186,232,255,0.15)] border-[rgba(186,232,255,0.4)] text-[#BAE8FF]'
              : 'bg-[#060b10] border-[#1A3346] text-[#4A6878] hover:text-[#A8C8D8]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function NovaCastStarterKit({ onLearnTopic }: Props) {
  const [criteria, setCriteria] = useState<StarterKitCriteria>({
    species: 'bass', environment: 'pond', platform: 'bank', budget: 'standard',
  });
  const kit: GeneratedKit = useMemo(() => generateStarterKit(criteria), [criteria]);

  const [offers, setOffers] = useState<GearItemResult[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [preassembled, setPreassembled] = useState<PreassembledKit[]>([]);
  const [openItem, setOpenItem] = useState<string | null>(null);

  const set = <K extends keyof StarterKitCriteria>(k: K, v: StarterKitCriteria[K]) =>
    setCriteria((c) => ({ ...c, [k]: v }));

  useEffect(() => {
    let cancelled = false;
    setOffersLoading(true);
    getGearOffers(kit.searchTerms.map((term) => ({ term, category: 'starter' })))
      .then((r) => { if (!cancelled) setOffers(r); })
      .catch(() => { if (!cancelled) setOffers([]); })
      .finally(() => { if (!cancelled) setOffersLoading(false); });
    getPreassembledKits(criteria)
      .then((k) => { if (!cancelled) setPreassembled(k); })
      .catch(() => { if (!cancelled) setPreassembled([]); });
    return () => { cancelled = true; };
  }, [kit, criteria]);

  const offerFor = (term: string) => offers.find((o) => o.query.term === term);

  return (
    <div className="space-y-4">
      {/* Criteria */}
      <div className="bg-[#0c1822] border border-[#1A3346] rounded-2xl p-4 space-y-3">
        <div className="text-[10px] uppercase tracking-[2px] text-[#4A6878] font-semibold">Build a beginner kit</div>
        <div>
          <div className="text-[10px] text-[#4A6878] mb-1.5">Target species</div>
          <Pills options={STARTER_KIT_OPTIONS.species} value={criteria.species} onChange={(v) => set('species', v)} />
        </div>
        <div>
          <div className="text-[10px] text-[#4A6878] mb-1.5">Where you'll fish</div>
          <Pills options={STARTER_KIT_OPTIONS.environment} value={criteria.environment} onChange={(v) => set('environment', v)} />
        </div>
        <div>
          <div className="text-[10px] text-[#4A6878] mb-1.5">From a…</div>
          <Pills options={STARTER_KIT_OPTIONS.platform} value={criteria.platform} onChange={(v) => set('platform', v)} />
        </div>
        <div>
          <div className="text-[10px] text-[#4A6878] mb-1.5">Budget</div>
          <Pills options={STARTER_KIT_OPTIONS.budget} value={criteria.budget} onChange={(v) => set('budget', v)} />
        </div>
      </div>

      {/* Generated list — kit type #2 */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-sm font-semibold text-[#C8E4F0]">NovaCast's recommended list</div>
          <div className="text-[10px] text-[#4A6878]">{kit.summary}</div>
        </div>
        <div className="space-y-2">
          {kit.items.map((item) => {
            const res = offerFor(item.name);
            const open = openItem === item.name;
            return (
              <div key={item.name} className="bg-[#0c1822] border border-[#1A3346] rounded-2xl overflow-hidden">
                <button onClick={() => setOpenItem(open ? null : item.name)} className="w-full flex items-start justify-between px-4 py-3 text-left gap-2">
                  <div className="min-w-0">
                    <div className="text-sm text-[#C8E4F0] font-medium flex items-center gap-2 flex-wrap">
                      {item.name}
                      {item.essential && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(124,203,232,0.15)] text-[#7CCBE8] font-semibold">ESSENTIAL</span>}
                      {res?.relativeCost && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(186,232,255,0.1)] text-[#BAE8FF] font-semibold">
                          {COST_LABEL[res.relativeCost]} <span className="opacity-60">rel.</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#4A6878] mt-0.5">{item.qty} · {item.category}</div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#4A6878] shrink-0 mt-0.5 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <div className="px-4 pb-3.5 border-t border-[#1A3346] pt-3 space-y-2.5">
                    <div className="text-xs text-[#A8C8D8] leading-relaxed">{item.why}</div>
                    {onLearnTopic && <NovaCastLearnLink topic={item.name} onLearn={onLearnTopic} variant="text" />}
                    <div>
                      <div className="text-[9px] uppercase tracking-[2px] text-[#4A6878] font-semibold mb-1.5">
                        {offersLoading ? 'Finding stores…' : 'Find it at'}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(res?.offers ?? []).map((offer, j) => (
                          <a
                            key={j}
                            href={offer.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-[#060b10] border border-[#1A3346] text-[#7CCBE8] hover:border-[rgba(186,232,255,0.3)] transition-all no-underline"
                          >
                            {offer.retailer}
                            {offer.offerType === 'verified-product' && offer.price ? (
                              <span className="text-[#BAE8FF] font-semibold">{offer.price}</span>
                            ) : (
                              <span className="text-[#4A6878]">search</span>
                            )}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="text-[10px] text-[#4A6878] leading-relaxed mt-3">{kit.disclaimer}</div>
      </div>

      {/* Preassembled retail kits — kit type #1 */}
      <div className="bg-[#0c1822] border border-[#1A3346] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-1.5">
          <PackageOpen className="w-4 h-4 text-[#7CCBE8]" />
          <div className="text-sm font-semibold text-[#C8E4F0]">Preassembled kits from a store</div>
        </div>
        {preassembled.length > 0 ? (
          <div className="space-y-2 mt-2">
            {preassembled.map((k) => (
              <a key={k.id} href={k.url} target="_blank" rel="noopener noreferrer" className="block bg-[#060b10] border border-[#1A3346] rounded-xl p-3 no-underline hover:border-[rgba(186,232,255,0.3)] transition-all">
                <div className="text-sm text-[#C8E4F0] font-medium">{k.title}</div>
                <div className="text-[11px] text-[#4A6878] mt-0.5">{k.retailer} · {k.contents}</div>
                <div className="text-[11px] text-[#7CCBE8] mt-1">
                  {k.priceStatus === 'verified' && k.price ? k.price : 'Price on retailer site'}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-[#4A6878] leading-relaxed mt-1">
            {preassembledKitsAvailable()
              ? 'No matching preassembled kit found right now.'
              : "NovaCast can't list store-sold beginner kits yet — that needs a retailer product API (e.g. Amazon PA-API via a NovaCast proxy). The list above plus the store links on each line is the supported path for now."}
          </div>
        )}
      </div>
    </div>
  );
}
