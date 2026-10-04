import { useState, useEffect, useCallback, useRef } from 'react';
import NovaCastWizard from './NovaCastWizard';
import NovaCastReference from './NovaCastReference';
import NovaCastTacklebox from './NovaCastTacklebox';
import NovaCastRecon from './NovaCastRecon';
import type { ReconSelection } from './NovaCastRecon';
import NovaCastCatchLog from './NovaCastCatchLog';
import ConditionsPanel from './ConditionsPanel';

import { fetchWaterBodies, fetchAdminLakes, fetchCustomLakes, deleteAdminLake as deleteAdminLakeRecord } from './services/database';
import type { WaterBodyRecord, AdminLakeRecord, CustomLakeRecord } from './services/database';
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
import { getFishingIntelligence, buildFishingContext } from './services/ai';
import type { FishingInsight, CtxObservations } from './services/ai';
import NovaCastOnTheBank from './NovaCastOnTheBank';
import NovaCastStarterKit from './NovaCastStarterKit';
import { getCatchLogStore } from './services/catchLog';
import type { CatchRecord } from './services/catchLog';
import { useAuth } from './hooks/useAuth';
import { getUserDataStore, migrateGuestDataToAccount, EMPTY_TACKLEBOX } from './services/userData';
import type { Tacklebox } from './services/userData';
import { getGearOffers } from './services/retail';
import type { GearItemResult } from './services/retail';
import { GEO_OPTS, geoErrorMessage, geoPreflightError } from './lib/geo';
import { buildLakeSnapshot } from './services/lakeSnapshot';
import type { LakeSnapshot } from './services/lakeSnapshot';
import NovaCastLakeSnapshot from './NovaCastLakeSnapshot';
import NovaCastLearnLink from './NovaCastLearnLink';
import type { LearnTarget } from './lib/learnLink';
import {
  Navigation, Settings, Trash2, Droplets, Thermometer,
  Wind, Heart, MapPin, BookOpen, X, Info, Fish, ChevronLeft,
  Clock, FileText, ShoppingCart, Sparkles, ExternalLink,
} from 'lucide-react';


type WaterBodyRow = WaterBodyRecord;
type CustomLakeRow = CustomLakeRecord;
type AdminLakeRow = AdminLakeRecord;

interface WizardState {
  loc: string | null; locName: string | null; locLat: number | null; locLon: number | null;
  time: string | null; sky: string | null; water: string | null; temp: string | null;
  wind: string | null; pressure: string | null; fish: string | null; reel: string | null;
  recentWeather: string[];
}

type AppView = 'discovery' | 'wizard' | 'workspace' | 'recon' | 'walmartrun' | 'catchlog' | 'onthebank';
type WorkspaceTab = 'recommendations' | 'learn' | 'tacklebox';

const MONTH = new Date().getMonth();
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const currentMonth = MONTH_NAMES[MONTH];

function getMonthBanner() {
  if (MONTH >= 3 && MONTH <= 4) return 'Spawn season is on. Bass and crappie are moving shallow — one of the best times to get out.';
  if (MONTH === 5) return 'Post-spawn bass are hungry and feeding again. Great topwater month.';
  if (MONTH >= 6 && MONTH <= 8) return 'Summer patterns: early morning and evening are your best windows. Fish deep during midday heat.';
  if (MONTH >= 9 && MONTH <= 10) return 'Fall feed is on. Bass and crappie are aggressively feeding before winter.';
  if (MONTH >= 11 || MONTH <= 1) return 'Slow and deep — winter fishing means slow presentations in the deepest water. Fish are lethargic but catchable.';
  return 'Good fishing conditions. Check conditions and pick your spot.';
}

