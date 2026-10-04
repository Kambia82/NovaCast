import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Plus, Trash2, Pencil, Fish } from 'lucide-react';
import { catchLog } from './services/catchLog';
import type { CatchDraft, CatchRecord, CatchConditionsSnapshot, CatchLogStore } from './services/catchLog';
import NovaCastLearnLink from './NovaCastLearnLink';
import type { LearnTarget } from './lib/learnLink';

interface CatchPrefill {
  waterName?: string | null;
  waterKey?: string | null;
  lat?: number | null;
  lon?: number | null;
  species?: string | null;
  conditions?: Partial<CatchConditionsSnapshot>;
}

interface Props {
  onBack: () => void;
  prefill?: CatchPrefill;
  /** Lure names the angler has saved — offered as quick picks in the form. */
  savedLures?: string[];
  /** Active store — local for guests, Firestore when signed in. Defaults to local. */
  store?: CatchLogStore;
  /** Opens Learning focused on the catch's lure/technique, when a lesson exists. */
  onLearnTopic?: (target: LearnTarget) => void;
}

const SPECIES = ['Bass', 'Smallmouth', 'Crappie', 'Bluegill', 'Catfish', 'Walleye', 'Trout', 'Other'];

function emptyConditions(): CatchConditionsSnapshot {
  return { time: null, sky: null, water: null, temp: null, wind: null, pressure: null, pressureInHg: null, weatherText: null };
}

function draftFromPrefill(p?: CatchPrefill): CatchDraft {
  return {
    waterName: p?.waterName || '',
    waterKey: p?.waterKey ?? null,
    lat: p?.lat ?? null,
    lon: p?.lon ?? null,
    species: p?.species ? p.species.charAt(0).toUpperCase() + p.species.slice(1) : '',
    lure: '',
    rod: '',
    reel: '',
    line: '',
    lengthIn: '',
    weightLb: '',
    spot: '',
    notes: '',
    caughtAt: new Date().toISOString(),
    conditions: { ...emptyConditions(), ...(p?.conditions || {}) },
  };
}

