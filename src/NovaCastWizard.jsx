// NovaCastWizard.jsx
// Wizard flow: fish target, reel type, location, time, conditions, recent weather
// Location: GPS calculates distance to known water bodies instantly (no external API)
// Also shows zip search and Google Maps discovery link

import { useState, useCallback } from 'react';
import {
  Navigation, Cloud, RefreshCw, Thermometer, Wind, Droplets,
  ChevronLeft, MapPin, ExternalLink,
} from 'lucide-react';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const FISH_OPTIONS = [
  { key: 'bass',       label: '🐟 Bass',           desc: 'Largemouth bass — most popular target in STL' },
  { key: 'smallmouth', label: '🏔️ Smallmouth',     desc: 'Smallmouth bass — rivers and clear lakes' },
  { key: 'crappie',    label: '🐠 Crappie',         desc: 'Docks, brush piles, spawning shallows' },
  { key: 'catfish',    label: '🐱 Catfish',          desc: 'Channel or flathead — rivers and deep holes' },
  { key: 'bluegill',   label: '🫐 Bluegill',         desc: 'Great for beginners and kids' },
  { key: 'anything',   label: '🤷 Whatever bites',   desc: "Open to anything — best all-around setup" },
];

const REEL_OPTIONS = [
  { key: 'spinning',   icon: '🎣', label: 'Spinning Reel',         desc: 'Open face with a bail arm. Most common beginner reel.',        bestFor: 'Finesse baits, lighter line, most situations' },
  { key: 'spincast',   icon: '🎯', label: 'Spincast (Closed Face)', desc: 'Push-button reel. Classic Zebco style — easiest to use.',      bestFor: 'Absolute beginners, kids, casual fishing' },
  { key: 'baitcaster', icon: '⚙️', label: 'Baitcaster',            desc: 'Sits on top of the rod. More accurate, takes practice.',        bestFor: 'Heavier lures, power fishing, flipping and pitching' },
  { key: 'fly',        icon: '🪶', label: 'Fly Reel',               desc: 'Used with fly line. Completely different casting technique.',   bestFor: 'Streams, rivers, trout, surface presentations' },
];

const RECENT_WEATHER_OPTIONS = [
  { key: 'light_rain_yesterday', icon: '🌦️', label: 'Light Rain Yesterday' },
  { key: 'heavy_rain_24h',       icon: '⛈️', label: 'Heavy Rain Last 24hrs' },
  { key: 'rain_2_3_days',        icon: '🌧️', label: 'Rained 2–3 Days Ago' },
  { key: 'temp_drop',            icon: '🌡️', label: 'Big Temp Drop Recently' },
  { key: 'warm_streak',          icon: '☀️', label: 'Warm Streak (3+ Sunny Days)' },
  { key: 'no_rain_week',         icon: '🏜️', label: 'No Rain in a Week+' },
];