export default function App() {
  const [view, setView] = useState<AppView>('discovery');
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('recommendations');
  const [state, setState] = useState<WizardState>({
    loc: null, locName: null, locLat: null, locLon: null, time: null, sky: null, reel: null,
    water: null, temp: null, wind: null, pressure: null, fish: null, recentWeather: [],
  });
  const [waterBodies, setWaterBodies] = useState<WaterBodyRow[]>([]);
  const [customLakes, setCustomLakes] = useState<CustomLakeRow[]>([]);
  const [adminLakes, setAdminLakes] = useState<AdminLakeRow[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminPw, setAdminPw] = useState('');
  const [adminMsg, setAdminMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [adminForm, setAdminForm] = useState({ name: '', location: '', region: '', type: '', species: '', spot1: '', spot2: '', spot3: '', regs: '', notes: '' });
  const [tacklebox, setTacklebox] = useState<Tacklebox>(() => {
    // Instant guest load from localStorage so there's no first-paint flash;
    // the store effect below reconciles with the account when signed in.
    try { const s = localStorage.getItem('novacast_tacklebox'); return s ? { ...EMPTY_TACKLEBOX, ...JSON.parse(s) } : EMPTY_TACKLEBOX; } catch { return EMPTY_TACKLEBOX; }
  });
  const tackleboxLoadedRef = useRef(false);
  const [tooltipOpen, setTooltipOpen] = useState<string | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherLoaded, setWeatherLoaded] = useState('');
  const [insight, setInsight] = useState<FishingInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<LakeSnapshot | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [catches, setCatches] = useState<CatchRecord[]>([]);
  const [observations, setObservations] = useState<CtxObservations>({});
  const [catchLogOrigin, setCatchLogOrigin] = useState<AppView>('discovery');
  const [gearResults, setGearResults] = useState<GearItemResult[]>([]);
  const [gearLoading, setGearLoading] = useState(false);
  const [gearChecked, setGearChecked] = useState<Set<string>>(new Set());
  const [shopMode, setShopMode] = useState<'list' | 'starter'>('list');
  const [learnTarget, setLearnTarget] = useState<LearnTarget | null>(null);
  const auth = useAuth();
  const userDataStore = getUserDataStore(auth.user?.uid);
  const catchStore = getCatchLogStore(auth.user?.uid);

  const openCatchLog = useCallback(() => {
    setCatchLogOrigin(view === 'catchlog' ? catchLogOrigin : view);
    setView('catchlog');
  }, [view, catchLogOrigin]);

  // Contextual learning (blueprint: recommendation -> "Learn this technique"
  // without losing fishing context). Learning lives inside the workspace tab
  // bar, so this switches there; the angler's water/conditions stay in `state`
  // untouched and Game Plan is one tap back via the tab bar.
  const openLearn = useCallback((target: LearnTarget) => {
    setLearnTarget(target);
    setView('workspace');
    setActiveTab('learn');
  }, []);

  const loadCatches = useCallback(() => {
    catchStore.list().then(setCatches).catch(() => setCatches([]));
  }, [catchStore]);

  useEffect(() => {
    loadWaterBodies(); loadCustomLakes(); loadAdminLakes();
    if (window.location.hash === '#admin') setShowAdmin(true);
    const handler = () => { if (window.location.hash === '#admin') setShowAdmin(true); };
    window.addEventListener('hashchange', handler);
    if (window.location.hash === '#workspace') {
      setState(prev => ({ ...prev, locName: 'Meramec River', fish: 'bass', time: 'morning', sky: 'partly', water: 'stained', temp: 'warm' }));
      setView('workspace');
    }
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  // Load the Tacklebox + catches from whichever store matches the auth state.
  // On first sign-in, migrate the guest's device data into the account first.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const uid = auth.user?.uid;
      if (uid) {
        try { await migrateGuestDataToAccount(uid); } catch { /* keep going with guest data */ }
      }
      const store = getUserDataStore(uid);
      const tb = await store.getTacklebox();
      if (!cancelled) { setTacklebox(tb); tackleboxLoadedRef.current = true; }
      loadCatches();
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user?.uid]);

  // Persist Tacklebox changes to the active store (skip the initial hydrate).
  useEffect(() => {
    if (!tackleboxLoadedRef.current) { tackleboxLoadedRef.current = true; return; }
    void userDataStore.setTacklebox(tacklebox);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tacklebox]);

  const toggleTacklebox = (category: 'lures' | 'colors' | 'walmart', item: string) => {
    setTacklebox(prev => {
      const list = prev[category];
      return { ...prev, [category]: list.includes(item) ? list.filter(i => i !== item) : [...list, item] };
    });
  };

  const loadWaterBodies = async () => { const data = await fetchWaterBodies(); setWaterBodies(data); };
  const loadCustomLakes = async () => { const data = await fetchCustomLakes(); setCustomLakes(data); };
  const loadAdminLakes = async () => { const data = await fetchAdminLakes(); setAdminLakes(data); };

  // Keep the catch cache fresh for the fishing-intelligence layer: reload
  // whenever we're not sitting in the Catch Log itself (i.e. after add/edit).
  useEffect(() => { if (view !== 'catchlog') loadCatches(); }, [view, loadCatches]);

  const resetAll = () => {
    setState({ loc: null, locName: null, locLat: null, locLon: null, time: null, sky: null, water: null, temp: null, wind: null, pressure: null, fish: null, reel: null, recentWeather: [] });
    setView('discovery');
    setActiveTab('recommendations');
    setWeatherLoaded('');
    setInsight(null);
    setSnapshot(null);
    setObservations({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setCondition = useCallback((key: string, value: string | null) => {
    setState(prev => ({ ...prev, [key]: value } as WizardState));
  }, []);

  const loadWeather = useCallback(() => {
    const pre = geoPreflightError();
    if (pre) { setWeatherLoaded(pre); return; }
    setWeatherLoading(true); setWeatherLoaded('');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
        if (!apiKey) throw new Error('Weather API key not configured');
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${apiKey}&units=imperial`);
        const data = await res.json();
        if (data.cod !== 200) throw new Error(data.message);
        const tempF = Math.round(data.main.temp), windMph = Math.round(data.wind.speed);
        const cloudPct = data.clouds.all, wId = data.weather[0].id, pressureHpa = data.main.pressure;
        let sky: string, temp: string, wind: string, pressure: string;
        if (wId >= 200 && wId < 600) sky = 'rainy';
        else if (cloudPct >= 80) sky = 'overcast';
        else if (cloudPct >= 30) sky = 'partly';
        else sky = 'sunny';
        temp = tempF < 45 ? 'cold' : tempF < 60 ? 'cool' : 'warm';
        wind = windMph <= 5 ? 'calm' : windMph <= 14 ? 'light' : 'strong';
        pressure = pressureHpa < 1009 ? 'steady_low' : pressureHpa < 1013 ? 'falling' : 'steady_high';
        setState(s => ({ ...s, sky, temp, wind, pressure }));
        const skyL: Record<string,string> = { sunny: 'Sunny', partly: 'Partly Cloudy', overcast: 'Overcast', rainy: 'Rainy' };
        const windL: Record<string,string> = { calm: 'Calm', light: 'Light Breeze', strong: 'Windy' };
        setWeatherLoaded(`${data.name} — ${tempF}°F · ${skyL[sky]} · ${windL[wind]}`);
      } catch { setWeatherLoaded("Couldn't load weather. Fill in manually."); }
      setWeatherLoading(false);
    }, (err) => { setWeatherLoaded(geoErrorMessage(err)); setWeatherLoading(false); }, GEO_OPTS);
  }, []);

  // Zero-friction "On the Bank" mode: no manual conditions form.
  // Auto-detects time of day, snaps to nearest saved water body if within 5mi,
  // auto-pulls weather, and drops straight into recommendations.
  const startOnTheBank = useCallback(() => {
    const hour = new Date().getHours();
    const time = hour < 11 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    setState(prev => ({ ...prev, time, locName: prev.locName || 'Your Current Spot' }));
    setObservations({});
    setView('onthebank');
    setActiveTab('recommendations');

    if (geoPreflightError()) { loadWeather(); return; }

    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      const toRad = (d: number) => d * Math.PI / 180;
      const calcDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 3959; const dLat = toRad(lat2 - lat1); const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };
      const nearest = waterBodies
        .filter(w => w.latitude && w.longitude)
        .map(w => ({ w, dist: calcDist(latitude, longitude, w.latitude as number, w.longitude as number) }))
        .sort((a, b) => a.dist - b.dist)[0];

      setState(prev => ({
        ...prev,
        locLat: latitude,
        locLon: longitude,
        loc: nearest && nearest.dist < 5 ? nearest.w.key : null,
        locName: nearest && nearest.dist < 5 ? nearest.w.name : 'Your Current Spot',
      }));
      loadWeather();
    }, () => { loadWeather(); }, GEO_OPTS);
  }, [waterBodies, loadWeather]);

  // Recon → "Fish Here": carry the chosen waterbody into the workspace so the
  // rest of NovaCast (lake info, conditions, Game Plan) works off that water.
  const selectReconWater = useCallback((sel: ReconSelection) => {
    setState(prev => ({
      ...prev,
      loc: sel.curatedKey,
      locName: sel.name,
      locLat: sel.lat,
      locLon: sel.lon,
    }));
    setWeatherLoaded('');
    setInsight(null);
    setSnapshot(null);
    setView('workspace');
    setActiveTab('recommendations');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const adminLogin = () => { if (adminPw === 'castmaster2025') { setAdminAuthed(true); setAdminMsg(null); } else { setAdminPw(''); setAdminMsg({ text: 'Wrong password', type: 'error' }); } };
  const deleteAdminLake = async (id: string) => { await deleteAdminLakeRecord(id); loadAdminLakes(); };

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
  const getLocType = (): string | null => {
    const dbBody = waterBodies.find(w => w.key === state.loc);
    if (dbBody?.type) return dbBody.type;
    const adminBody = adminLakes.find(l => l.id === state.loc);
    return adminBody?.type ?? null;
  };

  // ── LAKE SNAPSHOT (environmental model) ─────────────────────────────
  // Built when a waterbody is in play. Represents measured/computed conditions
  // for that water (weather from OpenWeather when a key + coords exist, astro +
  // season computed locally). User-entered condition pills are merged in at the
  // fishing-intelligence layer, not here — this stays cache-friendly and keyed
  // to the water, not every pill toggle.
  useEffect(() => {
    const wantsSnapshot = view === 'workspace' || view === 'onthebank';
    if (!wantsSnapshot || (!state.locName && !state.loc)) { setSnapshot(null); return; }
    let cancelled = false;
    setSnapshotLoading(true);
    const dbBody = waterBodies.find(w => w.key === state.loc);
    const coords = getLocCoords();
    buildLakeSnapshot({
      water: {
        name: state.locName,
        type: getLocType(),
        areaAcres: null,
        curatedKey: dbBody ? dbBody.key : null,
        lat: coords.lat,
        lon: coords.lon,
        species: getLocSpecies(),
        specialRegs: getLocSpecialRegs(),
        source: dbBody ? 'curated' : 'manual',
      },
      weatherApiKey: import.meta.env.VITE_OPENWEATHER_API_KEY,
    })
      .then(res => { if (!cancelled) setSnapshot(res); })
      .catch(() => { if (!cancelled) setSnapshot(null); })
      .finally(() => { if (!cancelled) setSnapshotLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, state.loc, state.locName, state.locLat, state.locLon, waterBodies]);

  // ── NOVACAST READ (fishing-intelligence layer) ──────────────────────
  // Recomputed whenever the water, snapshot or conditions change. Provider
  // selection (local rules engine vs. optional hosted model) lives in
  // services/ai; the wide context is assembled by buildFishingContext.
  useEffect(() => {
    const wantsInsight = (view === 'workspace' && activeTab === 'recommendations') || view === 'onthebank';
    if (!wantsInsight) return;
    let cancelled = false;
    setInsightLoading(true);
    const ctx = buildFishingContext({
      snapshot,
      conditions: {
        fish: state.fish, time: state.time, sky: state.sky, water: state.water,
        temp: state.temp, wind: state.wind, pressure: state.pressure,
        recentWeather: state.recentWeather,
      },
      observations,
      tackle: tacklebox.lures,
      catches,
    });
    getFishingIntelligence(ctx)
      .then(res => { if (!cancelled) setInsight(res); })
      .catch(() => { if (!cancelled) setInsight(null); })
      .finally(() => { if (!cancelled) setInsightLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    view, activeTab, snapshot, state.loc, state.fish, state.time, state.sky,
    state.water, state.temp, state.wind, state.pressure, state.recentWeather,
    tacklebox.lures, catches, observations,
  ]);

  // ── WALMART RUN — real shopping list from tacklebox + seasonal picks ──
  const gearFromBox = [...tacklebox.walmart, ...tacklebox.lures];
  const gearShoppingTerms: string[] = gearFromBox.length > 0
    ? Array.from(new Set(gearFromBox))
    : getWalmart(state.fish || 'anything', state.water || 'stained', state.time || 'morning').map(w => w.name);

  useEffect(() => {
    if (view !== 'walmartrun') return;
    let cancelled = false;
    setGearLoading(true);
    getGearOffers(gearShoppingTerms.map(term => ({ term, category: 'lure' })))
      .then(res => { if (!cancelled) setGearResults(res); })
      .catch(() => { if (!cancelled) setGearResults([]); })
      .finally(() => { if (!cancelled) setGearLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, tacklebox.walmart, tacklebox.lures, state.fish, state.water, state.time]);

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

  // ── HOME DASHBOARD (6-tile grid) ──────────────────────────────────────
  const renderDiscovery = () => (
    <div className="animate-fade-up pb-6">
      <div className="pt-12 pb-8 text-center">
        <div className="text-[#7CCBE8] text-2xl mb-3 tracking-widest select-none">✦</div>
        <div className="font-display text-[52px] tracking-[5px] text-[#BAE8FF] leading-none nova-glow">Novacast</div>
        <div className="text-[11px] text-[#A8C8D8] tracking-[4px] uppercase mt-3 mb-1">Your Fishing Mentor</div>
        <div className="text-[11px] text-[#4A6878] tracking-[1px]">{currentMonth}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setView('recon')} className="text-left bg-[#0c1822] border border-[#1A3346] rounded-2xl p-5 cursor-pointer hover:border-[rgba(186,232,255,0.3)] transition-all">
          <MapPin className="w-6 h-6 text-[#7CCBE8] mb-6" />
          <div className="font-display text-lg tracking-wide text-[#C8E4F0] mb-1">Recon</div>
          <div className="text-xs text-[#4A6878] leading-relaxed">Live map. Find water near you, right now.</div>
        </button>

        <button onClick={() => setView('wizard')} className="text-left bg-[#0c1822] border border-[rgba(230,180,90,0.25)] rounded-2xl p-5 cursor-pointer hover:border-[rgba(230,180,90,0.5)] transition-all">
          <FileText className="w-6 h-6 text-[#E6B45A] mb-6" />
          <div className="font-display text-lg tracking-wide text-[#C8E4F0] mb-1">Game Plan</div>
          <div className="text-xs text-[#4A6878] leading-relaxed">Tell us conditions, get the bait first.</div>
        </button>

        <button onClick={startOnTheBank} className="text-left bg-[#0c1822] border border-[#1A3346] rounded-2xl p-5 cursor-pointer hover:border-[rgba(186,232,255,0.3)] transition-all">
          <Clock className="w-6 h-6 text-[#7CCBE8] mb-6" />
          <div className="font-display text-lg tracking-wide text-[#C8E4F0] mb-1">On the Bank</div>
          <div className="text-xs text-[#4A6878] leading-relaxed">Here now. What do I throw?</div>
        </button>

        <button onClick={() => { setView('workspace'); setActiveTab('tacklebox'); }} className="text-left bg-[#0c1822] border border-[#1A3346] rounded-2xl p-5 cursor-pointer hover:border-[rgba(186,232,255,0.3)] transition-all">
          <Heart className="w-6 h-6 text-[#7CCBE8] mb-6" />
          <div className="font-display text-lg tracking-wide text-[#C8E4F0] mb-1">Tacklebox</div>
          <div className="text-xs text-[#4A6878] leading-relaxed">Everything you've saved. Lures, spots, catches.</div>
        </button>

        <button onClick={() => { setView('workspace'); setActiveTab('learn'); }} className="text-left bg-[#0c1822] border border-[#1A3346] rounded-2xl p-5 cursor-pointer hover:border-[rgba(186,232,255,0.3)] transition-all">
          <BookOpen className="w-6 h-6 text-[#7CCBE8] mb-6" />
          <div className="font-display text-lg tracking-wide text-[#C8E4F0] mb-1">Learn &amp; Fun</div>
          <div className="text-xs text-[#4A6878] leading-relaxed">Knots, rigs, colors — and a lure library.</div>
        </button>

        <button onClick={() => setView('walmartrun')} className="text-left bg-[#0c1822] border border-[#1A3346] rounded-2xl p-5 cursor-pointer hover:border-[rgba(186,232,255,0.3)] transition-all">
          <ShoppingCart className="w-6 h-6 text-[#7CCBE8] mb-6" />
          <div className="font-display text-lg tracking-wide text-[#C8E4F0] mb-1">Shopping</div>
          <div className="text-xs text-[#4A6878] leading-relaxed">Your list or a beginner kit — Walmart, Amazon, Bass Pro & more.</div>
        </button>
      </div>

      {/* Optional account — never required (blueprint §14–15). */}
      <div className="mt-8 text-center">
        {!auth.available ? (
          <div className="text-[10px] text-[#1A3346]">Cross-device sync coming soon — everything works offline on this device.</div>
        ) : auth.user ? (
          <div className="text-[10px] text-[#4A6878]">
            Synced as {auth.user.email || auth.user.displayName || 'your account'} ·{' '}
            <button onClick={auth.signOut} disabled={auth.busy} className="underline hover:text-[#7CCBE8] disabled:opacity-50">Sign out</button>
          </div>
        ) : (
          <button onClick={auth.signIn} disabled={auth.busy} className="text-[10px] text-[#4A6878] underline hover:text-[#7CCBE8] disabled:opacity-50">
            {auth.busy ? 'Signing in…' : 'Sign in to sync your tacklebox & catches'}
          </button>
        )}
        {auth.error && <div className="text-[10px] text-[#FC8181] mt-1">{auth.error}</div>}
      </div>

      <div className="mt-6 text-[10px] text-[#1A3346] text-center">Powered by orionae.dev</div>
    </div>
  );

  // ── WALMART RUN (real shopping list) ────────────────────────────────
  const renderWalmartRun = () => {
    const toggleChecked = (term: string) => setGearChecked(prev => {
      const next = new Set(prev);
      next.has(term) ? next.delete(term) : next.add(term);
      return next;
    });
    const usingSeasonal = gearFromBox.length === 0;

    const COST_LABEL = { low: '$', mid: '$$', high: '$$$' } as const;

    return (
      <div className="animate-fade-up pt-8 pb-10">
        <button onClick={() => setView('discovery')} className="flex items-center gap-1 text-[#4A6878] hover:text-[#7CCBE8] text-xs transition-colors bg-transparent border-none cursor-pointer mb-6">
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="font-display text-[32px] tracking-[3px] text-[#BAE8FF] leading-none nova-glow mb-1">Shopping</div>
        <div className="text-xs text-[#4A6878] mb-5">
          A convenience to find what NovaCast recommends — Walmart, Amazon, Bass Pro, Academy, Dick's. Not a Walmart-only feature.
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-5 bg-[#0c1822] border border-[#1A3346] rounded-2xl p-1.5">
          <button
            onClick={() => setShopMode('list')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${shopMode === 'list' ? 'bg-[rgba(186,232,255,0.12)] text-[#BAE8FF]' : 'text-[#4A6878]'}`}
          >
            From my Tacklebox
          </button>
          <button
            onClick={() => setShopMode('starter')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${shopMode === 'starter' ? 'bg-[rgba(186,232,255,0.12)] text-[#BAE8FF]' : 'text-[#4A6878]'}`}
          >
            Beginner Starter Kit
          </button>
        </div>

        {shopMode === 'starter' ? (
          <NovaCastStarterKit onLearnTopic={openLearn} />
        ) : (
          <>
            <div className="text-xs text-[#4A6878] mb-3">
              {usingSeasonal
                ? 'Seasonal starter list — heart lures and Walmart picks in Game Plan to build your own.'
                : `${gearShoppingTerms.length} item${gearShoppingTerms.length === 1 ? '' : 's'} from your Tacklebox.`}
            </div>

            {gearLoading ? (
              <div className="text-sm text-[#4A6878] py-10 text-center">Building your list…</div>
            ) : (
              <div className="space-y-2">
                {gearResults.map((item, i) => {
                  const checked = gearChecked.has(item.query.term);
                  return (
                    <div key={i} className={`bg-[#0c1822] border rounded-2xl p-4 transition-all ${checked ? 'border-[rgba(124,203,232,0.4)] opacity-60' : 'border-[#1A3346]'}`}>
                      <button onClick={() => toggleChecked(item.query.term)} className="flex items-start gap-2.5 w-full text-left">
                        <span className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-[#7CCBE8] border-[#7CCBE8]' : 'border-[#4A6878]'}`}>
                          {checked && <span className="text-[#060b10] text-[10px] font-bold">✓</span>}
                        </span>
                        <span className={`text-sm font-semibold flex items-center gap-1.5 ${checked ? 'text-[#4A6878] line-through' : 'text-[#C8E4F0]'}`}>
                          {item.query.term}
                          {item.relativeCost && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(186,232,255,0.1)] text-[#BAE8FF] font-semibold no-underline">
                              {COST_LABEL[item.relativeCost]}
                            </span>
                          )}
                        </span>
                      </button>
                      <div className="flex flex-wrap gap-1.5 mt-2.5 pl-6">
                        {item.offers.map((offer, j) => (
                          <a key={j} href={offer.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-[#060b10] border border-[#1A3346] text-[#7CCBE8] hover:border-[rgba(186,232,255,0.3)] transition-all no-underline">
                            {offer.retailer}
                            {offer.offerType === 'verified-product' && offer.price ? (
                              <span className="text-[#BAE8FF] font-semibold">{offer.price}{offer.priceIsEstimate ? '*' : ''}</span>
                            ) : (
                              <span className="text-[#4A6878]">search</span>
                            )}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                      {item.note && <div className="text-[10px] text-[#4A6878] mt-2 pl-6">{item.note}</div>}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="text-[10px] text-[#1A3346] text-center mt-8">
              "search" opens a store's results page. A price only ever comes from a real retailer API — NovaCast never shows a made-up number.
            </div>
          </>
        )}
      </div>
    );
  };

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

        {/* Lake Snapshot — coherent environmental model for the selected water */}
        {snapshot && <NovaCastLakeSnapshot snapshot={snapshot} loading={snapshotLoading} />}

        {/* NovaCast Read — the fishing-intelligence layer's synthesized take */}
        {(insight || insightLoading) && (
          <div className="bg-[rgba(186,232,255,0.04)] border border-[rgba(186,232,255,0.18)] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#BAE8FF]" />
              <span className="text-[10px] uppercase tracking-[2px] text-[#7CCBE8] font-semibold">NovaCast Read</span>
              {insight && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(186,232,255,0.1)] text-[#4A6878] ml-auto">
                  {insight.provider} · {insight.confidence} confidence
                </span>
              )}
            </div>
            {insightLoading && !insight ? (
              <div className="text-[13px] text-[#4A6878]">Reading the water…</div>
            ) : insight ? (
              <>
                <div className="text-[13px] leading-relaxed text-[#C8E4F0] mb-3">{insight.summary}</div>
                <div className="text-[11px] text-[#7CCBE8] leading-relaxed mb-2 border-l-2 border-[#1A3346] pl-2.5">{insight.depthStrategy}</div>
                {insight.techniques.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {insight.techniques.map((t, i) => (
                      <div key={i} className="text-[12px] text-[#A8C8D8] leading-relaxed">
                        <span className="text-[#C8E4F0] font-semibold">{i + 1}. {t.lure}</span>
                        {t.owned && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(124,203,232,0.15)] text-[#7CCBE8] ml-1.5">IN YOUR BOX</span>}
                        <NovaCastLearnLink topic={t.lure} onLearn={openLearn} className="ml-1.5" />
                        {' — '}{t.presentation}
                      </div>
                    ))}
                  </div>
                )}
                {insight.adjustments.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-[2px] text-[#4A6878] font-semibold mb-1.5">If it's not working</div>
                    {insight.adjustments.map((a, i) => (
                      <div key={i} className="text-[12px] text-[#A8C8D8] leading-relaxed mb-1 last:mb-0">• {a}</div>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

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
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-[2px] text-[#4A6878] font-semibold">Barometric Pressure</div>
              <NovaCastLearnLink topic="barometric pressure" onLearn={openLearn} />
            </div>
            {snapshot?.weather.pressureInHg.available && (
              <div className="text-xs text-[#4A6878] mb-1.5">
                <span className="text-[#C8E4F0] font-semibold">{snapshot.weather.pressureInHg.value} inHg</span> measured · interpreted level below
              </div>
            )}
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
                <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                  <span className="font-semibold text-sm text-[#C8E4F0]">{l.name}</span>
                  {l.isBold && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(168,200,216,0.1)] text-[#A8C8D8] font-semibold shrink-0">BOLD</span>}
                  {tacklebox.lures.includes(l.name) && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[rgba(124,203,232,0.15)] text-[#7CCBE8] font-semibold shrink-0">IN YOUR TACKLEBOX</span>
                  )}
                  <NovaCastLearnLink topic={l.name} onLearn={openLearn} />
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
          <div className="text-[11px] text-[#4A6878] mt-2">Findable in the fishing aisle at most Walmart stores.</div>
        </div>

        {/* Pro tip */}
        <div className="bg-[#0c1822] border border-[#1A3346] rounded-2xl px-4 py-3.5 text-[13px] text-[#A8C8D8] leading-relaxed">
          <strong className="text-[#C8E4F0]">Pro Tip:</strong> {proTip}
        </div>

        {/* Log a catch — optional, pre-filled from this water + conditions */}
        <button onClick={openCatchLog} className="w-full py-3 bg-transparent text-[#7CCBE8] text-sm border border-[#1A3346] rounded-2xl cursor-pointer hover:border-[rgba(186,232,255,0.3)] transition-all flex items-center justify-center gap-2">
          <Fish className="w-3.5 h-3.5" /> Caught one? Log it
        </button>

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
        {activeTab === 'recommendations' && (
          <div>
            <ConditionsPanel
              fish={state.fish}
              reel={state.reel}
              time={state.time}
              sky={state.sky}
              water={state.water}
              temp={state.temp}
              wind={state.wind}
              pressure={state.pressure}
              onChange={setCondition}
              onAutoFillWeather={loadWeather}
              weatherLoading={weatherLoading}
              weatherLoaded={weatherLoaded}
            />
            <div className="pt-4">
              {renderRecommendations()}
            </div>
          </div>
        )}
        {activeTab === 'learn' && (
          <div className="-mx-4">
            <NovaCastReference
              onClose={() => setActiveTab('recommendations')}
              inline
              initialTab={learnTarget?.tab}
              focusEntryId={learnTarget?.entryId ?? null}
            />
          </div>
        )}
        {activeTab === 'tacklebox' && (
          <div className="-mx-4">
            <NovaCastTacklebox
              onBack={() => setActiveTab('recommendations')}
              externalTacklebox={tacklebox}
              onToggleSaved={toggleTacklebox}
              onOpenCatchLog={openCatchLog}
              onLearnTopic={openLearn}
              recommendedLures={insight ? insight.techniques.map(t => t.lure) : []}
            />
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

      {view === 'recon' && (
        <NovaCastRecon onBack={() => setView('discovery')} waterBodies={waterBodies} onSelectWater={selectReconWater} />
      )}

      {view === 'walmartrun' && renderWalmartRun()}

      {view === 'wizard' && (
        <NovaCastWizard
          onComplete={(wizardState: WizardState) => {
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

      {view === 'onthebank' && (
        <NovaCastOnTheBank
          waterName={state.locName}
          snapshot={snapshot}
          insight={insight}
          insightLoading={insightLoading}
          observations={observations}
          onObservationsChange={setObservations}
          onOpenFullPlan={() => { setView('workspace'); setActiveTab('recommendations'); }}
          onLogCatch={openCatchLog}
          onLearnTopic={openLearn}
          onBack={resetAll}
        />
      )}

      {view === 'catchlog' && (
        <NovaCastCatchLog
          onBack={() => setView(catchLogOrigin === 'catchlog' ? 'discovery' : catchLogOrigin)}
          store={catchStore}
          savedLures={tacklebox.lures}
          onLearnTopic={openLearn}
          prefill={{
            waterName: state.locName,
            waterKey: state.loc,
            lat: getLocCoords().lat,
            lon: getLocCoords().lon,
            species: state.fish,
            conditions: {
              time: state.time, sky: state.sky, water: state.water, temp: state.temp,
              wind: state.wind, pressure: state.pressure,
              pressureInHg: snapshot?.weather.pressureInHg.value ?? null,
              weatherText: weatherLoaded || null,
            },
          }}
        />
      )}

      {showAdmin && renderAdmin()}
    </div>
  );
}