function toLocalInput(iso: string): string {
  // yyyy-MM-ddTHH:mm for <input type="datetime-local">
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

const inputCls =
  'w-full bg-[#060b10] border border-[#1A3346] rounded-xl text-[#C8E4F0] text-sm px-3 py-2.5 outline-none focus:border-[rgba(186,232,255,0.4)] placeholder-[#4A6878]';
const labelCls = 'text-[10px] uppercase tracking-[2px] text-[#4A6878] font-semibold mb-1.5 block';

export default function NovaCastCatchLog({ onBack, prefill, savedLures = [], store = catchLog, onLearnTopic }: Props) {
  const [records, setRecords] = useState<CatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CatchDraft>(() => draftFromPrefill(prefill));
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    setLoading(true);
    store.list().then(r => { setRecords(r); setLoading(false); }).catch(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(refresh, [store]);

  const conditionSummary = useMemo(() => {
    const c = draft.conditions;
    const pressure = c.pressureInHg != null ? `${c.pressureInHg} inHg` : c.pressure;
    return [c.time, c.sky, c.water, c.temp, c.wind, pressure].filter(Boolean).join(' · ') || null;
  }, [draft.conditions]);

  const startNew = () => {
    setDraft(draftFromPrefill(prefill));
    setEditingId(null);
    setMode('form');
  };

  const startEdit = (rec: CatchRecord) => {
    setDraft({ ...rec });
    setEditingId(rec.id);
    setMode('form');
  };

  const save = async () => {
    if (!draft.species.trim() && !draft.lure.trim() && !draft.waterName.trim()) return;
    setSaving(true);
    if (editingId) {
      await store.update(editingId, draft);
    } else {
      await store.add(draft);
    }
    setSaving(false);
    setMode('list');
    setEditingId(null);
    refresh();
  };

  const del = async (id: string) => {
    if (!window.confirm('Delete this catch?')) return;
    await store.remove(id);
    refresh();
  };

  const set = <K extends keyof CatchDraft>(key: K, value: CatchDraft[K]) =>
    setDraft(d => ({ ...d, [key]: value }));

  const backButton = (
    <button
      onClick={mode === 'form' ? () => { setMode('list'); setEditingId(null); } : onBack}
      className="flex items-center gap-1 text-[#4A6878] hover:text-[#7CCBE8] text-xs transition-colors bg-transparent border-none cursor-pointer mb-4"
    >
      <ChevronLeft className="w-3.5 h-3.5" /> {mode === 'form' ? 'Catches' : 'Back'}
    </button>
  );

  // ── FORM ───────────────────────────────────────────────────────────
  if (mode === 'form') {
    return (
      <div className="animate-fade-up px-4 pt-6 pb-10">
        {backButton}
        <div className="font-display text-[26px] tracking-[3px] text-[#BAE8FF] leading-none nova-glow mb-4">
          {editingId ? 'Edit Catch' : 'Log a Catch'}
        </div>

        <div className="space-y-3">
          <div>
            <label className={labelCls}>Species</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SPECIES.map(s => (
                <button
                  key={s}
                  onClick={() => set('species', s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    draft.species === s
                      ? 'bg-[rgba(186,232,255,0.15)] border-[rgba(186,232,255,0.4)] text-[#BAE8FF]'
                      : 'bg-[#060b10] border-[#1A3346] text-[#4A6878]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <input className={inputCls} placeholder="Or type a species" value={draft.species}
              onChange={e => set('species', e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>Water</label>
            <input className={inputCls} placeholder="Lake / river name" value={draft.waterName}
              onChange={e => set('waterName', e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>Lure / bait</label>
            {savedLures.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {savedLures.slice(0, 8).map(l => (
                  <button key={l} onClick={() => set('lure', l)}
                    className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${
                      draft.lure === l
                        ? 'bg-[rgba(186,232,255,0.15)] border-[rgba(186,232,255,0.4)] text-[#BAE8FF]'
                        : 'bg-[#060b10] border-[#1A3346] text-[#4A6878]'
                    }`}>
                    {l}
                  </button>
                ))}
              </div>
            )}
            <input className={inputCls} placeholder="What they hit" value={draft.lure}
              onChange={e => set('lure', e.target.value)} />
            {onLearnTopic && draft.lure.trim() && (
              <div className="mt-1.5"><NovaCastLearnLink topic={draft.lure} onLearn={onLearnTopic} variant="text" /></div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Length (in)</label>
              <input className={inputCls} inputMode="decimal" placeholder="e.g. 14.5" value={draft.lengthIn}
                onChange={e => set('lengthIn', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Weight (lb)</label>
              <input className={inputCls} inputMode="decimal" placeholder="e.g. 2.1" value={draft.weightLb}
                onChange={e => set('weightLb', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Rod / pole</label>
              <input className={inputCls} placeholder="Optional" value={draft.rod}
                onChange={e => set('rod', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Reel</label>
              <input className={inputCls} placeholder="Optional" value={draft.reel}
                onChange={e => set('reel', e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Line</label>
            <input className={inputCls} placeholder="e.g. 10 lb fluoro" value={draft.line}
              onChange={e => set('line', e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>Spot / structure</label>
            <input className={inputCls} placeholder="e.g. dock corner in 6 ft" value={draft.spot}
              onChange={e => set('spot', e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>Date &amp; time</label>
            <input type="datetime-local" className={inputCls} value={toLocalInput(draft.caughtAt)}
              onChange={e => {
                const v = e.target.value ? new Date(e.target.value) : new Date();
                set('caughtAt', v.toISOString());
              }} />
          </div>

          <div className="text-[11px] text-[#4A6878] bg-[#060b10] border border-[#1A3346] rounded-xl px-3 py-2">
            {conditionSummary ? (
              <>Conditions saved with this catch: <span className="text-[#7CCBE8]">{conditionSummary}</span>
              {draft.conditions.weatherText ? <> · {draft.conditions.weatherText}</> : null}</>
            ) : (
              'No conditions were recorded with this catch (none were available at the time).'
            )}
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea className={`${inputCls} min-h-[72px]`} placeholder="Anything worth remembering"
              value={draft.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <button onClick={save} disabled={saving}
            className="w-full py-3 bg-[rgba(186,232,255,0.14)] border border-[rgba(186,232,255,0.4)] rounded-2xl text-[#BAE8FF] text-sm font-semibold cursor-pointer hover:bg-[rgba(186,232,255,0.2)] disabled:opacity-40 transition-all">
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Save catch'}
          </button>
        </div>
      </div>
    );
  }

  // ── LIST ───────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-up px-4 pt-6 pb-10">
      {backButton}
      <div className="flex items-center justify-between mb-4">
        <div className="font-display text-[26px] tracking-[3px] text-[#BAE8FF] leading-none nova-glow">Catches</div>
        <button onClick={startNew}
          className="flex items-center gap-1.5 px-3 py-2 bg-[rgba(186,232,255,0.12)] border border-[rgba(186,232,255,0.35)] rounded-xl text-[#BAE8FF] text-xs font-semibold hover:bg-[rgba(186,232,255,0.18)] transition-all">
          <Plus className="w-3.5 h-3.5" /> Log a Catch
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-[#4A6878] py-10 text-center">Loading…</div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 px-4">
          <Fish className="w-8 h-8 text-[#1A3346] mx-auto mb-3" />
          <div className="text-sm text-[#4A6878] leading-relaxed">
            No catches logged yet. This is optional — log one when you want to remember what worked.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map(rec => (
            <div
              key={rec.id}
              onClick={() => startEdit(rec)}
              role="button"
              tabIndex={0}
              className="bg-[#0c1822] border border-[#1A3346] rounded-2xl p-4 cursor-pointer hover:border-[rgba(186,232,255,0.25)] transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#C8E4F0]">
                    {rec.species || 'Fish'}
                    {rec.lengthIn ? <span className="text-[#7CCBE8] font-normal"> · {rec.lengthIn}"</span> : null}
                    {rec.weightLb ? <span className="text-[#7CCBE8] font-normal"> · {rec.weightLb} lb</span> : null}
                  </div>
                  <div className="text-[11px] text-[#4A6878] mt-0.5">{fmtDate(rec.caughtAt)}</div>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  <button onClick={(e) => { e.stopPropagation(); startEdit(rec); }} className="text-[#4A6878] hover:text-[#BAE8FF] p-1" aria-label="Open / edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); del(rec.id); }} className="text-[#4A6878] hover:text-[#FC8181] p-1" aria-label="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {rec.waterName && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(186,232,255,0.07)] border border-[#1A3346] text-[#7CCBE8]">{rec.waterName}</span>}
                {rec.lure && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(186,232,255,0.07)] border border-[#1A3346] text-[#7CCBE8]">{rec.lure}</span>}
                {rec.spot && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.03)] border border-[#1A3346] text-[#4A6878]">{rec.spot}</span>}
              </div>
              {rec.notes && <div className="text-xs text-[#A8C8D8] leading-relaxed mt-2">{rec.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
