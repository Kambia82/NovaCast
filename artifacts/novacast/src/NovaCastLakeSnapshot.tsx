import { useState } from 'react';
import { ChevronDown, Droplets, Wind, Thermometer, Gauge, Sunrise, Moon, CloudOff } from 'lucide-react';
import type { LakeSnapshot, Field } from './services/lakeSnapshot';

interface Props {
  snapshot: LakeSnapshot;
  loading?: boolean;
  /** Compact = one strip for the Game Plan header; full = expandable detail. */
  variant?: 'compact' | 'full';
}

function fmtTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function Stat({ icon, label, field, unit }: { icon: React.ReactNode; label: string; field: Field<number | string>; unit?: string }) {
  return (
    <div className="bg-[#060b10] border border-[#1A3346] rounded-xl px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[1.5px] text-[#4A6878] font-semibold">
          {icon}{label}
        </div>
        {field.available && (
          <span className="text-[8px] px-1 py-0.5 rounded bg-[rgba(124,203,232,0.12)] text-[#7CCBE8] font-semibold shrink-0">KNOWN</span>
        )}
      </div>
      {field.available ? (
        <div className="text-sm text-[#C8E4F0] font-semibold">
          {field.value}{unit ? <span className="text-[#7CCBE8] font-normal text-xs">{unit}</span> : null}
        </div>
      ) : (
        <div className="text-xs text-[#4A6878]">Unknown</div>
      )}
    </div>
  );
}

const DERIVED_LABEL: Record<string, Record<string, string>> = {
  sky: { sunny: 'Sunny', partly: 'Partly cloudy', overcast: 'Overcast', rainy: 'Rainy' },
  temp: { cold: 'Cold (<45°F)', cool: 'Cool (45–60°F)', warm: 'Warm (60°F+)' },
  wind: { calm: 'Calm', light: 'Light breeze', strong: 'Windy' },
  pressure: { falling: 'Falling', steady_low: 'Low & steady', rising: 'Rising', steady_high: 'High & steady' },
};