const REGION_LABELS = {
  fenton: 'Fenton / South', westcounty: 'West County', southcounty: 'South County',
  jeffco: 'Jefferson Co.', stcharles: 'St. Charles Co.', i70: 'I-70 Belt',
  rivers: 'Rivers', springfield: 'Springfield / Joplin', stockton: 'Stockton / Neosho',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 3959;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(miles) {
  if (miles < 1) return `${Math.round(miles * 10) / 10} mi`;
  return `${Math.round(miles * 10) / 10} mi`;
}

// ─── INITIAL STATE ────────────────────────────────────────────────────────────

const EMPTY = {
  fish: null, reel: null, loc: null, locName: null, locLat: null, locLon: null,
  time: null, sky: null, water: null, temp: null, wind: null, pressure: null, recentWeather: [],
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function NovaCastWizard({ onComplete, waterBodies = [], customLakes = [], adminLakes = [] }) {
  const [screen, setScreen] = useState(0);
  const [state, setState] = useState(EMPTY);
  const [error, setError] = useState('');

  const [nearbyResults, setNearbyResults] = useState([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [gpsUsed, setGpsUsed] = useState(false);
  const [userLat, setUserLat] = useState(null);
  const [userLon, setUserLon] = useState(null);
  const [zipInput, setZipInput] = useState('');
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState('');
  const [activeRegion, setActiveRegion] = useState(null);

  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherStatus, setWeatherStatus] = useState('');
  const [weatherLoaded, setWeatherLoaded] = useState('');

  const TOTAL = 6;

  const set = (key, val) => { setState(s => ({ ...s, [key]: val })); setError(''); };
  const toggleRW = (key) => setState(s => ({ ...s, recentWeather: s.recentWeather.includes(key) ? s.recentWeather.filter(k => k !== key) : [...s.recentWeather, key] }));
  const goTo = (n) => { setError(''); setScreen(n); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goBack = () => { if (screen > 0) goTo(screen - 1); };

  const goNext = () => {
    if (screen === 0 && !state.fish) { setError("Choose what you're targeting first."); return; }
    if (screen === 2 && !state.loc)  { setError('Select a location to continue.'); return; }
    if (screen === 3 && !state.time) { setError('Select a time of day.'); return; }
    if (screen === 5) { if (onComplete) onComplete(state); return; }
    goTo(screen + 1);
  };

  const buildNearbyList = (lat, lon) => {
    const all = [
      ...waterBodies.filter(w => w.latitude && w.longitude).map(w => ({
        key: w.key, name: w.name, location: w.location, lat: w.latitude, lon: w.longitude,
        species: w.species || [], type: w.type,
      })),
      ...adminLakes.filter(w => w.latitude && w.longitude).map(w => ({
        key: w.id, name: w.name, location: w.location, lat: w.latitude, lon: w.longitude,
        species: w.species || [], type: w.type,
      })),
    ];
    return all
      .map(w => ({ ...w, distance: calcDistance(lat, lon, w.lat, w.lon) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20);
  };

  const findNearMe = useCallback(() => {
    if (!navigator.geolocation) { setGpsError('Location not supported on this device.'); return; }
    setGpsLoading(true); setGpsError(''); setGpsUsed(false); setNearbyResults([]);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLat(latitude); setUserLon(longitude);
        const results = buildNearbyList(latitude, longitude);
        setNearbyResults(results);
        setGpsUsed(true);
        setGpsLoading(false);
      },
      () => { setGpsError('Location permission denied. Try zip code instead.'); setGpsLoading(false); },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, [waterBodies, adminLakes]);

  const searchByZip = useCallback(async () => {
    if (!zipInput || zipInput.length < 5) { setZipError('Enter a 5-digit zip code.'); return; }
    setZipLoading(true); setZipError(''); setNearbyResults([]); setGpsUsed(false);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${zipInput}+USA&limit=1&countrycodes=us`);
      const data = await res.json();
      if (!data.length) { setZipError("Couldn't find that zip. Try another."); setZipLoading(false); return; }
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      setUserLat(lat); setUserLon(lon);
      const results = buildNearbyList(lat, lon);
      setNearbyResults(results);
      setGpsUsed(true);
    } catch { setZipError('Search failed. Check your connection and try again.'); }
    setZipLoading(false);
  }, [zipInput, waterBodies, adminLakes]);

  const loadWeather = useCallback(() => {
    if (!navigator.geolocation) { setWeatherStatus('Location not available.'); return; }
    setWeatherLoading(true); setWeatherStatus('Getting your location...'); setWeatherLoaded('');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      setWeatherStatus('Fetching weather...');
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=9e751a40a370416832496e123e1098cc&units=imperial`);
        const data = await res.json();
        if (data.cod !== 200) throw new Error(data.message);
        const tempF = Math.round(data.main.temp), windMph = Math.round(data.wind.speed);
        const cloudPct = data.clouds.all, wId = data.weather[0].id, pressureHpa = data.main.pressure;
        let sky, temp, wind, pressure;
        if (wId >= 200 && wId < 600) sky = 'rainy';
        else if (cloudPct >= 80) sky = 'overcast';
        else if (cloudPct >= 30) sky = 'partly';
        else sky = 'sunny';
        temp = tempF < 45 ? 'cold' : tempF < 60 ? 'cool' : 'warm';
        wind = windMph <= 5 ? 'calm' : windMph <= 14 ? 'light' : 'strong';
        pressure = pressureHpa < 1009 ? 'steady_low' : pressureHpa < 1013 ? 'falling' : 'steady_high';
        setState(s => ({ ...s, sky, temp, wind, pressure }));
        const skyL = { sunny:'Sunny', partly:'Partly Cloudy', overcast:'Overcast', rainy:'Rainy' };
        const windL = { calm:'Calm', light:'Light Breeze', strong:'Windy' };
        const presL = { falling:'Falling', steady_low:'Low', rising:'Rising', steady_high:'High/Steady' };
        setWeatherLoaded(`${data.name} — ${tempF}°F · ${skyL[sky]} · ${windL[wind]} · Pressure: ${presL[pressure]}`);
        setWeatherStatus('');
      } catch { setWeatherStatus("Couldn't load weather."); }
      setWeatherLoading(false);
    }, () => { setWeatherStatus('Location permission denied.'); setWeatherLoading(false); });
  }, []);

  // ── STYLES ────────────────────────────────────────────────────────────────

  const st = {
    card: { background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '16px', padding: '20px', marginBottom: '12px' },
    stepLabel: { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: '#00e5c7', fontWeight: '600', marginBottom: '8px' },
    heading: { fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', letterSpacing: '1px', marginBottom: '14px', color: '#e8f0f8' },
    muted: { fontSize: '13px', color: '#7a8ea6', marginBottom: '12px', lineHeight: '1.5' },
    sectionLabel: { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#7a8ea6', fontWeight: '600', marginBottom: '8px', marginTop: '4px' },
    nextBtn: { width: '100%', padding: '16px', background: '#00e5c7', color: '#0a1628', fontFamily: "'Bebas Neue', sans-serif", fontSize: '20px', letterSpacing: '2px', borderRadius: '12px', border: 'none', cursor: 'pointer', marginTop: '6px' },
    skipBtn: { width: '100%', textAlign: 'center', color: '#7a8ea6', fontSize: '14px', padding: '12px', cursor: 'pointer', background: 'transparent', border: 'none', textDecoration: 'underline', textUnderlineOffset: '2px' },
    pill: (active, warn) => ({
      padding: '8px 14px', borderRadius: '999px', cursor: 'pointer',
      border: `1.5px solid ${active ? (warn ? '#c0c8d8' : '#00e5c7') : '#1e3a5f'}`,
      background: active ? (warn ? '#c0c8d8' : '#00e5c7') : '#152a4f',
      color: active ? '#0a1628' : '#7a8ea6',
      fontWeight: active ? '600' : '500', fontSize: '13px', whiteSpace: 'nowrap', transition: 'all 0.15s',
    }),
  };

  const Pill = ({ groupKey, val, label, warn = false }) => (
    <button onClick={() => set(groupKey, val)} style={st.pill(state[groupKey] === val, warn)}>{label}</button>
  );

  const ErrorMsg = () => error ? <div style={{ color: '#e05c5c', fontSize: '13px', textAlign: 'center', marginTop: '8px' }}>{error}</div> : null;

  const WizardNav = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
      <button onClick={goBack} style={{ background: 'transparent', border: 'none', color: '#7a8ea6', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', visibility: screen > 0 ? 'visible' : 'hidden' }}>
        <ChevronLeft size={16} /> Back
      </button>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div key={i} style={{ height: '8px', borderRadius: '4px', background: i === screen ? '#00e5c7' : i < screen ? 'rgba(0,229,199,0.4)' : '#1e3a5f', width: i === screen ? '20px' : '8px', transition: 'all 0.2s' }} />
        ))}
      </div>
      <div style={{ width: '60px' }} />
    </div>
  );

  const WaterCard = ({ w }) => {
    const isSelected = state.loc === w.key;
    const satUrl = w.lat && w.lon
      ? `https://www.google.com/maps/@${w.lat},${w.lon},14z/data=!3m1!1e3`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(w.name + ' ' + (w.location || ''))}`;
    const directionsUrl = w.lat && w.lon
      ? `https://www.google.com/maps/dir/?api=1&destination=${w.lat},${w.lon}`
      : null;

    return (
      <div style={{
        borderRadius: '12px', padding: '12px 14px', marginBottom: '8px',
        border: `1.5px solid ${isSelected ? '#00e5c7' : '#1e3a5f'}`,
        background: isSelected ? 'rgba(0,229,199,0.06)' : '#152a4f',
        transition: 'all 0.15s',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div
            style={{ flex: 1, cursor: 'pointer' }}
            onClick={() => { set('loc', w.key); set('locName', w.name); set('locLat', w.lat); set('locLon', w.lon); }}
          >
            <div style={{ fontWeight: '600', fontSize: '14px', color: '#e8f0f8', marginBottom: '2px' }}>{w.name}</div>
            <div style={{ fontSize: '11px', color: '#7a8ea6' }}>
              {w.location && <span><MapPin size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />{w.location}</span>}
              {w.distance !== undefined && <span style={{ marginLeft: '6px' }}>· {formatDist(w.distance)} away</span>}
            </div>
            {w.species?.length > 0 && (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '5px' }}>
                {w.species.map(sp => <span key={sp} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: 'rgba(0,229,199,0.12)', color: '#00e5c7', fontWeight: '500' }}>{sp}</span>)}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
            <button onClick={e => { e.stopPropagation(); window.open(satUrl, '_blank'); }} style={{ background: 'rgba(0,229,199,0.1)', border: '1px solid rgba(0,229,199,0.3)', borderRadius: '8px', padding: '5px 10px', color: '#00e5c7', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Navigation size={11} /> View
            </button>
            {directionsUrl && (
              <button onClick={e => { e.stopPropagation(); window.open(directionsUrl, '_blank'); }} style={{ background: 'rgba(26,107,138,0.15)', border: '1px solid rgba(26,107,138,0.3)', borderRadius: '8px', padding: '5px 10px', color: '#5cc8e0', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ExternalLink size={11} /> Drive
              </button>
            )}
          </div>
        </div>
        {isSelected && <div style={{ marginTop: '6px', fontSize: '11px', color: '#00e5c7' }}>✓ Selected — tap Drive for directions</div>}
      </div>
    );
  };

  // ── SCREENS ───────────────────────────────────────────────────────────────

  const Screen0 = () => (
    <div>
      <div style={st.card}>
        <div style={st.stepLabel}>Step 1 of {TOTAL}</div>
        <div style={st.heading}>What Are You Targeting?</div>
        <div style={st.muted}>This shapes every recommendation — lures, spots, techniques.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {FISH_OPTIONS.map(f => (
            <div key={f.key} onClick={() => set('fish', f.key)} style={{ borderRadius: '12px', padding: '12px 14px', cursor: 'pointer', border: `1.5px solid ${state.fish === f.key ? '#00e5c7' : '#1e3a5f'}`, background: state.fish === f.key ? 'rgba(0,229,199,0.06)' : '#152a4f', transition: 'all 0.15s' }}>
              <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>{f.label}</div>
              <div style={{ fontSize: '12px', color: '#7a8ea6' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <ErrorMsg />
      <button style={st.nextBtn} onClick={goNext}>NEXT: MY REEL →</button>
    </div>
  );

  const Screen1 = () => (
    <div>
      <div style={st.card}>
        <div style={st.stepLabel}>Step 2 of {TOTAL}</div>
        <div style={st.heading}>What Kind of Reel?</div>
        <div style={st.muted}>Optional — skip if you're not sure.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {REEL_OPTIONS.map(r => (
            <div key={r.key} onClick={() => set('reel', r.key)} style={{ borderRadius: '12px', padding: '12px 14px', cursor: 'pointer', border: `1.5px solid ${state.reel === r.key ? '#00e5c7' : '#1e3a5f'}`, background: state.reel === r.key ? 'rgba(0,229,199,0.06)' : '#152a4f', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <span style={{ fontSize: '18px' }}>{r.icon}</span>
                <span style={{ fontWeight: '600', fontSize: '14px' }}>{r.label}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#7a8ea6', marginBottom: '3px' }}>{r.desc}</div>
              <div style={{ fontSize: '11px', color: '#5cc8e0' }}>Best for: {r.bestFor}</div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={goNext} style={st.skipBtn}>Skip — I'm not sure →</button>
      {state.reel && <button style={st.nextBtn} onClick={goNext}>NEXT: PICK A SPOT →</button>}
    </div>
  );

  const Screen2 = () => {
    const regionKeys = [...new Set(waterBodies.map(w => w.region))].filter(Boolean);
    const currentRegion = activeRegion || regionKeys[0];
    const discoverUrl = userLat && userLon
      ? `https://www.google.com/maps/search/fishing+lake+pond/@${userLat},${userLon},11z/data=!3m1!1e3`
      : `https://www.google.com/maps/search/fishing+lake+near+St+Louis+MO/@38.6270,-90.1994,10z/data=!3m1!1e3`;

    return (
      <div>
        <div style={st.card}>
          <div style={st.stepLabel}>Step 3 of {TOTAL}</div>
          <div style={st.heading}>Where Are You Fishing?</div>

          <button onClick={findNearMe} disabled={gpsLoading} style={{ width: '100%', padding: '14px', background: 'rgba(0,229,199,0.1)', border: '1.5px solid #00e5c7', borderRadius: '12px', color: '#00e5c7', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {gpsLoading
              ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Getting your location...</>
              : <><Navigation size={16} /> Find Fishing Water Near Me</>
            }
          </button>
          {gpsError && <div style={{ color: '#e05c5c', fontSize: '12px', marginBottom: '8px' }}>{gpsError}</div>}

          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input type="text" inputMode="numeric" value={zipInput} onChange={e => setZipInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchByZip()} placeholder="Search by zip code" maxLength={10} style={{ flex: 1, background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: '10px', color: '#e8f0f8', fontSize: '14px', padding: '10px 14px', outline: 'none' }} />
            <button onClick={searchByZip} disabled={zipLoading} style={{ padding: '10px 16px', background: '#152a4f', border: '1px solid #1e3a5f', borderRadius: '10px', color: '#00e5c7', cursor: 'pointer', fontSize: '13px', fontWeight: '600', flexShrink: 0 }}>
              {zipLoading ? '...' : 'Go'}
            </button>
          </div>
          {zipError && <div style={{ color: '#e05c5c', fontSize: '12px', marginBottom: '8px' }}>{zipError}</div>}

          <a href={discoverUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#5cc8e0', textDecoration: 'none', marginBottom: '14px' }}>
            <ExternalLink size={13} /> Explore nearby water on satellite map
          </a>

          {gpsUsed && nearbyResults.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={st.sectionLabel}>{nearbyResults.length} spots near you — tap to select</div>
              {nearbyResults.map((w, i) => <WaterCard key={i} w={w} />)}
            </div>
          )}

          {gpsUsed && nearbyResults.length === 0 && (
            <div style={{ background: 'rgba(26,107,138,0.1)', border: '1px solid #1a6b8a', borderRadius: '10px', padding: '12px 14px', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: '#5cc8e0', marginBottom: '6px' }}>No known spots near that location — but there might still be water out there.</div>
              <a href={discoverUrl} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#00e5c7', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}>
                <ExternalLink size={13} /> Explore on Google Maps satellite
              </a>
            </div>
          )}

          {waterBodies.length > 0 && (
            <div>
              <div style={st.sectionLabel}>St. Louis Area Favorites</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {regionKeys.map(r => (
                  <button key={r} onClick={() => setActiveRegion(r)} style={{ padding: '5px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', border: `1.5px solid ${currentRegion === r ? '#00e5c7' : '#1e3a5f'}`, background: currentRegion === r ? 'rgba(0,229,199,0.1)' : '#152a4f', color: currentRegion === r ? '#00e5c7' : '#7a8ea6' }}>
                    {REGION_LABELS[r] || r}
                  </button>
                ))}
              </div>
              {waterBodies.filter(w => w.region === currentRegion).map(w => (
                <WaterCard key={w.key} w={{ key: w.key, name: w.name, location: w.location, lat: w.latitude, lon: w.longitude, species: w.species, type: w.type }} />
              ))}
            </div>
          )}

          {customLakes.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={st.sectionLabel}>My Saved Spots</div>
              {customLakes.map(l => <WaterCard key={l.id} w={{ key: l.id, name: l.name, location: l.location, lat: null, lon: null, species: [], type: l.type }} />)}
            </div>
          )}
        </div>
        <ErrorMsg />
        <button style={st.nextBtn} onClick={goNext}>NEXT: TIME OF DAY →</button>
      </div>
    );
  };

  const Screen3 = () => (
    <div>
      <div style={st.card}>
        <div style={st.stepLabel}>Step 4 of {TOTAL}</div>
        <div style={st.heading}>What Time Are You Going?</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <Pill groupKey="time" val="night"     label="🌙 Night (10pm–5am)" />
          <Pill groupKey="time" val="dawn"      label="🌅 Dawn (5–8am)" />
          <Pill groupKey="time" val="morning"   label="☀️ Morning (8–11am)" />
          <Pill groupKey="time" val="midday"    label="🌞 Midday (11am–3pm)" />
          <Pill groupKey="time" val="afternoon" label="🌤️ Afternoon (3–6pm)" />
          <Pill groupKey="time" val="evening"   label="🌇 Evening (6–10pm)" />
        </div>
      </div>
      <ErrorMsg />
      <button style={st.nextBtn} onClick={goNext}>NEXT: CONDITIONS →</button>
    </div>
  );

  const Screen4 = () => (
    <div>
      <div style={st.card}>
        <div style={st.stepLabel}>Step 5 of {TOTAL}</div>
        <div style={st.heading}>What Are the Conditions?</div>
        <div style={{ background: 'rgba(0,229,199,0.06)', border: '1px solid rgba(0,229,199,0.2)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#5cc8e0', marginBottom: '14px', lineHeight: '1.5' }}>
          <strong style={{ color: '#00e5c7' }}>Don't know yet?</strong> Fill in what you can and skip the rest.
        </div>

        <button onClick={loadWeather} disabled={weatherLoading} style={{ width: '100%', padding: '10px', background: 'rgba(0,229,199,0.08)', border: '1.5px solid #00e5c7', borderRadius: '10px', color: '#00e5c7', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {weatherLoading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Cloud size={14} />}
          {weatherLoading ? 'Getting Weather...' : 'Auto-Fill from My Current Location'}
        </button>
        {weatherStatus && <div style={{ fontSize: '12px', color: '#00e5c7', textAlign: 'center', marginBottom: '8px' }}>{weatherStatus}</div>}
        {weatherLoaded && <div style={{ background: 'rgba(0,229,199,0.06)', border: '1px solid rgba(0,229,199,0.2)', borderRadius: '8px', padding: '10px', fontSize: '12px', color: '#00e5c7', marginBottom: '14px' }}>{weatherLoaded}<br /><span style={{ color: '#7a8ea6' }}>Sky, temp, wind, pressure auto-filled. Set water color manually.</span></div>}

        <div style={{ marginBottom: '14px' }}>
          <div style={{ ...st.sectionLabel, display: 'flex', alignItems: 'center', gap: '6px' }}><Cloud size={13} /> Sky</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <Pill groupKey="sky" val="sunny" label="☀️ Sunny" /><Pill groupKey="sky" val="partly" label="⛅ Partly Cloudy" /><Pill groupKey="sky" val="overcast" label="☁️ Overcast" /><Pill groupKey="sky" val="rainy" label="🌧️ Rainy" />
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <div style={{ ...st.sectionLabel, display: 'flex', alignItems: 'center', gap: '6px' }}><Droplets size={13} /> Water Color</div>
          <div style={{ fontSize: '12px', color: '#7a8ea6', marginBottom: '8px' }}>Clear = see bottom in 3+ ft. Stained = tea-colored. Murky = can't see your lure. Green = algae.</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <Pill groupKey="water" val="clear" label="🔵 Clear" /><Pill groupKey="water" val="stained" label="🟤 Stained" /><Pill groupKey="water" val="murky" label="⚫ Murky" /><Pill groupKey="water" val="green" label="🟢 Green / Algae" />
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <div style={{ ...st.sectionLabel, display: 'flex', alignItems: 'center', gap: '6px' }}><Thermometer size={13} /> Air Temp</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <Pill groupKey="temp" val="cold" label="🧊 Cold (<45°F)" /><Pill groupKey="temp" val="cool" label="🌊 Cool (45–60°F)" /><Pill groupKey="temp" val="warm" label="🔆 Warm (60°F+)" />
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <div style={{ ...st.sectionLabel, display: 'flex', alignItems: 'center', gap: '6px' }}><Wind size={13} /> Wind</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <Pill groupKey="wind" val="calm" label="😌 Calm" /><Pill groupKey="wind" val="light" label="🍃 Light Breeze" /><Pill groupKey="wind" val="strong" label="💨 Windy" />
          </div>
        </div>

        <div>
          <div style={st.sectionLabel}>Barometric Pressure <span style={{ fontWeight: '400', textTransform: 'none', letterSpacing: '0', color: '#5cc8e0', fontSize: '11px' }}>— auto-filled above</span></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <Pill groupKey="pressure" val="falling" label="📉 Falling" /><Pill groupKey="pressure" val="steady_low" label="🫧 Low" /><Pill groupKey="pressure" val="rising" label="📈 Rising" /><Pill groupKey="pressure" val="steady_high" label="🔵 High" />
          </div>
        </div>
      </div>
      <button onClick={() => { setState(s => ({ ...s, sky: null, water: null, temp: null, wind: null, pressure: null })); goTo(screen + 1); }} style={st.skipBtn}>Skip all — I'm not sure yet →</button>
      <button style={st.nextBtn} onClick={goNext}>NEXT: RECENT WEATHER →</button>
    </div>
  );

  const Screen5 = () => (
    <div>
      <div style={st.card}>
        <div style={st.stepLabel}>Step 6 of {TOTAL}</div>
        <div style={st.heading}>Did Anything Happen Recently?</div>
        <div style={{ background: 'rgba(26,107,138,0.15)', border: '1px solid #1a6b8a', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#5cc8e0', marginBottom: '14px', lineHeight: '1.5' }}>
          What happened in the last 1–3 days affects where fish are holding. Optional.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {RECENT_WEATHER_OPTIONS.map(opt => (
            <div key={opt.key} onClick={() => toggleRW(opt.key)} style={{ display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '12px', padding: '12px 14px', cursor: 'pointer', border: `1.5px solid ${state.recentWeather.includes(opt.key) ? '#c0c8d8' : '#1e3a5f'}`, background: state.recentWeather.includes(opt.key) ? 'rgba(192,200,216,0.06)' : '#152a4f', transition: 'all 0.15s' }}>
              <span style={{ fontSize: '20px', flexShrink: 0 }}>{opt.icon}</span>
              <span style={{ fontWeight: '600', fontSize: '13px' }}>{opt.label}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => { if (onComplete) onComplete({ ...state, recentWeather: [] }); }} style={st.skipBtn}>Skip — nothing notable →</button>
      <button style={st.nextBtn} onClick={() => { if (onComplete) onComplete(state); }}>GET MY GAME PLAN →</button>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#e8f0f8' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } input::placeholder { color: #3a5070; } input:focus { border-color: #00e5c7 !important; }`}</style>
      <WizardNav />
      {screen === 0 && <Screen0 />}
      {screen === 1 && <Screen1 />}
      {screen === 2 && <Screen2 />}
      {screen === 3 && <Screen3 />}
      {screen === 4 && <Screen4 />}
      {screen === 5 && <Screen5 />}
    </div>
  );
}
