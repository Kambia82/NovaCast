import { Droplets, Thermometer, Wind, Fish, Navigation, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface ConditionsPanelProps {
  fish: string | null;
  reel: string | null;
  time: string | null;
  sky: string | null;
  water: string | null;
  temp: string | null;
  wind: string | null;
  pressure: string | null;
  onChange: (key: string, value: string | null) => void;
  onAutoFillWeather: () => void;
  weatherLoading: boolean;
  weatherLoaded: string;
}

type PillGroup = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

const PILL_GROUPS: PillGroup[] = [
  {
    key: 'fish',
    label: 'Target Species',
    options: [
      { value: 'bass', label: 'Bass' },
      { value: 'catfish', label: 'Catfish' },
      { value: 'crappie', label: 'Crappie' },
      { value: 'bluegill', label: 'Bluegill' },
      { value: 'trout', label: 'Trout' },
      { value: 'anything', label: 'Anything' },
    ],
  },
  {
    key: 'reel',
    label: 'Reel Type',
    options: [
      { value: 'spinning', label: 'Spinning' },
      { value: 'baitcaster', label: 'Baitcaster' },
      { value: 'spincast', label: 'Spincast' },
      { value: 'fly', label: 'Fly' },
    ],
  },
  {
    key: 'time',
    label: 'Time of Day',
    options: [
      { value: 'morning', label: 'Morning' },
      { value: 'midday', label: 'Midday' },
      { value: 'evening', label: 'Evening' },
      { value: 'night', label: 'Night' },
    ],
  },
  {
    key: 'sky',
    label: 'Sky',
    options: [
      { value: 'sunny', label: 'Sunny' },
      { value: 'partly', label: 'Partly Cloudy' },
      { value: 'overcast', label: 'Overcast' },
      { value: 'rainy', label: 'Rainy' },
    ],
  },
  {
    key: 'water',
    label: 'Water Clarity',
    options: [
      { value: 'clear', label: 'Clear' },
      { value: 'stained', label: 'Stained' },
      { value: 'murky', label: 'Murky' },
      { value: 'muddy', label: 'Muddy' },
    ],
  },
  {
    key: 'temp',
    label: 'Air Temp',
    options: [
      { value: 'cold', label: 'Cold (<45°F)' },
      { value: 'cool', label: 'Cool (45–60°F)' },
      { value: 'warm', label: 'Warm (60°F+)' },
    ],
  },
  {
    key: 'wind',
    label: 'Wind',
    options: [
      { value: 'calm', label: 'Calm' },
      { value: 'light', label: 'Light Breeze' },
      { value: 'strong', label: 'Windy' },
    ],
  },
  {
    key: 'pressure',
    label: 'Barometric Pressure',
    options: [
      { value: 'steady_high', label: 'Steady High' },
      { value: 'falling', label: 'Falling' },
      { value: 'steady_low', label: 'Steady Low' },
    ],
  },
];

export default function ConditionsPanel({
  fish, reel, time, sky, water, temp, wind, pressure,
  onChange, onAutoFillWeather, weatherLoading, weatherLoaded,
}: ConditionsPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const values: Record<string, string | null> = {
    fish, reel, time, sky, water, temp, wind, pressure,
  };

  const filledCount = Object.values(values).filter(Boolean).length;

  return (
    <div className="bg-[#0c1822] border border-[#1A3346] rounded-2xl overflow-hidden mb-2">

      {/* Header row */}
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
      >
        <div className="flex items-center gap-2">
          <Fish className="w-4 h-4 text-[#7CCBE8]" />
          <span className="text-sm font-semibold text-[#C8E4F0]">Conditions</span>
          {filledCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(186,232,255,0.1)] text-[#BAE8FF] font-semibold">
              {filledCount} set
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-[#4A6878] transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-[#1A3346] pt-3">

          {/* Auto-fill weather button */}
          <button
            onClick={onAutoFillWeather}
            disabled={weatherLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[rgba(186,232,255,0.06)] border border-[#1A3346] rounded-xl text-xs text-[#7CCBE8] font-semibold hover:bg-[rgba(186,232,255,0.1)] hover:border-[rgba(186,232,255,0.3)] disabled:opacity-40 transition-all"
          >
            <Navigation className="w-3.5 h-3.5" />
            {weatherLoading ? 'Getting weather...' : 'Auto-Fill My Weather'}
          </button>
          {weatherLoaded && (
            <div className="text-[11px] text-[#7CCBE8] text-center -mt-2">{weatherLoaded}</div>
          )}

          {/* Pill groups */}
          {PILL_GROUPS.map(group => (
            <div key={group.key}>
              <div className="text-[10px] uppercase tracking-[2px] text-[#4A6878] font-semibold mb-2">
                {group.label}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.options.map(opt => {
                  const active = values[group.key] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => onChange(group.key, active ? null : opt.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        active
                          ? 'bg-[rgba(186,232,255,0.15)] border-[rgba(186,232,255,0.4)] text-[#BAE8FF]'
                          : 'bg-[#060b10] border-[#1A3346] text-[#4A6878] hover:border-[rgba(186,232,255,0.2)] hover:text-[#A8C8D8]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Clear all */}
          {filledCount > 0 && (
            <button
              onClick={() => PILL_GROUPS.forEach(g => onChange(g.key, null))}
              className="text-[11px] text-[#4A6878] hover:text-[#FC8181] transition-colors"
            >
              Clear all conditions
            </button>
          )}

        </div>
      )}
    </div>
  );
}
