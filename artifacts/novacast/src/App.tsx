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
  Navigation, Settings, Trash2, Droplets, Thermometer,
  Wind, Heart, MapPin, Search, BookOpen, X, Info, Fish, ChevronLeft,
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

type AppView = 'discovery' | 'wizard' | 'workspace';
type WorkspaceTab = 'recommendations' | 'learn' | 'tacklebox';

const MONTH = new Date().getMonth();
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const currentMonth = MONTH_NAMES[MONTH];

function getMonthBanner() {
  if (MONTH >= 3 && MONTH <= 4) return 'Spawn season is on. Bass and crappie are moving shallow — one of the best times to fish the STL area.';
  if (MONTH === 5) return 'Post-spawn bass are hungry and feeding again. Great topwater month.';
  if (MONTH >= 6 && MONTH <= 8) return 'Summer patterns: early morning and evening are your best windows. Fish deep during midday heat.';
  if (MONTH >= 9 && MONTH <= 10) return 'Fall feed is on. Bass and crappie are aggressively feeding before winter.';
  if (MONTH >= 11 || MONTH <= 1) return 'Slow and deep — winter fishing means slow presentations in the deepest water. Fish are lethargic but catchable.';
  return 'Good fishing conditions in the STL area. Check conditions and pick your spot.';
}

