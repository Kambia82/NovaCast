import { useState, useEffect, useCallback } from 'react';
import NovaCastWizard from './NovaCastWizard';
import NovaCastReference from './NovaCastReference';
import NovaCastTacklebox from './NovaCastTacklebox';

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

  const adminLogin = () => { if (adminPw === 'castmaster2025') { setAdminAuthed(true); setAdminMsg(null); } else { setAdminPw(''); setAdminMsg({ text: 'Wrong password', type: 'error' }); } };
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
     <input 
  type="text" 
  value={zipCode} 
  onChange={(e) => {
    const val = e.target.value;
    // Only update if it's a number
    if (/^\d*$/.test(val)) {
       setZipCode(val);
       // Only trigger search if they hit 5 digits
       if (val.length === 5) searchByZip();
    }
  }} 
  placeholder="Zip code" 
  maxLength={5} 
  className="flex-1 bg-[#152a4f] border border-[#1e3a5f] rounded-xl text-[#e8f0f8] text-sm px-4 py-3.5 outline-none focus:border-[#00e5c7]" 
  onKeyDown={e => e.key === 'Enter' && searchByZip()} 
/>
  
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

  // ── RESULT PANEL ────────────────────────────────────────────────────
  const renderResult = () => {
    const { loc, locName, time, sky, water, temp, wind, pressure, fish, recentWeather } = state;
    const isSkipped = !sky && !water && !temp && !wind && !pressure;
    const f = fish || 'anything';
    const t = time || 'morning';
    const s = sky || 'partly';
    const w = water || 'stained';
    const tp = temp || 'cool';

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
      proTip = getProTip(s, w, tp, wind || 'light', f, t, loc || '', pressure || undefined);
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
            <button onClick={() => setShowAdmin(false)} className="w-full py-2.5 bg-transparent text-[#7a8ea6] text-sm border-[1.5px] border-[#1e3a5f] rounded-xl cursor-pointer hover:border-[#7a8ea6] transition-all mt-4">Back</button>
          </div>
        )}
      </div>
    </div>
  );

  // ── MAIN RENDER ────────────────────────────────────────────────────
  return (
    <div className="relative z-10 max-w-[480px] mx-auto px-4">
      {view === 'welcome' && renderWelcome()}
      
      {view === 'wizard' && (
        <NovaCastWizard
          onComplete={(wizardState) => {
            setState(wizardState);
            setView('result');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          waterBodies={waterBodies}
          customLakes={customLakes}
          adminLakes={adminLakes}
        />
      )}

      {view === 'result' && renderResult()}
      
      {view === 'tacklebox' && (
        <NovaCastTacklebox
          onBack={() => setView('result')}
          externalTacklebox={tacklebox}
        />
      )}

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

      {showReference && (
        <NovaCastReference
          onClose={() => setShowReference(false)}
        />
      )}
      
      {showAdmin && renderAdmin()}

      <div className="text-center text-[10px] text-[#1e3a5f] mt-6 pb-4">Powered by orionae.dev</div>
    </div>
  );
}
