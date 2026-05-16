import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import {
  getFishMovement,
  applyRecentWeatherToDepth,
  getRecentWeatherImpact,
  getBarometricImpact,
  getGeneralBestRecommendation,
  getSpots,
  getLures,
  getColors,
  getWalmart,
  getProTip,
  getCustomSpots,
  DEFAULT_SPOTS,
  TOOLTIPS,
  KNOT_GUIDES,
} from './data/recommendations';
import { REGION_LABELS, TYPE_LABELS } from './data/waterBodies';
import type { Spot, Lure, ColorRec, WalmartItem } from './data/recommendations';
import {
  Cloud, Navigation, RefreshCw, Settings, Trash2, Droplets, Thermometer,
  Wind, Heart, MapPin, Search, BookOpen, X, Info,
} from 'lucide-react';

interface WaterBodyRow {
  id: string; key: string; name: string; location: string; region: string;
  type: string; species: string[]; tags: { label: string; color: string }[];
  latitude: number | null; longitude: number | null; spots: Spot[] | null; special_regs: string | null;
}

interface CustomLakeRow { id: string; name: string; location: string; type: string; notes: string; }
interface AdminLakeRow { id: string; name: string; location: string; region: string; type: string; species: string[]; spots: Spot[]; special_regs: string; notes: string; }
interface NearbyWaterBody { name: string; type: string; distance: number; lat: number; lon: number; }

interface WizardState {
  loc: string | null; locName: string | null; locLat: number | null; locLon: number | null;
  time: string | null; sky: string | null; water: string | null; temp: string | null;
  wind: string | null; pressure: string | null; fish: string | null; recentWeather: string[];
}

type AppView = 'welcome' | 'wizard' | 'result' | 'tacklebox' | 'reference';

const RECENT_WEATHER_OPTIONS = [
  { key: 'light_rain_yesterday', icon: '🌦️', label: 'Light Rain Yesterday', desc: 'Slight water clarity drop, small pressure changes. Fish are returning to normal but still slightly off.' },
  { key: 'heavy_rain_24h', icon: '⛈️', label: 'Heavy Rain in Last 24hrs', desc: 'Runoff has muddied the water. Fish pushed into flooded shallow areas. Big change in behavior.' },
  { key: 'rain_2_3_days', icon: '🌧️', label: 'Rained 2–3 Days Ago', desc: 'Water clarity recovering. Fish settling back to normal. A transitional day.' },
  { key: 'temp_drop', icon: '🌡️', label: 'Big Temperature Drop Recently', desc: 'Cold front aftermath. Fish went deep, stopped feeding aggressively. Finesse only.' },
  { key: 'warm_streak', icon: '☀️', label: 'Warm Streak (3+ Sunny Days)', desc: 'Water has warmed up faster than normal. Spawn may be further along. Fish are shallower.' },
  { key: 'no_rain_week', icon: '🏜️', label: 'No Rain in a Week+', desc: 'Water is clear and settled. Fish have returned to predictable structure. Go finesse.' },
];

const MONTH = new Date().getMonth();
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const currentMonth = MONTH_NAMES[MONTH];

function getMonthBanner() {
  if (MONTH >= 3 && MONTH <= 4) return 'Spawn season is on! Bass and crappie are moving shallow. This is one of the best times to fish the STL area.';
  if (MONTH === 5) return 'Post-spawn bass are hungry and feeding again. Great topwater month.';
  if (MONTH >= 6 && MONTH <= 8) return 'Summer patterns: early morning and evening are your best windows. Fish deep during midday heat.';
  if (MONTH >= 9 && MONTH <= 10) return 'Fall feed is on! Bass and crappie are aggressively feeding before winter. Some of the best fishing of the year.';
  if (MONTH >= 11 || MONTH <= 1) return 'Slow and deep — winter fishing means slow presentations in the deepest water. Fish are lethargic but catchable.';
  return 'Good fishing conditions in the STL area. Check conditions and pick your spot.';
}