export default function App() {
  const [view, setView] = useState<AppView>('discovery');
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('recommendations');
  const [state, setState] = useState<WizardState>({
    loc: null, locName: null, locLat: null, locLon: null, time: null, sky: null,
    water: null, temp: null, wind: null, pressure: null, fish: null, recentWeather: [],
  });
  const [waterBodies, setWaterBodies] = useState<WaterBodyRow[]>([]);
  const [customLakes, setCustomLakes] = useState<CustomLakeRow[]>([]);
  const [adminLakes, setAdminLakes] = useState<AdminLakeRow[]>([]);
  const [nearbyWater, setNearbyWater] = useState<NearbyWaterBody[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminPw, setAdminPw] = useState('');
  const [adminMsg, setAdminMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [adminForm, setAdminForm] = useState({ name: '', location: '', region: '', type: '', species: '', spot1: '', spot2: '', spot3: '', regs: '', notes: '' });
  const [tacklebox, setTacklebox] = useState<{ lures: string[]; colors: string[]; walmart: string[] }>(() => {
    try { const s = localStorage.getItem('novacast_tacklebox'); return s ? JSON.parse(s) : { lures: [], colors: [], walmart: [] }; } catch { return { lures: [], colors: [], walmart: [] }; }
  });
  const [tooltipOpen, setTooltipOpen] = useState<string | null>(null);

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
    setView('discovery');
    setActiveTab('recommendations');
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
      } catch { setNearbyError('Couldn\'t fetch nearby water. Try again.'); }
      setNearbyLoading(false);
      setView('wizard');
    }, () => { setNearbyError('Location permission denied.'); setNearbyLoading(false); setView('wizard'); });
  }, []);

  const searchByZip = useCallback(async () => {
    if (!zipCode || zipCode.length < 5) { setZipError('Enter a valid zip code.'); return; }
    setZipLoading(true); setZipError(''); setNearbyWater([]);
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${zipCode}+USA&limit=1`);
      const geoData = await geoRes.json();
      if (!geoData.length) { setZipError('Couldn\'t find that location.'); setZipLoading(false); return; }
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
      setView('wizard');
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
  const getLocSpecies = (): string[] => {
    const dbBody = waterBodies.find(w => w.key === state.loc); if (dbBody?.species?.length) return dbBody.species;
    const adminBody = adminLakes.find(l => l.id === state.loc); if (adminBody?.species?.length) return adminBody.species;
    return [];
  };

  const Tooltip = ({ term }: { term: string }) => {
    const def = TOOLTIPS[term];
    if (!def) return null;
    return (
      <span className="relative inline-flex ml-1">
        <button onClick={e => { e.stopPropagation(); setTooltipOpen(tooltipOpen === term ? null : term); }} className="text-[#BAE8FF] opacity-50 hover:opacity-100 transition-opacity"><Info className="w-3 h-3" /></button>
        {tooltipOpen === term && (
          <span className="absolute left-0 bottom-6 z-50 bg-[#122030] border border-[#1A3346] rounded-lg px-3 py-2 text-xs text-[#C8E4F0] w-56 shadow-xl" onClick={e => e.stopPropagation()}>
            <strong className="text-[#BAE8FF]">{term}</strong><br />{def}
          </span>
        )}
      </span>
    );
  };

  // ── DISCOVERY SCREEN ────────────────────────────────────────────────
  const renderDiscovery = () => (
    <div className="animate-fade-up text-center pb-6">
      {/* Nova hero */}
      <div className="pt-12 pb-8">
        <div className="text-[#7CCBE8] text-2xl mb-3 tracking-widest select-none">✦</div>
        <div className="font-display text-[52px] tracking-[5px] text-[#BAE8FF] leading-none nova-glow">Novacast</div>
        <div className="text-[11px] text-[#A8C8D8] tracking-[4px] uppercase mt-3 mb-1">Your Fishing Mentor</div>
        <div className="text-[11px] text-[#4A6878] tracking-[1px]">STL Area · {currentMonth}</div>
      </div>

      {/* Seasonal tip */}
      <div className="border-l-2 border-[#1A3346] px-4 py-2 text-left mb-8 mx-2">
        <div className="text-[11px] uppercase tracking-[2px] text-[#4A6878] mb-1 font-semibold">This Month</div>
        <div className="text-sm text-[#A8C8D8] leading-relaxed">{getMonthBanner()}</div>
      </div>

      {/* Find water */}
      <div className="text-[10px] uppercase tracking-[3px] text-[#4A6878] mb-4 font-semibold">Where are you fishing?</div>

      <button
        onClick={startWithGPS}
        disabled={nearbyLoading}
        className="w-full py-4 bg-[rgba(186,232,255,0.06)] border border-[#1A3346] rounded-2xl text-[#BAE8FF] text-sm font-semibold cursor-pointer mb-3 flex items-center justify-center gap-2.5 hover:bg-[rgba(186,232,255,0.1)] hover:border-[rgba(186,232,255,0.3)] disabled:opacity-40 transition-all animate-pulse-border"
      >
        <Navigation className="w-4 h-4" />
        {nearbyLoading ? 'Finding water near you...' : 'Find Near Me'}
      </button>
      {nearbyError && <div className="text-[#FC8181] text-xs mb-3">{nearbyError}</div>}

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={zipCode}
          onChange={e => { const v = e.target.value; if (/^\d*$/.test(v)) { setZipCode(v); if (v.length === 5) searchByZip(); } }}
          placeholder="Zip code"
          maxLength={5}
          className="flex-1 bg-[#0c1822] border border-[#1A3346] rounded-xl text-[#C8E4F0] text-sm px-4 py-3.5 outline-none focus:border-[rgba(186,232,255,0.4)] placeholder-[#4A6878] transition-colors"
          onKeyDown={e => e.key === 'Enter' && searchByZip()}
        />
        <button onClick={searchByZip} disabled={zipLoading} className="px-5 py-3.5 bg-[#0c1822] border border-[#1A3346] rounded-xl text-[#7CCBE8] cursor-pointer hover:bg-[rgba(186,232,255,0.06)] hover:border-[rgba(186,232,255,0.3)] disabled:opacity-40 transition-all">
          <Search className="w-4 h-4" />
        </button>
      </div>
      {zipError && <div className="text-[#FC8181] text-xs mb-3">{zipError}</div>}

      <div className="text-[10px] text-[#4A6878] mb-3 tracking-wider">— or —</div>

      <button
        onClick={() => setView('wizard')}
        className="w-full py-4 bg-[#0c1822] border border-[#1A3346] rounded-2xl text-[#A8C8D8] text-sm font-semibold cursor-pointer flex items-center justify-center gap-2.5 hover:border-[rgba(186,232,255,0.25)] hover:text-[#C8E4F0] transition-all"
      >
        <MapPin className="w-4 h-4" /> Browse STL Lakes
      </button>

      {/* Quick links */}
      <div className="mt-10 flex justify-center gap-6">
        <button
          onClick={() => { setState(prev => prev); setView('workspace'); setActiveTab('tacklebox'); }}
          className="text-[#4A6878] hover:text-[#7CCBE8] transition-colors flex items-center gap-1.5 text-sm"
        >
          <Heart className="w-4 h-4" /> My Tacklebox
        </button>
        <button
          onClick={() => { setView('workspace'); setActiveTab('learn'); }}
          className="text-[#4A6878] hover:text-[#7CCBE8] transition-colors flex items-center gap-1.5 text-sm"
        >
          <BookOpen className="w-4 h-4" /> Reference
        </button>
      </div>

      <div className="mt-10 text-[10px] text-[#1A3346]">Powered by orionae.dev</div>
    </div>
  );

  // ── RECOMMENDATIONS TAB CONTENT ──────────────────────────────────────
  const renderRecommendations = () => {
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
      mv = { title: 'Seasonal Best — ' + currentMonth, depthPct: 40, moveText: `You skipped conditions, so here's the ${currentMonth.toLowerCase()} best bet. ${general.tip}` };
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
      <div className="animate-slide-in space-y-3 pb-6">

        {/* Maps + special regs */}
        {coords.lat && coords.lon && (
          <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lon}`, '_blank')}
            className="flex items-center gap-1.5 text-xs text-[#7CCBE8] hover:text-[#BAE8FF] transition-colors cursor-pointer bg-transparent border-none mb-1">
            <Navigation className="w-3.5 h-3.5" /> Navigate to this lake
          </button>
        )}
        {regs && <div className="bg-[rgba(252,129,129,0.06)] border border-[rgba(252,129,129,0.2)] rounded-xl px-3 py-2.5 text-xs text-[#FC8181]">{regs}</div>}

        {/* Fish movement */}
        <div className="bg-[#0c1822] border border-[#1A3346] rounded-2xl p-4">
          <div className="text-[10px] uppercase tracking-[2px] text-[#4A6878] font-semibold mb-3">Fish Depth Right Now</div>
          <div className="font-display text-lg tracking-wide text-[#7CCBE8] mb-3">{mv.title}</div>
          <div className="bg-[rgba(255,255,255,0.04)] rounded-full h-2 mb-2 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[#BAE8FF] to-[#0E7490] depth-bar-animate" style={{ width: `${mv.depthPct}%` }} />
          </div>
          <div className="flex justify-between text-[9px] text-[#4A6878] mb-3">
            <span>Shallow (0–3 ft)</span><span>Mid (4–8 ft)</span><span>Deep (9 ft+)</span>
          </div>
          <div className="text-[13px] leading-relaxed text-[#A8C8D8]">{mv.moveText}</div>
        </div>

        {/* Barometric pressure */}
        {pressure && getBarometricImpact(pressure) && (
          <div className="bg-[#0c1822] border border-[#1A3346] rounded-2xl p-4">
            <div className="text-[10px] uppercase tracking-[2px] text-[#4A6878] font-semibold mb-2">Barometric Pressure</div>
            <div className="font-display text-base tracking-wide text-[#7CCBE8] mb-2">{getBarometricImpact(pressure)!.title}</div>
            <div className="text-[13px] leading-relaxed text-[#A8C8D8]">{getBarometricImpact(pressure)!.text}</div>
          </div>
        )}

        {/* Recent weather impacts */}
        {rwImpacts && rwImpacts.length > 0 && (
          <div className="bg-[#0c1822] border border-[#1A3346] rounded-2xl p-4">
            <div className="text-[10px] uppercase tracking-[2px] text-[#4A6878] font-semibold mb-3">How Recent Weather Affects Today</div>
            {rwImpacts.map((impact, i) => <div key={i} className="text-[13px] leading-relaxed mb-2.5 last:mb-0 text-[#A8C8D8]" dangerouslySetInnerHTML={{ __html: impact }} />)}
          </div>
        )}

        {/* Where to set up */}
        <div className="bg-[#0c1822] border border-[#1A3346] rounded-2xl p-4">
          <div className="text-[10px] uppercase tracking-[2px] text-[#4A6878] font-semibold mb-3">Where to Set Up</div>
          {spots.map((sp, i) => (
            <div key={i} className="bg-[#060b10] border border-[#1A3346] rounded-xl p-3 mb-2 last:mb-0">
              <div className={`inline-block text-[9px] px-2 py-0.5 rounded-full mb-2 font-semibold tracking-wide ${i === 0 ? 'bg-[rgba(186,232,255,0.12)] text-[#BAE8FF]' : i === 1 ? 'bg-[rgba(168,200,216,0.1)] text-[#A8C8D8]' : 'bg-[rgba(255,255,255,0.05)] text-[#4A6878]'}`}>
                {i === 0 ? 'Best Right Now' : i === 1 ? 'Also Try' : 'Backup'}
              </div>
              <div className="font-semibold text-sm text-[#C8E4F0] mb-1">{sp.name}</div>
              <div className="text-xs text-[#4A6878] leading-relaxed">{sp.detail}</div>
            </div>
          ))}
        </div>

        {/* Lures — lure colors take spotlight on dark background */}
        <div className="bg-[#0c1822] border border-[#1A3346] rounded-2xl p-4">
          <div className="text-[10px] uppercase tracking-[2px] text-[#4A6878] font-semibold mb-3">Best Lures For These Conditions</div>
          {lures.map((l, i) => (
            <div key={i} className={`rounded-xl p-3.5 mb-2 last:mb-0 border ${i === 0 ? 'border-[rgba(186,232,255,0.2)] bg-[rgba(186,232,255,0.03)]' : 'border-[#1A3346] bg-[#060b10]'}`}>
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-semibold text-sm text-[#C8E4F0]">{l.name}</span>
                  {l.isBold && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(168,200,216,0.1)] text-[#A8C8D8] font-semibold shrink-0">BOLD</span>}
                  <button onClick={() => toggleTacklebox('lures', l.name)} className={`shrink-0 transition-colors ${tacklebox.lures.includes(l.name) ? 'text-[#FC8181]' : 'text-[#4A6878] hover:text-[#BAE8FF]'}`}>
                    <Heart className="w-3.5 h-3.5" fill={tacklebox.lures.includes(l.name) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className={`text-[9px] px-2 py-0.5 rounded-full font-semibold shrink-0 ml-2 ${i === 0 ? 'bg-[rgba(186,232,255,0.15)] text-[#BAE8FF]' : 'bg-[rgba(168,200,216,0.08)] text-[#4A6878]'}`}>
                  {i === 0 ? 'BEST PICK' : 'GOOD'}
                </div>
              </div>
              <div className="text-xs text-[#4A6878] leading-relaxed mb-1.5">{l.reason}</div>
              {l.talkingPoint && <div className="text-xs text-[#7CCBE8] leading-relaxed mb-1.5 border-l-2 border-[#1A3346] pl-2.5">Why: {l.talkingPoint}</div>}
              {l.technique && <div className="text-xs text-[#A8C8D8] leading-relaxed border-l-2 border-[rgba(168,200,216,0.15)] pl-2.5">How: {l.technique}</div>}
            </div>
          ))}
        </div>

        {/* Colors — swatches pop against dark */}
        <div className="bg-[#0c1822] border border-[#1A3346] rounded-2xl p-4">
          <div className="text-[10px] uppercase tracking-[2px] text-[#4A6878] font-semibold mb-3">Best Colors Today</div>
          <div className="flex flex-wrap gap-2">
            {colors.colors.map((c, i) => (
              <div key={i} className="flex items-center gap-2 bg-[#060b10] border border-[#1A3346] rounded-xl px-3 py-2 text-xs">
                <div className="w-5 h-5 rounded-full flex-shrink-0 border border-[rgba(255,255,255,0.12)] shadow-lg" style={{ background: c.hex, boxShadow: `0 0 8px ${c.hex}40` }} />
                <span className="text-[#C8E4F0]">{c.name}</span>
                {c.tooltip && <Tooltip term={c.name} />}
                <button onClick={() => toggleTacklebox('colors', c.name)} className={`ml-0.5 transition-colors ${tacklebox.colors.includes(c.name) ? 'text-[#FC8181]' : 'text-[#4A6878] hover:text-[#BAE8FF]'}`}>
                  <Heart className="w-3 h-3" fill={tacklebox.colors.includes(c.name) ? 'currentColor' : 'none'} />
                </button>
              </div>
            ))}
          </div>
          <div className="text-xs text-[#4A6878] mt-2.5 leading-relaxed">{colors.reason}</div>
        </div>

        {/* Walmart */}
        <div className="bg-[#0c1822] border border-[#1A3346] rounded-2xl p-4">
          <div className="text-[10px] uppercase tracking-[2px] text-[#4A6878] font-semibold mb-3">What to Grab at Walmart</div>
          {walmart.map((w, i) => (
            <div key={i} className="bg-[#060b10] border border-[#1A3346] rounded-xl p-3 mb-2 last:mb-0">
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold text-sm text-[#C8E4F0]">{w.name}</div>
                <button onClick={() => toggleTacklebox('walmart', w.name)} className={`transition-colors ${tacklebox.walmart.includes(w.name) ? 'text-[#FC8181]' : 'text-[#4A6878] hover:text-[#BAE8FF]'}`}>
                  <Heart className="w-3.5 h-3.5" fill={tacklebox.walmart.includes(w.name) ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="text-xs text-[#7CCBE8] leading-relaxed">{w.detail}</div>
              <div className="text-[11px] text-[#A8C8D8] font-semibold mt-1">{w.price}</div>
            </div>
          ))}
          <div className="text-[11px] text-[#4A6878] mt-2">Findable in the fishing aisle at most STL-area Walmart stores.</div>
        </div>

        {/* Pro tip */}
        <div className="bg-[#0c1822] border border-[#1A3346] rounded-2xl px-4 py-3.5 text-[13px] text-[#A8C8D8] leading-relaxed">
          <strong className="text-[#C8E4F0]">Pro Tip:</strong> {proTip}
        </div>

        {/* Redo */}
        <button onClick={resetAll} className="w-full py-3 bg-transparent text-[#4A6878] text-sm border border-[#1A3346] rounded-2xl cursor-pointer hover:border-[rgba(186,232,255,0.2)] hover:text-[#A8C8D8] transition-all">
          Search a Different Lake
        </button>
      </div>
    );
  };

  // ── LAKE WORKSPACE ───────────────────────────────────────────────────
  const renderWorkspace = () => {
    const locName = state.locName || state.loc || 'Your Lake';
    const species = getLocSpecies();

    return (
      <div className="animate-fade-up">
        {/* Workspace header */}
        <div className="pt-6 pb-4">
          <button onClick={resetAll} className="flex items-center gap-1 text-[#4A6878] hover:text-[#7CCBE8] text-xs transition-colors bg-transparent border-none cursor-pointer mb-4">
            <ChevronLeft className="w-3.5 h-3.5" /> New Search
          </button>
          <div className="font-display text-[32px] tracking-[3px] text-[#BAE8FF] leading-none nova-glow">{locName}</div>
          {species.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {species.map((sp, i) => (
                <span key={i} className="text-[10px] px-2.5 py-1 rounded-full bg-[rgba(186,232,255,0.07)] border border-[#1A3346] text-[#7CCBE8] font-medium">{sp}</span>
              ))}
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="sticky top-0 z-30 bg-[#060b10] border-b border-[#1A3346] mb-4 -mx-4 px-4">
          <div className="flex">
            <button className={`workspace-tab ${activeTab === 'recommendations' ? 'active' : ''}`} onClick={() => setActiveTab('recommendations')}>
              <Fish className="w-[18px] h-[18px]" />
              Game Plan
            </button>
            <button className={`workspace-tab ${activeTab === 'learn' ? 'active' : ''}`} onClick={() => setActiveTab('learn')}>
              <BookOpen className="w-[18px] h-[18px]" />
              Learn
            </button>
            <button className={`workspace-tab ${activeTab === 'tacklebox' ? 'active' : ''}`} onClick={() => setActiveTab('tacklebox')}>
              <Heart className="w-[18px] h-[18px]" />
              Tacklebox
            </button>
          </div>
          {/* Active tab indicator line */}
          <div className="relative h-[2px] bg-[#1A3346]">
            <div
              className="absolute top-0 h-full bg-[#BAE8FF] transition-all duration-200 rounded-full"
              style={{
                width: '33.33%',
                left: activeTab === 'recommendations' ? '0%' : activeTab === 'learn' ? '33.33%' : '66.66%',
              }}
            />
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'recommendations' && renderRecommendations()}
        {activeTab === 'learn' && (
          <div className="-mx-4">
            <NovaCastReference onClose={() => setActiveTab('recommendations')} inline />
          </div>
        )}
        {activeTab === 'tacklebox' && (
          <div className="-mx-4">
            <NovaCastTacklebox onBack={() => setActiveTab('recommendations')} externalTacklebox={tacklebox} onToggleSaved={() => {}} />
          </div>
        )}
      </div>
    );
  };

  // ── ADMIN ──────────────────────────────────────────────────────────
  const renderAdmin = () => (
    <div className="fixed inset-0 bg-[#060b10] z-50 overflow-y-auto p-6 pb-20">
      <div className="max-w-[480px] mx-auto">
        <div className="font-display text-[28px] tracking-[2px] text-[#A8C8D8] mb-1">Admin</div>
        <div className="text-xs text-[#4A6878] mb-5">Hidden panel</div>
        {!adminAuthed ? (
          <div className="flex flex-col gap-2.5">
            <input type="password" value={adminPw} onChange={e => setAdminPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && adminLogin()} placeholder="Password" className="w-full bg-[#0c1822] border border-[#1A3346] rounded-lg text-[#C8E4F0] text-sm px-3 py-2.5 outline-none focus:border-[rgba(186,232,255,0.4)]" />
            {adminMsg && <div className={`text-sm text-center py-2 rounded-lg ${adminMsg.type === 'success' ? 'bg-[rgba(186,232,255,0.1)] text-[#BAE8FF]' : 'bg-[rgba(252,129,129,0.1)] text-[#FC8181]'}`}>{adminMsg.text}</div>}
            <button onClick={adminLogin} className="w-full py-3.5 bg-[#A8C8D8] text-[#060b10] font-display text-lg tracking-[2px] rounded-xl cursor-pointer border-none">UNLOCK</button>
            <button onClick={() => setShowAdmin(false)} className="w-full py-2.5 bg-transparent text-[#4A6878] text-sm border border-[#1A3346] rounded-xl cursor-pointer hover:border-[#4A6878] transition-all">Back</button>
          </div>
        ) : (
          <div>
            {adminMsg && <div className={`text-sm text-center py-2 rounded-lg mb-2.5 ${adminMsg.type === 'success' ? 'bg-[rgba(186,232,255,0.1)] text-[#BAE8FF]' : 'bg-[rgba(252,129,129,0.1)] text-[#FC8181]'}`}>{adminMsg.text}</div>}
            <div className="text-sm text-[#7CCBE8] mb-4">Admin lakes: {adminLakes.length}</div>
            {adminLakes.map(l => (
              <div key={l.id} className="bg-[#0c1822] border border-[#1A3346] rounded-xl p-3 mb-2 flex justify-between items-center">
                <div><div className="font-semibold text-sm text-[#C8E4F0]">{l.name}</div><div className="text-xs text-[#4A6878]">{l.location}</div></div>
                <button onClick={() => deleteAdminLake(l.id)} className="text-[#FC8181] bg-transparent border-none cursor-pointer"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={() => setShowAdmin(false)} className="w-full py-2.5 bg-transparent text-[#4A6878] text-sm border border-[#1A3346] rounded-xl cursor-pointer hover:border-[#4A6878] transition-all mt-4">Back</button>
          </div>
        )}
      </div>
    </div>
  );

  // ── MAIN RENDER ──────────────────────────────────────────────────────
  return (
    <div className="relative z-10 max-w-[480px] mx-auto px-4" onClick={() => setTooltipOpen(null)}>
      {view === 'discovery' && renderDiscovery()}

      {view === 'wizard' && (
        <NovaCastWizard
          onComplete={(wizardState) => {
            setState(wizardState);
            setView('workspace');
            setActiveTab('recommendations');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          waterBodies={waterBodies}
          customLakes={customLakes}
          adminLakes={adminLakes}
        />
      )}

      {view === 'workspace' && renderWorkspace()}

      {showAdmin && renderAdmin()}
    </div>
  );
}