export default function NovaCastLakeSnapshot({ snapshot, loading = false, variant = 'full' }: Props) {
  const [open, setOpen] = useState(false);
  const { water, weather, astro, season, unavailable } = snapshot;

  const weatherLine = weather.provider
    ? `${weather.place ? weather.place + ' · ' : ''}${weather.airTempF.available ? weather.airTempF.value + '°F · ' : ''}${weather.conditionText.available ? weather.conditionText.value : 'current conditions'}`
    : 'Live weather not loaded';

  if (variant === 'compact') {
    return (
      <div className="bg-[#0c1822] border border-[#1A3346] rounded-2xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[#C8E4F0] truncate">{water.name || 'Selected water'}</div>
            <div className="text-[11px] text-[#4A6878] truncate">
              {loading ? 'Reading conditions…' : weatherLine}
            </div>
          </div>
          <div className="text-right shrink-0 ml-3">
            <div className="text-[10px] text-[#7CCBE8]">{astro.moonName}</div>
            <div className="text-[10px] text-[#4A6878]">{astro.isDaylight ? 'Daylight' : 'Dark'}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0c1822] border border-[#1A3346] rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3.5 text-left">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[2px] text-[#4A6878] font-semibold">Lake Snapshot</div>
          <div className="text-sm font-semibold text-[#C8E4F0] truncate mt-0.5">{water.name || 'Selected water'}</div>
          <div className="text-[11px] text-[#4A6878] truncate">{loading ? 'Reading conditions…' : weatherLine}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#4A6878] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-[#1A3346] pt-3 space-y-3">
          {/* Water facts */}
          <div className="flex flex-wrap gap-1.5">
            {water.type && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(186,232,255,0.07)] border border-[#1A3346] text-[#7CCBE8]">{water.type}</span>}
            {typeof water.areaAcres === 'number' && water.areaAcres > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(186,232,255,0.07)] border border-[#1A3346] text-[#7CCBE8]">
                ~{water.areaAcres < 10 ? water.areaAcres.toFixed(1) : Math.round(water.areaAcres)} acres
              </span>
            )}
            {water.curatedKey
              ? water.species.map((s, i) => <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(124,203,232,0.1)] border border-[#1A3346] text-[#7CCBE8]">{s}</span>)
              : <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.03)] border border-[#1A3346] text-[#4A6878]">species not in our DB</span>}
          </div>
          {water.specialRegs && (
            <div className="text-xs text-[#FC8181] bg-[rgba(252,129,129,0.06)] border border-[rgba(252,129,129,0.2)] rounded-xl px-3 py-2">{water.specialRegs}</div>
          )}

          {/* Weather grid */}
          <div className="grid grid-cols-2 gap-2">
            <Stat icon={<Thermometer className="w-3 h-3" />} label="Air temp" field={weather.airTempF} unit="°F" />
            <Stat icon={<Droplets className="w-3 h-3" />} label="Water temp" field={weather.waterTempF} unit="°F" />
            <Stat icon={<Wind className="w-3 h-3" />} label="Wind" field={weather.windMph} unit=" mph" />
            <Stat icon={<Gauge className="w-3 h-3" />} label="Pressure" field={weather.pressureInHg} unit=" inHg" />
          </div>
          {weather.pressureHpa.available && snapshot.derived.pressure !== 'falling' && snapshot.derived.pressure !== 'rising' && (
            <div className="text-[10px] text-[#4A6878] -mt-1.5">Trend: unknown — a single reading can't show rising/falling; NovaCast won't guess. Set it yourself in Conditions if you know it.</div>
          )}
          {!weather.provider && (
            <div className="flex items-start gap-2 text-[11px] text-[#4A6878]">
              <CloudOff className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Live weather isn't loaded. Use "Auto-Fill My Weather" in Conditions, or set them by hand — NovaCast won't invent them.</span>
            </div>
          )}

          {/* Derived — what NovaCast is actually using for recommendations,
              mapped from known values or set by you. Distinct from a raw
              measurement above. */}
          {(snapshot.derived.sky || snapshot.derived.temp || snapshot.derived.wind || snapshot.derived.pressure) && (
            <div>
              <div className="text-[9px] uppercase tracking-[2px] text-[#4A6878] font-semibold mb-1.5">Estimated / Derived — used for recommendations</div>
              <div className="flex flex-wrap gap-1.5">
                {(['sky', 'temp', 'wind', 'pressure'] as const).map((k) => {
                  const v = snapshot.derived[k];
                  if (!v) return null;
                  return (
                    <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(230,180,90,0.08)] border border-[rgba(230,180,90,0.25)] text-[#E6B45A]">
                      {DERIVED_LABEL[k]?.[v] ?? v}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Astro + season */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#060b10] border border-[#1A3346] rounded-xl px-3 py-2">
              <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[1.5px] text-[#4A6878] font-semibold mb-1"><Sunrise className="w-3 h-3" />Sun</div>
              <div className="text-xs text-[#C8E4F0]">{fmtTime(astro.sunriseISO)} – {fmtTime(astro.sunsetISO)}</div>
            </div>
            <div className="bg-[#060b10] border border-[#1A3346] rounded-xl px-3 py-2">
              <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[1.5px] text-[#4A6878] font-semibold mb-1"><Moon className="w-3 h-3" />Moon</div>
              <div className="text-xs text-[#C8E4F0]">{astro.moonName} · {astro.moonIlluminationPct}% lit · feed {astro.moonFeedRating}/5</div>
            </div>
          </div>
          <div className="text-[11px] text-[#A8C8D8] leading-relaxed border-l-2 border-[#1A3346] pl-2.5">
            <span className="text-[#7CCBE8] font-semibold">{season.label}:</span> {season.note}
          </div>

          {/* Unknown disclosure — honesty about the gaps */}
          {unavailable.length > 0 && (
            <div>
              <div className="text-[9px] uppercase tracking-[2px] text-[#4A6878] font-semibold mb-1">Unknown for this water</div>
              <div className="text-[11px] text-[#4A6878] leading-relaxed">{unavailable.join(' · ')}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