export default function App() {
  const [view, setView] = useState<AppView>('welcome');
  const [screen, setScreen] = useState(0);
  const [state, setState] = useState<WizardState>({
    loc: null, locName: null, locLat: null, locLon: null, time: null, sky: null,
    water: null, temp: null, wind: null, pressure: null, fish: null, recentWeather: [],
  });
  const [missingMsg, setMissingMsg] = useState('');
  const [activeRegion, setActiveRegion] = useState('fenton');
  const [waterBodies, setWaterBodies] = useState<WaterBodyRow[]>([]);
  const [customLakes, setCustomLakes] = useState<CustomLakeRow[]>([]);
  const [adminLakes, setAdminLakes] = useState<AdminLakeRow[]>([]);
  const [nearbyWater, setNearbyWater] = useState<NearbyWaterBody[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState('');
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherStatus, setWeatherStatus] = useState('');
  const [weatherLoaded, setWeatherLoaded] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminPw, setAdminPw] = useState('');
  const [adminMsg, setAdminMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [newLake, setNewLake] = useState({ name: '', location: '', type: '', notes: '' });
  const [adminForm, setAdminForm] = useState({ name: '', location: '', region: '', type: '', species: '', spot1: '', spot2: '', spot3: '', regs: '', notes: '' });
  const [tacklebox, setTacklebox] = useState<{ lures: string[]; colors: string[]; walmart: string[] }>(() => {
    try { const s = localStorage.getItem('novacast_tacklebox'); return s ? JSON.parse(s) : { lures: [], colors: [], walmart: [] }; } catch { return { lures: [], colors: [], walmart: [] }; }
  });
  const [tooltipOpen, setTooltipOpen] = useState<string | null>(null);
  const [showReference, setShowReference] = useState(false);

  useEffect(() => {
    loadWaterBodies(); loadCustomLakes(); loadAdminLakes();
    if (window.location.hash === '#admin') setShowAdmin(true);
    const handler = () => { if (window.location.hash === '#admin') setShowAdmin(true); };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  useEffect(() => { localStorage.setItem('novacast_tacklebox', JSON.stringify(tacklebox)); }, [tacklebox]);

  const toggleTacklebox = (category: 'lures' | 'colors' | 'walmart', item: string) => {
    setTacklebox(prev => {
      const list = prev[category];
      return { ...prev, [category]: list.includes(item) ? list.filter(i => i !== item) : [...list, item] };
    });
  };

  const loadWaterBodies = async () => { const { data } = await supabase.from('water_bodies').select('*').order('name'); if (data) setWaterBodies(data as WaterBodyRow[]); };
  const loadCustomLakes = async () => { const { data } = await supabase.from('custom_lakes').select('*').order('created_at', { ascending: false }); if (data) setCustomLakes(data as CustomLakeRow[]); };
  const loadAdminLakes = async () => { const { data } = await supabase.from('admin_lakes').select('*').order('created_at', { ascending: false }); if (data) setAdminLakes(data as AdminLakeRow[]); };

  const wizardGoto = (n: number) => { setScreen(n); setMissingMsg(''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const wizardBack = () => { if (screen > 0) wizardGoto(screen - 1); };

  const wizardNext = (fromScreen: number, skip = false) => {
    if (fromScreen === 0 && !state.loc) { setMissingMsg('Please select a location first.'); return; }
    if (fromScreen === 1 && !state.time) { setMissingMsg('Please select a time of day.'); return; }
    if (fromScreen === 2) {
      if (!state.sky && !state.water && !state.temp && !state.wind && !state.pressure) {
        // All skipped - use general best
      } else {
        const missing = [];
        if (!state.sky) missing.push('sky');
        if (!state.temp) missing.push('air temp');
        if (!state.wind) missing.push('wind');
        if (missing.length > 0) { setMissingMsg('Still need: ' + missing.join(', ') + ' (or skip all)'); return; }
      }
    }
    if (fromScreen === 3 && skip) { setState(s => ({ ...s, recentWeather: [] })); }
    if (fromScreen === 4) {
      if (!state.fish) { setMissingMsg('Please select what you\'re targeting.'); return; }
      setView('result'); window.scrollTo({ top: 0, behavior: 'smooth' }); return;
    }
    wizardGoto(fromScreen + 1);
  };

  const selectLoc = (key: string, name: string, lat?: number | null, lon?: number | null) => {
    setState(s => ({ ...s, loc: key, locName: name, locLat: lat ?? null, locLon: lon ?? null }));
  };

  const selectPill = (key: keyof WizardState, val: string) => { setState(s => ({ ...s, [key]: val })); };
  const toggleRW = (key: string) => { setState(s => ({ ...s, recentWeather: s.recentWeather.includes(key) ? s.recentWeather.filter(k => k !== key) : [...s.recentWeather, key] })); };

  const resetAll = () => {
    setState({ loc: null, locName: null, locLat: null, locLon: null, time: null, sky: null, water: null, temp: null, wind: null, pressure: null, fish: null, recentWeather: [] });
    setView('welcome'); setScreen(0); setMissingMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startWithGPS = useCallback(() => {
    if (!navigator.geolocation) { setNearbyError('Location not available on this device.'); return; }
    setNearbyLoading(true); setNearbyError(''); setNearbyWater([]);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const query = `[out:json][timeout:25];(way["natural"="water"](around:30000,${latitude},${longitude});way["waterway"="riverbank"](around:30000,${latitude},${longitude});way["water"~"lake|pond|reservoir"](around:30000,${latitude},${longitude});relation["natural"="water"](around:30000,${latitude},${longitude}););out body;>;out skel qt;`;
        const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: `data=${encodeURIComponent(query)}` });
        const data = await res.json();
        const waterBodiesList: { name: string; lat: number; lon: number; type: string }[] = [];
        const nodes: Record<number, { lat: number; lon: number }> = {};
        data.elements.forEach((el: { type: string; id: number; lat?: number; lon?: number }) => { if (el.type === 'node' && el.lat && el.lon) nodes[el.id] = { lat: el.lat, lon: el.lon }; });
        data.elements.forEach((el: { type: string; id: number; tags?: Record<string, string>; nodes?: number[] }) => {
          if (el.type === 'way' && el.tags && el.nodes && el.nodes.length > 0) {
            const name = el.tags.name || el.tags['name:en']; if (!name) return;
            const waterType = el.tags.water || el.tags.natural || el.tags.waterway || 'water';
            const firstNode = nodes[el.nodes[0]];
            if (firstNode) waterBodiesList.push({ name, lat: firstNode.lat, lon: firstNode.lon, type: waterType });
          }
        });
        const toRad = (d: number) => d * Math.PI / 180;
        const calcDist = (lat1: number, lon1: number, lat2: number, lon2: number) => { const R = 3959; const dLat = toRad(lat2 - lat1); const dLon = toRad(lon2 - lon1); const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2; return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); };
        const withDist = waterBodiesList.map(w => ({ ...w, distance: calcDist(latitude, longitude, w.lat, w.lon) })).sort((a, b) => a.distance - b.distance).slice(0, 15);
        setNearbyWater(withDist);
      } catch { setNearbyError('Couldn\'t fetch nearby water bodies. Try again.'); }
      setNearbyLoading(false);
      setView('wizard'); setScreen(0);
    }, () => { setNearbyError('Location permission denied.'); setNearbyLoading(false); setView('wizard'); setScreen(0); });
  }, []);

  const searchByZip = useCallback(async () => {
    if (!zipCode || zipCode.length < 5) { setZipError('Enter a valid zip code.'); return; }
    setZipLoading(true); setZipError(''); setNearbyWater([]);
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${zipCode}+USA&limit=1`);
      const geoData = await geoRes.json();
      if (!geoData.length) { setZipError('Couldn\'t find that location. Try another zip code.'); setZipLoading(false); return; }
      const { lat, lon } = geoData[0];
      const query = `[out:json][timeout:25];(way["natural"="water"](around:30000,${lat},${lon});way["waterway"="riverbank"](around:30000,${lat},${lon});way["water"~"lake|pond|reservoir"](around:30000,${lat},${lon});relation["natural"="water"](around:30000,${lat},${lon}););out body;>;out skel qt;`;
      const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: `data=${encodeURIComponent(query)}` });
      const data = await res.json();
      const waterBodiesList: { name: string; lat: number; lon: number; type: string }[] = [];
      const nodes: Record<number, { lat: number; lon: number }> = {};
      data.elements.forEach((el: { type: string; id: number; lat?: number; lon?: number }) => { if (el.type === 'node' && el.lat && el.lon) nodes[el.id] = { lat: el.lat, lon: el.lon }; });
      data.elements.forEach((el: { type: string; id: number; tags?: Record<string, string>; nodes?: number[] }) => {
        if (el.type === 'way' && el.tags && el.nodes && el.nodes.length > 0) {
          const name = el.tags.name || el.tags['name:en']; if (!name) return;
          const waterType = el.tags.water || el.tags.natural || el.tags.waterway || 'water';
          const firstNode = nodes[el.nodes[0]];
          if (firstNode) waterBodiesList.push({ name, lat: firstNode.lat, lon: firstNode.lon, type: waterType });
        }
      });
      const toRad = (d: number) => d * Math.PI / 180;
      const calcDist = (lat1: number, lon1: number, lat2: number, lon2: number) => { const R = 3959; const dLat = toRad(lat2 - lat1); const dLon = toRad(lon2 - lon1); const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2; return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); };
      const latNum = parseFloat(lat); const lonNum = parseFloat(lon);
      const withDist = waterBodiesList.map(w => ({ ...w, distance: calcDist(latNum, lonNum, w.lat, w.lon) })).sort((a, b) => a.distance - b.distance).slice(0, 15);
      setNearbyWater(withDist);
      setView('wizard'); setScreen(0);
    } catch { setZipError('Search failed. Try again.'); }
    setZipLoading(false);
  }, [zipCode]);

  const loadWeather = useCallback(() => {
    if (!navigator.geolocation) { setWeatherStatus('Location not available.'); return; }
    setWeatherLoading(true); setWeatherStatus('Getting your location...'); setWeatherLoaded('');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      setWeatherStatus('Fetching weather...');
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=9e751a40a370416832496e123e1098cc&units=imperial`);
        const data = await res.json();
        if (data.cod !== 200) throw new Error(data.message);
        const tempF = Math.round(data.main.temp); const windMph = Math.round(data.wind.speed);
        const cloudPct = data.clouds.all; const weatherId = data.weather[0].id; const pressureHpa = data.main.pressure;
        let sky: string, temp: string, wind: string, pressure: string;
        if (weatherId >= 200 && weatherId < 600) sky = 'rainy'; else if (cloudPct >= 80) sky = 'overcast'; else if (cloudPct >= 30) sky = 'partly'; else sky = 'sunny';
        if (tempF < 45) temp = 'cold'; else if (tempF < 60) temp = 'cool'; else temp = 'warm';
        if (windMph <= 5) wind = 'calm'; else if (windMph <= 14) wind = 'light'; else wind = 'strong';
        if (pressureHpa < 1009) pressure = 'steady_low'; else if (pressureHpa < 1013) pressure = 'falling'; else if (pressureHpa < 1020) pressure = 'steady_high'; else pressure = 'steady_high';
        setState(s => ({ ...s, sky, temp, wind, pressure }));
        const skyLabel: Record<string, string> = { sunny: 'Sunny', partly: 'Partly Cloudy', overcast: 'Overcast', rainy: 'Rainy' };
        const windLabel: Record<string, string> = { calm: 'Calm', light: 'Light Breeze', strong: 'Windy' };
        const pressureLabel: Record<string, string> = { falling: 'Falling', steady_low: 'Low', rising: 'Rising', steady_high: 'High/Steady' };
        setWeatherLoaded(`${data.name} — ${tempF}°F · ${skyLabel[sky]} · ${windLabel[wind]} · Pressure: ${pressureLabel[pressure]}`);
        setWeatherStatus('');
      } catch { setWeatherStatus('Couldn\'t load weather.'); }
      setWeatherLoading(false);
    }, () => { setWeatherStatus('Location permission denied.'); setWeatherLoading(false); });
  }, []);

  const addCustomLake = async () => {
    if (!newLake.name || !newLake.type) return;
    await supabase.from('custom_lakes').insert({ name: newLake.name, location: newLake.location, type: newLake.type, notes: newLake.notes });
    setNewLake({ name: '', location: '', type: '', notes: '' }); loadCustomLakes();
  };
  const deleteCustomLake = async (id: string) => { await supabase.from('custom_lakes').delete().eq('id', id); if (state.loc === id) setState(s => ({ ...s, loc: null, locName: null })); loadCustomLakes(); };
  const adminLogin = () => { if (adminPw === 'castmaster2025') { setAdminAuthed(true); setAdminMsg(null); } else { setAdminPw(''); setAdminMsg({ text: 'Wrong password', type: 'error' }); } };
  const adminSaveLake = async () => {
    if (!adminForm.name || !adminForm.location || !adminForm.region || !adminForm.type) { setAdminMsg({ text: 'Name, location, region, and type are required.', type: 'error' }); return; }
    const speciesArr = adminForm.species ? adminForm.species.split(',').map(s => s.trim()).filter(Boolean) : [];
    const spots: Spot[] = [];
    const parseSpot = (s: string) => { const parts = s.split('—'); return { name: parts[0].trim(), detail: parts.length > 1 ? parts.slice(1).join('—').trim() : s, always: true as const }; };
    if (adminForm.spot1) spots.push(parseSpot(adminForm.spot1)); if (adminForm.spot2) spots.push(parseSpot(adminForm.spot2)); if (adminForm.spot3) spots.push(parseSpot(adminForm.spot3));
    await supabase.from('admin_lakes').insert({ name: adminForm.name, location: adminForm.location, region: adminForm.region, type: adminForm.type, species: speciesArr, spots, special_regs: adminForm.regs, notes: adminForm.notes });
    setAdminForm({ name: '', location: '', region: '', type: '', species: '', spot1: '', spot2: '', spot3: '', regs: '', notes: '' });
    setAdminMsg({ text: 'Lake saved!', type: 'success' }); loadAdminLakes();
  };
  const deleteAdminLake = async (id: string) => { await supabase.from('admin_lakes').delete().eq('id', id); loadAdminLakes(); };

  const getLocSpots = (): Spot[] => {
    const dbBody = waterBodies.find(w => w.key === state.loc); if (dbBody?.spots && dbBody.spots.length > 0) return dbBody.spots;
    const adminBody = adminLakes.find(l => l.id === state.loc); if (adminBody?.spots && adminBody.spots.length > 0) return adminBody.spots;
    const custom = customLakes.find(l => l.id === state.loc); if (custom) return getCustomSpots(custom.type, custom.notes);
    return DEFAULT_SPOTS;
  };
  const getLocSpecialRegs = (): string | null => {
    const dbBody = waterBodies.find(w => w.key === state.loc); if (dbBody?.special_regs) return dbBody.special_regs;
    const adminBody = adminLakes.find(l => l.id === state.loc); if (adminBody?.special_regs) return adminBody.special_regs;
    return null;
  };
  const getLocCoords = (): { lat: number | null; lon: number | null } => {
    if (state.locLat && state.locLon) return { lat: state.locLat, lon: state.locLon };
    const dbBody = waterBodies.find(w => w.key === state.loc);
    if (dbBody?.latitude && dbBody?.longitude) return { lat: dbBody.latitude, lon: dbBody.longitude };
    return { lat: null, lon: null };
  };

  const tagColorClass = (color: string) => {
    switch (color) { case 'green': return 'bg-[rgba(0,229,199,0.15)] text-[#00e5c7]'; case 'orange': return 'bg-[rgba(192,200,216,0.15)] text-[#c0c8d8]'; case 'red': return 'bg-[rgba(224,92,92,0.15)] text-[#f09090]'; default: return 'bg-[rgba(26,107,138,0.3)] text-[#5cc8e0]'; }
  };
  const waterBodiesByRegion = (region: string) => waterBodies.filter(w => w.region === region);

  const Tooltip = ({ term }: { term: string }) => {
    const def = TOOLTIPS[term];
    if (!def) return null;
    return (
      <span className="relative inline-flex ml-1">
        <button onClick={e => { e.stopPropagation(); setTooltipOpen(tooltipOpen === term ? null : term); }} className="text-[#00e5c7] opacity-60 hover:opacity-100 transition-opacity"><Info className="w-3 h-3" /></button>
        {tooltipOpen === term && (
          <span className="absolute left-0 bottom-6 z-50 bg-[#152a4f] border border-[#1e3a5f] rounded-lg px-3 py-2 text-xs text-[#e8f0f8] w-56 shadow-lg" onClick={e => e.stopPropagation()}>
            <strong className="text-[#00e5c7]">{term}</strong><br />{def}
          </span>
        )}
      </span>
    );
  };

  const renderLocCard = (key: string, name: string, location: string, species: string[], tags: { label: string; color: string }[], lat?: number | null, lon?: number | null, extra?: React.ReactNode) => (
    <div key={key} onClick={() => selectLoc(key, name, lat, lon)} className={`rounded-xl p-3 cursor-pointer transition-all border-[1.5px] ${state.loc === key ? 'border-[#00e5c7] bg-[rgba(0,229,199,0.06)]' : 'border-[#1e3a5f] bg-[#152a4f] hover:border-[#1a6b8a]'}`}>
      {extra}
      <div className="font-semibold text-sm mb-0.5">{name}</div>
      <div className="text-[11px] text-[#7a8ea6] mb-1.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{location}</div>
      <div className="flex flex-wrap gap-1">
        {species.map(s => (<span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(0,229,199,0.15)] text-[#00e5c7] font-medium">{s}</span>))}
        {tags.map((t, i) => (<span key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tagColorClass(t.color)}`}>{t.label}</span>))}
      </div>
    </div>
  );

  const renderPill = (groupKey: keyof WizardState, val: string, label: string, isWarn = false) => (
    <button onClick={() => selectPill(groupKey, val)} className={`px-3.5 py-2 rounded-full border-[1.5px] text-sm font-medium cursor-pointer transition-all ${state[groupKey] === val ? isWarn ? 'bg-[#c0c8d8] border-[#c0c8d8] text-[#0a1628] font-semibold' : 'bg-[#00e5c7] border-[#00e5c7] text-[#0a1628] font-semibold' : 'border-[#1e3a5f] bg-[#152a4f] text-[#7a8ea6] hover:border-[#00e5c7] hover:text-[#00e5c7]'}`}>
      {label}
    </button>
  );

  const renderWizardNav = () => (
    <div className="flex items-center justify-between mb-4 min-h-8">
      <button onClick={wizardBack} className={`bg-transparent border-none text-[#7a8ea6] text-sm cursor-pointer hover:text-[#e8f0f8] ${screen > 0 ? 'visible' : 'invisible'}`}>← Back</button>
      <div className="flex gap-1.5 items-center">{[0, 1, 2, 3, 4].map(i => (<div key={i} className={`h-2 rounded-full transition-all ${i === screen ? 'bg-[#00e5c7] w-5' : i < screen ? 'bg-[#00e5c7] opacity-40 w-2' : 'bg-[#1e3a5f] w-2'}`} />))}</div>
      <div className="w-12" />
    </div>
  );

  // ── WELCOME SCREEN ──────────────────────────────────────────────────
  const renderWelcome = () => (
    <div className="animate-fade-up text-center">
      <div className="font-display text-[48px] tracking-[4px] text-[#00e5c7] leading-none mt-8">Novacast</div>
      <div className="text-sm text-[#c0c8d8] tracking-[3px] uppercase mt-2 mb-1">Your Fishing Mentor</div>
      <div className="text-xs text-[#7a8ea6] mb-8">STL Area — {currentMonth} Edition</div>

      <div className="bg-[rgba(0,229,199,0.08)] border border-[rgba(0,229,199,0.25)] rounded-xl px-4 py-3 text-sm text-[#00e5c7] mb-8 leading-relaxed text-left">
        {getMonthBanner()}
      </div>

      <div className="text-xs uppercase tracking-widest text-[#7a8ea6] mb-3 font-semibold">How do you want to find water?</div>

      <button onClick={startWithGPS} disabled={nearbyLoading} className="w-full py-4 bg-[rgba(0,229,199,0.12)] border-[1.5px] border-[#00e5c7] rounded-xl text-[#00e5c7] text-sm font-semibold cursor-pointer mb-3 flex items-center justify-center gap-2.5 hover:bg-[rgba(0,229,199,0.2)] disabled:opacity-50 transition-all animate-pulse-glow">
        <Navigation className="w-5 h-5" /> {nearbyLoading ? 'Searching...' : 'Find Near Me'}
      </button>
      {nearbyError && <div className="text-[#e05c5c] text-xs mb-3">{nearbyError}</div>}

      <div className="flex gap-2 mb-3">
        <input type="text" value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="Zip code" maxLength={10} className="flex-1 bg-[#152a4f] border border-[#1e3a5f] rounded-xl text-[#e8f0f8] text-sm px-4 py-3.5 outline-none focus:border-[#00e5c7]" onKeyDown={e => e.key === 'Enter' && searchByZip()} />
        <button onClick={searchByZip} disabled={zipLoading} className="px-5 py-3.5 bg-[#152a4f] border border-[#1e3a5f] rounded-xl text-[#00e5c7] cursor-pointer hover:bg-[rgba(0,229,199,0.1)] disabled:opacity-50 transition-all"><Search className="w-5 h-5" /></button>
      </div>
      {zipError && <div className="text-[#e05c5c] text-xs mb-3">{zipError}</div>}

      <div className="text-xs text-[#7a8ea6] mb-3">or</div>

      <button onClick={() => { setView('wizard'); setScreen(0); }} className="w-full py-4 bg-[#152a4f] border-[1.5px] border-[#1e3a5f] rounded-xl text-[#c0c8d8] text-sm font-semibold cursor-pointer flex items-center justify-center gap-2.5 hover:border-[#c0c8d8] hover:text-white transition-all">
        <MapPin className="w-5 h-5" /> Browse St. Louis Favorites
      </button>

      <div className="mt-8 flex justify-center gap-4">
        <button onClick={() => setView('tacklebox')} className="text-[#7a8ea6] hover:text-[#00e5c7] transition-colors flex items-center gap-1.5 text-sm"><Heart className="w-4 h-4" /> My Tacklebox</button>
        <button onClick={() => setShowReference(true)} className="text-[#7a8ea6] hover:text-[#00e5c7] transition-colors flex items-center gap-1.5 text-sm"><BookOpen className="w-4 h-4" /> Reference</button>
      </div>
    </div>
  );

  // ── WIZARD SCREENS ──────────────────────────────────────────────────
  const renderScreen0 = () => (
    <div className="animate-fade-up">
      <div className="bg-[#0f1f3d] border border-[#1e3a5f] rounded-2xl p-5 mb-3.5">
        <div className="text-[10px] uppercase tracking-[2px] text-[#00e5c7] font-semibold mb-2">Step 1 of 5</div>
        <div className="font-display text-[22px] tracking-wide mb-3.5">Pick Your Water</div>

        {nearbyWater.length > 0 && (
          <div className="mb-3.5">
            <div className="text-xs uppercase tracking-widest text-[#7a8ea6] mb-2 font-semibold">Nearby Water Bodies</div>
            {nearbyWater.map((w, i) => (
              <div key={i} onClick={() => selectLoc(`nearby_${i}`, w.name, w.lat, w.lon)} className={`rounded-xl p-3 cursor-pointer transition-all border-[1.5px] mb-2 ${state.loc === `nearby_${i}` ? 'border-[#00e5c7] bg-[rgba(0,229,199,0.06)]' : 'border-[#1e3a5f] bg-[#152a4f] hover:border-[#1a6b8a]'}`}>
                <div className="text-[11px] text-[#c0c8d8] font-semibold mb-0.5">{w.distance.toFixed(1)} miles away</div>
                <div className="font-semibold text-sm mb-0.5">{w.name}</div>
                <div className="text-[11px] text-[#7a8ea6]">{w.type}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3.5">
          {Object.entries(REGION_LABELS).filter(([k]) => k !== 'springfield' && k !== 'stockton' && k !== 'custom').map(([key, label]) => (
            <button key={key} onClick={() => setActiveRegion(key)} className={`px-3 py-1.5 rounded-full border-[1.5px] text-xs font-semibold cursor-pointer transition-all ${activeRegion === key ? 'bg-[#00e5c7] border-[#00e5c7] text-[#0a1628]' : 'border-[#1e3a5f] bg-[#152a4f] text-[#7a8ea6] hover:border-[#00e5c7] hover:text-[#00e5c7]'}`}>{label}</button>
          ))}
          <button onClick={() => setActiveRegion('mylakes')} className={`px-3 py-1.5 rounded-full border-[1.5px] text-xs font-semibold cursor-pointer transition-all ${activeRegion === 'mylakes' ? 'bg-[#c0c8d8] border-[#c0c8d8] text-[#0a1628]' : 'border-[#1e3a5f] bg-[#152a4f] text-[#7a8ea6] hover:border-[#c0c8d8] hover:text-[#c0c8d8]'}`}>My Lakes</button>
        </div>

        {activeRegion !== 'mylakes' && (
          <div className="flex flex-col gap-2">
            {waterBodiesByRegion(activeRegion).map(w => renderLocCard(w.key, w.name, w.location, w.species, w.tags || [], w.latitude, w.longitude))}
            {adminLakes.filter(l => l.region === activeRegion).map(l => renderLocCard(l.id, l.name, l.location, l.species, []))}
            {waterBodiesByRegion(activeRegion).length === 0 && adminLakes.filter(l => l.region === activeRegion).length === 0 && (<div className="text-[#7a8ea6] text-sm text-center py-5">No water bodies in this region yet.</div>)}
          </div>
        )}

        {activeRegion === 'mylakes' && (
          <div className="flex flex-col gap-2">
            <div className="bg-[#152a4f] border-[1.5px] border-dashed border-[#1e3a5f] rounded-xl p-3.5 mb-2">
              <div className="text-[11px] uppercase tracking-widest text-[#00e5c7] font-semibold mb-2.5">Add a New Lake or Pond</div>
              <input type="text" placeholder="Name" value={newLake.name} onChange={e => setNewLake(s => ({ ...s, name: e.target.value }))} className="w-full bg-[#0f1f3d] border border-[#1e3a5f] rounded-lg text-[#e8f0f8] text-sm px-3 py-2.5 mb-2 outline-none focus:border-[#00e5c7]" maxLength={60} />
              <input type="text" placeholder="Location (optional)" value={newLake.location} onChange={e => setNewLake(s => ({ ...s, location: e.target.value }))} className="w-full bg-[#0f1f3d] border border-[#1e3a5f] rounded-lg text-[#e8f0f8] text-sm px-3 py-2.5 mb-2 outline-none focus:border-[#00e5c7]" maxLength={80} />
              <select value={newLake.type} onChange={e => setNewLake(s => ({ ...s, type: e.target.value }))} className="w-full bg-[#0f1f3d] border border-[#1e3a5f] rounded-lg text-[#e8f0f8] text-sm px-3 py-2.5 mb-2 outline-none focus:border-[#00e5c7]">
                <option value="" disabled>Water type...</option><option value="pond">Small Pond</option><option value="lake">Lake</option><option value="river">River / Creek</option><option value="reservoir">Reservoir</option>
              </select>
              <textarea placeholder="Notes" value={newLake.notes} onChange={e => setNewLake(s => ({ ...s, notes: e.target.value }))} className="w-full bg-[#0f1f3d] border border-[#1e3a5f] rounded-lg text-[#e8f0f8] text-sm px-3 py-2.5 mb-2 outline-none focus:border-[#00e5c7] resize-none h-14" />
              <button onClick={addCustomLake} className="w-full py-2.5 bg-[#00e5c7] text-[#0a1628] font-display text-base tracking-wider rounded-lg cursor-pointer border-none">SAVE THIS LAKE</button>
            </div>
            {customLakes.length === 0 && <div className="text-[#7a8ea6] text-sm text-center py-5">No saved lakes yet.</div>}
            {customLakes.map(l => (
              <div key={l.id} className="relative">
                {renderLocCard(l.id, l.name, l.location || 'No address', [], [{ label: TYPE_LABELS[l.type] || l.type, color: 'orange' }, ...(l.notes ? [{ label: l.notes.substring(0, 40) + (l.notes.length > 40 ? '...' : ''), color: 'blue' }] : []), { label: 'Custom Spot', color: 'green' }])}
                <button onClick={e => { e.stopPropagation(); deleteCustomLake(l.id); }} className="absolute top-2.5 right-2.5 bg-[rgba(224,92,92,0.2)] border-none text-[#f09090] text-[11px] px-2 py-0.5 rounded-full cursor-pointer">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {missingMsg && <div className="text-[#e05c5c] text-sm text-center mt-2.5 min-h-5">{missingMsg}</div>}
      <button onClick={() => wizardNext(0)} className="w-full py-4 bg-[#00e5c7] text-[#0a1628] font-display text-xl tracking-[2px] rounded-xl cursor-pointer border-none hover:brightness-110 hover:-translate-y-px transition-all mt-1.5">NEXT: Time of Day →</button>
    </div>
  );

  const renderScreen1 = () => (
    <div className="animate-fade-up">
      <div className="bg-[#0f1f3d] border border-[#1e3a5f] rounded-2xl p-5 mb-3.5">
        <div className="text-[10px] uppercase tracking-[2px] text-[#00e5c7] font-semibold mb-2">Step 2 of 5</div>
        <div className="font-display text-[22px] tracking-wide mb-3.5">What Time Are You Going?</div>
        <div className="flex flex-wrap gap-2">
          {renderPill('time', 'night', '🌙 Night (10pm–5am)')}
          {renderPill('time', 'dawn', '🌅 Dawn (5–8am)')}
          {renderPill('time', 'morning', '☀️ Morning (8–11am)')}
          {renderPill('time', 'midday', '🌞 Midday (11am–3pm)')}
          {renderPill('time', 'afternoon', '🌤️ Afternoon (3–6pm)')}
          {renderPill('time', 'evening', '🌇 Evening (6–10pm)')}
        </div>
      </div>
      {missingMsg && <div className="text-[#e05c5c] text-sm text-center mt-2.5 min-h-5">{missingMsg}</div>}
      <button onClick={() => wizardNext(1)} className="w-full py-4 bg-[#00e5c7] text-[#0a1628] font-display text-xl tracking-[2px] rounded-xl cursor-pointer border-none hover:brightness-110 transition-all mt-1.5">NEXT: Conditions →</button>
    </div>
  );

  const renderScreen2 = () => (
    <div className="animate-fade-up">
      <div className="bg-[#0f1f3d] border border-[#1e3a5f] rounded-2xl p-5 mb-3.5">
        <div className="text-[10px] uppercase tracking-[2px] text-[#00e5c7] font-semibold mb-2">Step 3 of 5</div>
        <div className="font-display text-[22px] tracking-wide mb-3.5">What Are the Conditions?</div>

        <button onClick={loadWeather} disabled={weatherLoading} className="w-full py-2.5 bg-[rgba(0,229,199,0.1)] border-[1.5px] border-[#00e5c7] rounded-xl text-[#00e5c7] text-sm font-semibold cursor-pointer mb-3.5 hover:bg-[rgba(0,229,199,0.2)] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
          {weatherLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
          {weatherLoading ? 'Getting Weather...' : 'Auto-Fill from Current Weather'}
        </button>
        {weatherStatus && <div className="text-xs text-[#00e5c7] text-center mb-2.5">{weatherStatus}</div>}
        {weatherLoaded && <div className="bg-[rgba(0,229,199,0.08)] border border-[rgba(0,229,199,0.2)] rounded-lg px-3 py-2 text-xs text-[#00e5c7] mb-2.5">{weatherLoaded}<br /><span className="text-[#7a8ea6]">Sky, temp, wind, and pressure auto-filled. Set water color manually.</span></div>}

        <div className="mb-4">
          <div className="text-xs uppercase tracking-widest text-[#7a8ea6] mb-2 font-semibold flex items-center gap-1.5"><Cloud className="w-3.5 h-3.5" /> Sky</div>
          <div className="flex flex-wrap gap-2">{renderPill('sky', 'sunny', '☀️ Sunny')}{renderPill('sky', 'partly', '⛅ Partly Cloudy')}{renderPill('sky', 'overcast', '☁️ Overcast')}{renderPill('sky', 'rainy', '🌧️ Rainy')}</div>
        </div>

        <div className="mb-4">
          <div className="text-xs uppercase tracking-widest text-[#7a8ea6] mb-2 font-semibold flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5" /> Water Color</div>
          <div className="flex flex-wrap gap-2">{renderPill('water', 'clear', '🔵 Clear')}{renderPill('water', 'stained', '🟤 Stained')}{renderPill('water', 'murky', '⚫ Murky')}{renderPill('water', 'green', '🟢 Green / Algae')}</div>
        </div>

        <div className="mb-4">
          <div className="text-xs uppercase tracking-widest text-[#7a8ea6] mb-2 font-semibold flex items-center gap-1.5"><Thermometer className="w-3.5 h-3.5" /> Air Temp</div>
          <div className="flex flex-wrap gap-2">{renderPill('temp', 'cold', '🧊 Cold (<45°F)')}{renderPill('temp', 'cool', '🌊 Cool (45–60°F)')}{renderPill('temp', 'warm', '🔆 Warm (60°F+)')}</div>
        </div>

        <div className="mb-4">
          <div className="text-xs uppercase tracking-widest text-[#7a8ea6] mb-2 font-semibold flex items-center gap-1.5"><Wind className="w-3.5 h-3.5" /> Wind</div>
          <div className="flex flex-wrap gap-2">{renderPill('wind', 'calm', '😌 Calm')}{renderPill('wind', 'light', '🍃 Light Breeze')}{renderPill('wind', 'strong', '💨 Windy')}</div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-[#7a8ea6] mb-2 font-semibold flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20M7 7l10 10M17 7L7 17"/></svg>
            Barometric Pressure
          </div>
          <div className="text-[11px] text-[#7a8ea6] mb-1.5">Affects fish activity more than most anglers realize. Auto-filled by weather.</div>
          <div className="flex flex-wrap gap-2">{renderPill('pressure', 'falling', '📉 Falling')}{renderPill('pressure', 'steady_low', '🫧 Low')}{renderPill('pressure', 'rising', '📈 Rising')}{renderPill('pressure', 'steady_high', '🔵 High')}</div>
        </div>

        <div onClick={() => { setState(s => ({ ...s, sky: null, water: null, temp: null, wind: null, pressure: null })); wizardNext(2); }} className="block text-center text-[#7a8ea6] text-sm py-3 cursor-pointer underline underline-offset-2 hover:text-[#e8f0f8] mt-2">Skip — Not Sure →</div>
      </div>
      {missingMsg && <div className="text-[#e05c5c] text-sm text-center mt-2.5 min-h-5">{missingMsg}</div>}
      <button onClick={() => wizardNext(2)} className="w-full py-4 bg-[#00e5c7] text-[#0a1628] font-display text-xl tracking-[2px] rounded-xl cursor-pointer border-none hover:brightness-110 transition-all mt-1.5">NEXT: Recent Weather →</button>
    </div>
  );

  const renderScreen3 = () => (
    <div className="animate-fade-up">
      <div className="bg-[#0f1f3d] border border-[#1e3a5f] rounded-2xl p-5 mb-3.5">
        <div className="text-[10px] uppercase tracking-[2px] text-[#00e5c7] font-semibold mb-2">Step 4 of 5 — Optional</div>
        <div className="font-display text-[22px] tracking-wide mb-3.5">Did Anything Happen Recently?</div>
        <div className="bg-[rgba(26,107,138,0.15)] border border-[#1a6b8a] rounded-xl px-3.5 py-2.5 text-xs text-[#5cc8e0] mb-3 leading-relaxed">What happened in the last 1–3 days can change where fish are and what they'll bite.</div>
        <div className="flex flex-col gap-2">
          {RECENT_WEATHER_OPTIONS.map(opt => (
            <div key={opt.key} onClick={() => toggleRW(opt.key)} className={`flex items-start gap-3 rounded-xl p-3 cursor-pointer transition-all border-[1.5px] ${state.recentWeather.includes(opt.key) ? 'border-[#c0c8d8] bg-[rgba(192,200,216,0.06)]' : 'border-[#1e3a5f] bg-[#152a4f] hover:border-[#1a6b8a]'}`}>
              <div className="text-xl flex-shrink-0 mt-0.5">{opt.icon}</div>
              <div><div className="font-semibold text-sm mb-0.5">{opt.label}</div><div className="text-xs text-[#7a8ea6] leading-relaxed">{opt.desc}</div></div>
            </div>
          ))}
        </div>
        <div onClick={() => wizardNext(3, true)} className="block text-center text-[#7a8ea6] text-sm py-3 cursor-pointer underline underline-offset-2 hover:text-[#e8f0f8]">Skip — nothing notable →</div>
      </div>
      <button onClick={() => wizardNext(3)} className="w-full py-4 bg-[#00e5c7] text-[#0a1628] font-display text-xl tracking-[2px] rounded-xl cursor-pointer border-none hover:brightness-110 transition-all mt-1.5">NEXT: Target Fish →</button>
    </div>
  );

  const renderScreen4 = () => (
    <div className="animate-fade-up">
      <div className="bg-[#0f1f3d] border border-[#1e3a5f] rounded-2xl p-5 mb-3.5">
        <div className="text-[10px] uppercase tracking-[2px] text-[#00e5c7] font-semibold mb-2">Step 5 of 5</div>
        <div className="font-display text-[22px] tracking-wide mb-3.5">What Are You Targeting?</div>
        <div className="flex flex-wrap gap-2">
          {renderPill('fish', 'bass', '🐟 Bass')}{renderPill('fish', 'crappie', '🐠 Crappie')}{renderPill('fish', 'catfish', '🐱 Catfish')}{renderPill('fish', 'bluegill', '🫐 Bluegill')}{renderPill('fish', 'smallmouth', '🏔️ Smallmouth')}{renderPill('fish', 'anything', '🤷 Whatever bites', true)}
        </div>
      </div>
      {missingMsg && <div className="text-[#e05c5c] text-sm text-center mt-2.5 min-h-5">{missingMsg}</div>}
      <button onClick={() => wizardNext(4)} className="w-full py-4 bg-[#00e5c7] text-[#0a1628] font-display text-xl tracking-[2px] rounded-xl cursor-pointer border-none hover:brightness-110 transition-all mt-1.5">GET MY GAME PLAN →</button>
    </div>
  );

  // ── RESULT PANEL ────────────────────────────────────────────────────
  const renderResult = () => {
    const { loc, locName, time, sky, water, temp, wind, pressure, fish, recentWeather } = state;
    const isSkipped = !sky && !water && !temp && !wind && !pressure;
    const f = fish || 'anything';
    const t = time || 'morning';
    const s = sky || 'partly';
    const w = water || 'stained';
    const tp = temp || 'cool';
    const wi = wind || 'light';

    let lures: Lure[]; let colors: { colors: ColorRec[]; reason: string }; let walmart: WalmartItem[]; let proTip: string; let mv: { title: string; depthPct: number; moveText: string };

    if (isSkipped) {
      const general = getGeneralBestRecommendation(MONTH);
      lures = general.lures; colors = general.colors; walmart = getWalmart(f, 'stained', t); proTip = general.tip;
      mv = { title: 'General Best — Seasonal Recommendation', depthPct: 40, moveText: `You skipped conditions, so here's the ${currentMonth.toLowerCase()} best bet. ${general.tip}` };
    } else {
      mv = getFishMovement(t, s);
      mv = applyRecentWeatherToDepth(mv, recentWeather);
      if (pressure) { const baroImpact = getBarometricImpact(pressure); if (baroImpact) mv = { ...mv, depthPct: Math.max(5, Math.min(95, mv.depthPct + baroImpact.depthAdj)) }; }
      lures = getLures(s, w, tp, f, t, pressure || undefined);
      colors = getColors(s, w, t);
      walmart = getWalmart(f, w, t);
      proTip = getProTip(s, w, tp, wi, f, t, loc || '', pressure || undefined);
    }

    const rwImpacts = getRecentWeatherImpact(recentWeather);
    const spots = getSpots(getLocSpots(), time || 'morning', sky || 'partly');
    const regs = getLocSpecialRegs();
    const coords = getLocCoords();

    return (
      <div className="animate-slide-in">
        <div className="bg-[#0f1f3d] border border-[#1e3a5f] rounded-2xl p-5">
          <div className="font-display text-[26px] tracking-[2px] text-[#00e5c7] mb-1">Game Plan: {locName || loc}</div>
          {coords.lat && coords.lon && (
            <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lon}`, '_blank')} className="flex items-center gap-1.5 text-xs text-[#5cc8e0] mb-3 hover:text-[#00e5c7] transition-colors cursor-pointer bg-transparent border-none">
              <Navigation className="w-3.5 h-3.5" /> Navigate with Google Maps
            </button>
          )}

          {regs && <div className="bg-[rgba(224,92,92,0.08)] border border-[rgba(224,92,92,0.3)] rounded-lg px-3 py-2 text-xs text-[#f09090] mb-3">{regs}</div>}

          <div className="bg-gradient-to-br from-[rgba(26,107,138,0.2)] to-[rgba(10,22,40,0.8)] border border-[#1a6b8a] rounded-xl p-4 mb-3">
            <div className="font-display text-lg tracking-wide text-[#5cc8e0] mb-2">{mv.title}</div>
            <div className="bg-[rgba(255,255,255,0.05)] rounded-full h-2.5 my-2.5 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#00e5c7] to-[#1a6b8a] depth-bar-animate" style={{ width: `${mv.depthPct}%` }} /></div>
            <div className="flex justify-between text-[10px] text-[#7a8ea6]"><span>Shallow (0–3ft)</span><span>Mid (4–8ft)</span><span>Deep (9ft+)</span></div>
            <div className="text-[13px] leading-relaxed text-[#e8f0f8] mt-2">{mv.moveText}</div>
          </div>

          {pressure && getBarometricImpact(pressure) && (
            <div className="bg-[rgba(26,107,138,0.12)] border border-[rgba(26,107,138,0.35)] rounded-xl p-4 mb-3">
              <div className="text-[10px] uppercase tracking-[2px] text-[#5cc8e0] font-semibold mb-2.5">Barometric Pressure</div>
              <div className="font-display text-base tracking-wide text-[#5cc8e0] mb-1.5">{getBarometricImpact(pressure)!.title}</div>
              <div className="text-[13px] leading-relaxed text-[#e8f0f8]">{getBarometricImpact(pressure)!.text}</div>
            </div>
          )}

          {rwImpacts && rwImpacts.length > 0 && (
            <div className="bg-[#152a4f] border border-[#1e3a5f] rounded-xl p-4 mb-3">
              <div className="text-[10px] uppercase tracking-[2px] text-[#7a8ea6] font-semibold mb-2.5">How Recent Weather Is Affecting Today</div>
              {rwImpacts.map((impact, i) => <div key={i} className="text-[13px] leading-relaxed mb-2.5 last:mb-0" dangerouslySetInnerHTML={{ __html: impact }} />)}
            </div>
          )}

          <div className="bg-[#152a4f] border border-[#1e3a5f] rounded-xl p-4 mb-3">
            <div className="text-[10px] uppercase tracking-[2px] text-[#7a8ea6] font-semibold mb-2.5">Where to Set Up</div>
            {spots.map((s, i) => (
              <div key={i} className="bg-[#0f1f3d] border border-[#1e3a5f] rounded-lg p-3 mb-2 last:mb-0">
                <div className={`inline-block text-[10px] px-2 py-0.5 rounded-full mb-1.5 font-semibold ${i === 0 ? 'bg-[#00e5c7] text-[#0a1628]' : i === 1 ? 'bg-[rgba(192,200,216,0.2)] text-[#c0c8d8]' : 'bg-[rgba(255,255,255,0.08)] text-[#7a8ea6]'}`}>
                  {i === 0 ? 'Best Right Now' : i === 1 ? 'Also Try' : 'Backup'}
                </div>
                <div className="font-semibold text-sm mb-1">{s.name}</div>
                <div className="text-xs text-[#7a8ea6] leading-relaxed">{s.detail}</div>
              </div>
            ))}
          </div>

          <div className="bg-[#152a4f] border border-[#1e3a5f] rounded-xl p-4 mb-3">
            <div className="text-[10px] uppercase tracking-[2px] text-[#7a8ea6] font-semibold mb-2.5">Best Lures For These Conditions</div>
            {lures.map((l, i) => (
              <div key={i} className={`rounded-lg p-3 mb-2 last:mb-0 border ${i === 0 ? 'border-[#00e5c7] bg-[rgba(0,229,199,0.04)]' : 'border-[#1e3a5f] bg-[#0f1f3d]'}`}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{l.name}</span>
                    {l.isBold && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(192,200,216,0.15)] text-[#c0c8d8] font-semibold">BOLD</span>}
                    <button onClick={() => toggleTacklebox('lures', l.name)} className={`transition-colors ${tacklebox.lures.includes(l.name) ? 'text-[#e05c5c]' : 'text-[#7a8ea6] hover:text-[#00e5c7]'}`}><Heart className="w-3.5 h-3.5" fill={tacklebox.lures.includes(l.name) ? 'currentColor' : 'none'} /></button>
                  </div>
                  <div className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${i === 0 ? 'bg-[#00e5c7] text-[#0a1628]' : 'bg-[rgba(192,200,216,0.2)] text-[#c0c8d8]'}`}>{i === 0 ? 'BEST PICK' : 'GOOD CHOICE'}</div>
                </div>
                <div className="text-xs text-[#7a8ea6] leading-relaxed mb-1.5">{l.reason}</div>
                {l.talkingPoint && <div className="text-xs text-[#5cc8e0] leading-relaxed mb-1 border-l-2 border-[#1a6b8a] pl-2.5">Why: {l.talkingPoint}</div>}
                {l.technique && <div className="text-xs text-[#c0c8d8] leading-relaxed border-l-2 border-[rgba(192,200,216,0.3)] pl-2.5">How: {l.technique}</div>}
              </div>
            ))}
          </div>

          <div className="bg-[#152a4f] border border-[#1e3a5f] rounded-xl p-4 mb-3">
            <div className="text-[10px] uppercase tracking-[2px] text-[#7a8ea6] font-semibold mb-2.5">Best Colors Today</div>
            <div className="flex flex-wrap gap-2">
              {colors.colors.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-[#0f1f3d] border border-[#1e3a5f] rounded-lg px-2.5 py-1.5 text-xs">
                  <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-[rgba(255,255,255,0.15)]" style={{ background: c.hex }} />
                  {c.name}
                  {c.tooltip && <Tooltip term={c.name} />}
                  <button onClick={() => toggleTacklebox('colors', c.name)} className={`ml-1 transition-colors ${tacklebox.colors.includes(c.name) ? 'text-[#e05c5c]' : 'text-[#7a8ea6] hover:text-[#00e5c7]'}`}><Heart className="w-3 h-3" fill={tacklebox.colors.includes(c.name) ? 'currentColor' : 'none'} /></button>
                </div>
              ))}
            </div>
            <div className="text-xs text-[#7a8ea6] mt-2">{colors.reason}</div>
          </div>

          <div className="bg-[#152a4f] border border-[#1e3a5f] rounded-xl p-4 mb-3">
            <div className="text-[10px] uppercase tracking-[2px] text-[#7a8ea6] font-semibold mb-2.5">What to Grab at Walmart</div>
            {walmart.map((w, i) => (
              <div key={i} className="bg-[rgba(0,113,206,0.08)] border border-[rgba(0,113,206,0.25)] rounded-lg p-3 mb-2 last:mb-0">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="font-semibold text-sm">{w.name}</div>
                  <button onClick={() => toggleTacklebox('walmart', w.name)} className={`transition-colors ${tacklebox.walmart.includes(w.name) ? 'text-[#e05c5c]' : 'text-[#7a8ea6] hover:text-[#00e5c7]'}`}><Heart className="w-3.5 h-3.5" fill={tacklebox.walmart.includes(w.name) ? 'currentColor' : 'none'} /></button>
                </div>
                <div className="text-xs text-[#5cc8e0] leading-relaxed">{w.detail}</div>
                <div className="text-[11px] text-[#c0c8d8] font-semibold mt-1">{w.price}</div>
              </div>
            ))}
            <div className="text-[11px] text-[#7a8ea6] mt-2">All findable in the fishing aisle at most STL-area Walmart stores.</div>
          </div>

          <div className="bg-[rgba(192,200,216,0.06)] border border-[rgba(192,200,216,0.2)] rounded-xl p-3.5 text-[13px] text-[#c0c8d8] leading-relaxed mb-4">
            <strong className="text-white">Pro Tip:</strong> {proTip}
          </div>

          <button onClick={resetAll} className="w-full py-3 bg-transparent text-[#7a8ea6] text-sm border-[1.5px] border-[#1e3a5f] rounded-xl cursor-pointer hover:border-[#7a8ea6] hover:text-[#e8f0f8] transition-all">Start Over</button>
        </div>
      </div>
    );
  };

  // ── MY TACKLEBOX ───────────────────────────────────────────────────
  const renderTacklebox = () => (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <div className="font-display text-[28px] tracking-[2px] text-[#00e5c7]">My Tacklebox</div>
        <button onClick={() => setView('welcome')} className="text-[#7a8ea6] hover:text-[#e8f0f8] transition-colors text-sm cursor-pointer bg-transparent border-none">← Back</button>
      </div>

      {tacklebox.lures.length === 0 && tacklebox.colors.length === 0 && tacklebox.walmart.length === 0 && (
        <div className="bg-[#0f1f3d] border border-[#1e3a5f] rounded-2xl p-8 text-center">
          <Heart className="w-10 h-10 text-[#1e3a5f] mx-auto mb-3" />
          <div className="text-[#7a8ea6] text-sm">No saved items yet.</div>
          <div className="text-[#7a8ea6] text-xs mt-1">Tap the heart icon on any lure, color, or Walmart item to save it here.</div>
        </div>
      )}

      {tacklebox.lures.length > 0 && (
        <div className="bg-[#0f1f3d] border border-[#1e3a5f] rounded-2xl p-4 mb-3">
          <div className="text-[10px] uppercase tracking-[2px] text-[#00e5c7] font-semibold mb-3">Saved Lures</div>
          {tacklebox.lures.map((name, i) => (
            <div key={i} className="flex items-center justify-between bg-[#152a4f] border border-[#1e3a5f] rounded-lg p-3 mb-2 last:mb-0">
              <span className="text-sm font-semibold">{name}</span>
              <button onClick={() => toggleTacklebox('lures', name)} className="text-[#e05c5c] hover:text-[#f09090] transition-colors"><Heart className="w-4 h-4" fill="currentColor" /></button>
            </div>
          ))}
        </div>
      )}

      {tacklebox.colors.length > 0 && (
        <div className="bg-[#0f1f3d] border border-[#1e3a5f] rounded-2xl p-4 mb-3">
          <div className="text-[10px] uppercase tracking-[2px] text-[#00e5c7] font-semibold mb-3">Saved Colors</div>
          {tacklebox.colors.map((name, i) => (
            <div key={i} className="flex items-center justify-between bg-[#152a4f] border border-[#1e3a5f] rounded-lg p-3 mb-2 last:mb-0">
              <span className="text-sm font-semibold">{name}</span>
              <button onClick={() => toggleTacklebox('colors', name)} className="text-[#e05c5c] hover:text-[#f09090] transition-colors"><Heart className="w-4 h-4" fill="currentColor" /></button>
            </div>
          ))}
        </div>
      )}

      {tacklebox.walmart.length > 0 && (
        <div className="bg-[#0f1f3d] border border-[#1e3a5f] rounded-2xl p-4 mb-3">
          <div className="text-[10px] uppercase tracking-[2px] text-[#00e5c7] font-semibold mb-3">Shopping Checklist</div>
          {tacklebox.walmart.map((name, i) => (
            <div key={i} className="flex items-center justify-between bg-[#152a4f] border border-[#1e3a5f] rounded-lg p-3 mb-2 last:mb-0">
              <span className="text-sm font-semibold">{name}</span>
              <button onClick={() => toggleTacklebox('walmart', name)} className="text-[#e05c5c] hover:text-[#f09090] transition-colors"><Heart className="w-4 h-4" fill="currentColor" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── REFERENCE MODAL ─────────────────────────────────────────────────
  const renderReference = () => (
    <div className="fixed inset-0 bg-[#0a1628] z-50 overflow-y-auto p-6 pb-20">
      <div className="max-w-[480px] mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="font-display text-[28px] tracking-[2px] text-[#00e5c7]">Reference</div>
          <button onClick={() => setShowReference(false)} className="text-[#7a8ea6] hover:text-[#e8f0f8] transition-colors"><X className="w-6 h-6" /></button>
        </div>

        {Object.values(KNOT_GUIDES).map(guide => (
          <div key={guide.name} className="bg-[#0f1f3d] border border-[#1e3a5f] rounded-xl p-4 mb-3">
            <div className="font-display text-lg tracking-wide text-[#c0c8d8] mb-3">{guide.name}</div>
            {guide.steps.map((step, i) => (
              <div key={i} className="flex gap-3 mb-2.5 last:mb-0">
                <div className="w-6 h-6 rounded-full bg-[#00e5c7] text-[#0a1628] flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                <div className="text-sm text-[#e8f0f8] leading-relaxed pt-0.5">{step}</div>
              </div>
            ))}
            <div className="text-xs text-[#5cc8e0] mt-3 border-t border-[#1e3a5f] pt-2.5">{guide.tip}</div>
          </div>
        ))}

        <div className="bg-[#0f1f3d] border border-[#1e3a5f] rounded-xl p-4 mb-3">
          <div className="font-display text-lg tracking-wide text-[#c0c8d8] mb-3">Common Terms</div>
          {Object.entries(TOOLTIPS).slice(0, 12).map(([term, def]) => (
            <div key={term} className="mb-2.5 last:mb-0">
              <span className="text-sm font-semibold text-[#00e5c7]">{term}</span>
              <span className="text-sm text-[#7a8ea6]"> — {def}</span>
            </div>
          ))}
        </div>

        <button onClick={() => setShowReference(false)} className="w-full py-2.5 bg-transparent text-[#7a8ea6] text-sm border-[1.5px] border-[#1e3a5f] rounded-xl cursor-pointer hover:border-[#7a8ea6] hover:text-[#e8f0f8] transition-all mt-2">← Back</button>
      </div>
    </div>
  );

  // ── ADMIN ──────────────────────────────────────────────────────────
  const renderAdmin = () => (
    <div className="fixed inset-0 bg-[#0a1628] z-50 overflow-y-auto p-6 pb-20">
      <div className="max-w-[480px] mx-auto">
        <div className="font-display text-[28px] tracking-[2px] text-[#c0c8d8] mb-1">Admin</div>
        <div className="text-xs text-[#7a8ea6] mb-5">Hidden panel</div>
        {!adminAuthed ? (
          <div className="flex flex-col gap-2.5">
            <input type="password" value={adminPw} onChange={e => setAdminPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && adminLogin()} placeholder="Password" className="w-full bg-[#152a4f] border border-[#1e3a5f] rounded-lg text-[#e8f0f8] text-sm px-3 py-2.5 outline-none focus:border-[#00e5c7]" />
            {adminMsg && <div className={`text-sm text-center py-2 rounded-lg ${adminMsg.type === 'success' ? 'bg-[rgba(0,229,199,0.15)] text-[#00e5c7]' : 'bg-[rgba(224,92,92,0.15)] text-[#f09090]'}`}>{adminMsg.text}</div>}
            <button onClick={adminLogin} className="w-full py-3.5 bg-[#c0c8d8] text-[#0a1628] font-display text-lg tracking-[2px] rounded-xl cursor-pointer border-none">UNLOCK</button>
            <button onClick={() => setShowAdmin(false)} className="w-full py-2.5 bg-transparent text-[#7a8ea6] text-sm border-[1.5px] border-[#1e3a5f] rounded-xl cursor-pointer hover:border-[#7a8ea6] transition-all">Back</button>
          </div>
        ) : (
          <div>
            {adminMsg && <div className={`text-sm text-center py-2 rounded-lg mb-2.5 ${adminMsg.type === 'success' ? 'bg-[rgba(0,229,199,0.15)] text-[#00e5c7]' : 'bg-[rgba(224,92,92,0.15)] text-[#f09090]'}`}>{adminMsg.text}</div>}
            <div className="font-display text-lg tracking-wide text-[#e8f0f8] mb-3">Add New Lake</div>
            <div className="mb-3"><label className="block text-[11px] uppercase tracking-widest text-[#7a8ea6] font-semibold mb-1.5">Name *</label><input value={adminForm.name} onChange={e => setAdminForm(s => ({ ...s, name: e.target.value }))} className="w-full bg-[#152a4f] border border-[#1e3a5f] rounded-lg text-[#e8f0f8] text-sm px-3 py-2.5 outline-none focus:border-[#00e5c7]" maxLength={70} /></div>
            <div className="mb-3"><label className="block text-[11px] uppercase tracking-widest text-[#7a8ea6] font-semibold mb-1.5">Location *</label><input value={adminForm.location} onChange={e => setAdminForm(s => ({ ...s, location: e.target.value }))} className="w-full bg-[#152a4f] border border-[#1e3a5f] rounded-lg text-[#e8f0f8] text-sm px-3 py-2.5 outline-none focus:border-[#00e5c7]" maxLength={80} /></div>
            <div className="mb-3"><label className="block text-[11px] uppercase tracking-widest text-[#7a8ea6] font-semibold mb-1.5">Region *</label><select value={adminForm.region} onChange={e => setAdminForm(s => ({ ...s, region: e.target.value }))} className="w-full bg-[#152a4f] border border-[#1e3a5f] rounded-lg text-[#e8f0f8] text-sm px-3 py-2.5 outline-none focus:border-[#00e5c7]"><option value="" disabled>Choose...</option>{Object.entries(REGION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div className="mb-3"><label className="block text-[11px] uppercase tracking-widest text-[#7a8ea6] font-semibold mb-1.5">Type *</label><select value={adminForm.type} onChange={e => setAdminForm(s => ({ ...s, type: e.target.value }))} className="w-full bg-[#152a4f] border border-[#1e3a5f] rounded-lg text-[#e8f0f8] text-sm px-3 py-2.5 outline-none focus:border-[#00e5c7]"><option value="" disabled>Choose...</option><option value="lake">Lake</option><option value="pond">Pond</option><option value="river">River</option><option value="reservoir">Reservoir</option></select></div>
            <div className="mb-3"><label className="block text-[11px] uppercase tracking-widest text-[#7a8ea6] font-semibold mb-1.5">Species (comma separated)</label><input value={adminForm.species} onChange={e => setAdminForm(s => ({ ...s, species: e.target.value }))} className="w-full bg-[#152a4f] border border-[#1e3a5f] rounded-lg text-[#e8f0f8] text-sm px-3 py-2.5 outline-none focus:border-[#00e5c7]" /></div>
            {['spot1', 'spot2', 'spot3'].map((key, i) => (<div key={key} className="mb-3"><label className="block text-[11px] uppercase tracking-widest text-[#7a8ea6] font-semibold mb-1.5">{['🥇','🥈','🥉'][i]} Spot</label><textarea value={adminForm[key as keyof typeof adminForm]} onChange={e => setAdminForm(s => ({ ...s, [key]: e.target.value }))} className="w-full bg-[#152a4f] border border-[#1e3a5f] rounded-lg text-[#e8f0f8] text-sm px-3 py-2.5 outline-none focus:border-[#00e5c7] resize-none h-16" /></div>))}
            <div className="mb-3"><label className="block text-[11px] uppercase tracking-widest text-[#7a8ea6] font-semibold mb-1.5">Special Regs</label><input value={adminForm.regs} onChange={e => setAdminForm(s => ({ ...s, regs: e.target.value }))} className="w-full bg-[#152a4f] border border-[#1e3a5f] rounded-lg text-[#e8f0f8] text-sm px-3 py-2.5 outline-none focus:border-[#00e5c7]" /></div>
            <div className="mb-3"><label className="block text-[11px] uppercase tracking-widest text-[#7a8ea6] font-semibold mb-1.5">Notes</label><textarea value={adminForm.notes} onChange={e => setAdminForm(s => ({ ...s, notes: e.target.value }))} className="w-full bg-[#152a4f] border border-[#1e3a5f] rounded-lg text-[#e8f0f8] text-sm px-3 py-2.5 outline-none focus:border-[#00e5c7] resize-none h-16" /></div>
            <button onClick={adminSaveLake} className="w-full py-3.5 bg-[#c0c8d8] text-[#0a1628] font-display text-lg tracking-[2px] rounded-xl cursor-pointer border-none">SAVE LAKE</button>
            <div className="font-display text-lg tracking-wide text-[#e8f0f8] mt-5 mb-2.5">All Saved Lakes</div>
            {adminLakes.length === 0 && <div className="text-[#7a8ea6] text-sm py-2.5">No lakes added yet.</div>}
            {adminLakes.map(l => (<div key={l.id} className="bg-[#152a4f] border border-[#1e3a5f] rounded-lg p-3 mb-2 flex justify-between items-center"><div><div className="font-semibold text-[13px]">{l.name}</div><div className="text-[11px] text-[#7a8ea6]">{l.location}</div></div><button onClick={() => deleteAdminLake(l.id)} className="bg-[rgba(224,92,92,0.2)] border-none text-[#f09090] text-[11px] px-2.5 py-1 rounded-full cursor-pointer flex items-center gap-1"><Trash2 className="w-3 h-3" />Remove</button></div>))}
            <button onClick={() => setShowAdmin(false)} className="w-full py-2.5 bg-transparent text-[#7a8ea6] text-sm border-[1.5px] border-[#1e3a5f] rounded-xl cursor-pointer hover:border-[#7a8ea6] transition-all mt-4">Back</button>
          </div>
        )}
      </div>
    </div>
  );

  // ── MAIN RENDER ────────────────────────────────────────────────────
  return (
    <div className="relative z-10 max-w-[480px] mx-auto px-4">
      <header className="pt-7 pb-5 text-center">
        <div className="font-display text-[42px] tracking-[4px] text-[#00e5c7] leading-none">Novacast</div>
        <div className="text-xs text-[#c0c8d8] tracking-[3px] uppercase mt-1">Your Fishing Mentor</div>
      </header>

      {view === 'welcome' && renderWelcome()}
      {view === 'wizard' && (
        <>
          {renderWizardNav()}
          {screen === 0 && renderScreen0()}
          {screen === 1 && renderScreen1()}
          {screen === 2 && renderScreen2()}
          {screen === 3 && renderScreen3()}
          {screen === 4 && renderScreen4()}
        </>
      )}
      {view === 'result' && renderResult()}
      {view === 'tacklebox' && renderTacklebox()}

      {/* Bottom nav */}
      {view !== 'welcome' && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a1628] border-t border-[#1e3a5f] z-40">
          <div className="max-w-[480px] mx-auto flex justify-around py-2.5 px-4">
            <button onClick={resetAll} className="flex flex-col items-center gap-0.5 text-[#7a8ea6] hover:text-[#00e5c7] transition-colors bg-transparent border-none cursor-pointer"><MapPin className="w-5 h-5" /><span className="text-[10px]">Home</span></button>
            <button onClick={() => setView('tacklebox')} className="flex flex-col items-center gap-0.5 text-[#7a8ea6] hover:text-[#00e5c7] transition-colors bg-transparent border-none cursor-pointer"><Heart className="w-5 h-5" /><span className="text-[10px]">Tacklebox</span></button>
            <button onClick={() => setShowReference(true)} className="flex flex-col items-center gap-0.5 text-[#7a8ea6] hover:text-[#00e5c7] transition-colors bg-transparent border-none cursor-pointer"><BookOpen className="w-5 h-5" /><span className="text-[10px]">Reference</span></button>
            <button onClick={() => setShowAdmin(true)} className="flex flex-col items-center gap-0.5 text-[#1e3a5f] hover:text-[#7a8ea6] transition-colors bg-transparent border-none cursor-pointer"><Settings className="w-5 h-5" /><span className="text-[10px]">Admin</span></button>
          </div>
        </div>
      )}

      {showReference && renderReference()}
      {showAdmin && renderAdmin()}

      <div className="text-center text-[10px] text-[#1e3a5f] mt-6 pb-4">Powered by orionae.dev</div>
    </div>
  );
}
