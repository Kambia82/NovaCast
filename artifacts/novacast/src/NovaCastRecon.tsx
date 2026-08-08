import { useEffect, useRef, useState, useCallback } from 'react';
import { Navigation, MapPin, ChevronLeft, Search, Info, X } from 'lucide-react';

interface CuratedWaterBody {
  key: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  species: string[];
  special_regs: string | null;
}
interface OsmWaterBody { name: string; lat: number; lon: number; type: string; distance: number; }

interface Props {
  onBack: () => void;
  waterBodies: CuratedWaterBody[];
}

type ReconState = 'gate' | 'locating' | 'map' | 'manual';

const toRad = (d: number) => (d * Math.PI) / 180;
const calcDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 3959;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

async function fetchNearbyWater(lat: number, lon: number): Promise<OsmWaterBody[]> {
  const query = `[out:json][timeout:25];(way["natural"="water"](around:24000,${lat},${lon});way["waterway"="riverbank"](around:24000,${lat},${lon});way["water"~"lake|pond|reservoir"](around:24000,${lat},${lon});relation["natural"="water"](around:24000,${lat},${lon}););out body;>;out skel qt;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: `data=${encodeURIComponent(query)}` });
  const data = await res.json();
  const nodes: Record<number, { lat: number; lon: number }> = {};
  data.elements.forEach((el: any) => { if (el.type === 'node' && el.lat && el.lon) nodes[el.id] = { lat: el.lat, lon: el.lon }; });
  const list: OsmWaterBody[] = [];
  data.elements.forEach((el: any) => {
    if (el.type === 'way' && el.tags && el.nodes && el.nodes.length > 0) {
      const name = el.tags.name || el.tags['name:en'] || 'Unnamed Water';
      const waterType = el.tags.water || el.tags.natural || el.tags.waterway || 'water';
      const first = nodes[el.nodes[0]];
      if (first) list.push({ name, lat: first.lat, lon: first.lon, type: waterType, distance: calcDist(lat, lon, first.lat, first.lon) });
    }
  });
  return list.sort((a, b) => a.distance - b.distance).slice(0, 25);
}

export default function NovaCastRecon({ onBack, waterBodies }: Props) {
  const [reconState, setReconState] = useState<ReconState>('gate');
  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null);
  const [nearby, setNearby] = useState<OsmWaterBody[]>([]);
  const [error, setError] = useState('');
  const [manualQuery, setManualQuery] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [selected, setSelected] = useState<OsmWaterBody | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const findCurated = (lat: number, lon: number) =>
    waterBodies.find(w => w.latitude && w.longitude && calcDist(lat, lon, w.latitude, w.longitude) < 0.6);

  const enableLocation = useCallback(() => {
    if (!navigator.geolocation) { setError('This device has no location support. Search manually instead.'); setReconState('manual'); return; }
    setReconState('locating'); setError('');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude, lon = pos.coords.longitude;
      setUserPos({ lat, lon });
      try {
        const results = await fetchNearbyWater(lat, lon);
        setNearby(results);
        setReconState('map');
      } catch {
        setError("Couldn't reach map data. Try again.");
        setReconState('gate');
      }
    }, () => {
      setError('Location was denied. You can search a place manually instead.');
      setReconState('manual');
    });
  }, []);

  const searchManual = useCallback(async () => {
    if (!manualQuery.trim()) return;
    setManualLoading(true); setError('');
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualQuery)}&limit=1`);
      const geoData = await geoRes.json();
      if (!geoData.length) { setError("Couldn't find that place."); setManualLoading(false); return; }
      const lat = parseFloat(geoData[0].lat), lon = parseFloat(geoData[0].lon);
      setUserPos({ lat, lon });
      const results = await fetchNearbyWater(lat, lon);
      setNearby(results);
      setReconState('map');
    } catch { setError('Search failed. Try again.'); }
    setManualLoading(false);
  }, [manualQuery]);

  // Init / update Leaflet map whenever we land in 'map' state
  useEffect(() => {
    if (reconState !== 'map' || !userPos || !mapRef.current) return;
    let cancelled = false;

    (async () => {
      await import('leaflet/dist/leaflet.css');
      const L = (await import('leaflet')).default;
      if (cancelled || !mapRef.current) return;

      if (!mapInstance.current) {
        mapInstance.current = L.map(mapRef.current).setView([userPos.lat, userPos.lon], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(mapInstance.current);
      } else {
        mapInstance.current.setView([userPos.lat, userPos.lon], 12);
      }

      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      const userIcon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#BAE8FF;border:2px solid #060b10;box-shadow:0 0 8px #BAE8FF;"></div>`,
        iconSize: [14, 14],
      });
      L.marker([userPos.lat, userPos.lon], { icon: userIcon }).addTo(mapInstance.current);

      nearby.forEach(w => {
        const curated = findCurated(w.lat, w.lon);
        const color = curated ? '#7CCBE8' : '#4A6878';
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid #060b10;"></div>`,
          iconSize: [12, 12],
        });
        const marker = L.marker([w.lat, w.lon], { icon }).addTo(mapInstance.current);
        marker.on('click', () => setSelected(w));
        markersRef.current.push(marker);
      });
    })();

    return () => { cancelled = true; };
  }, [reconState, userPos, nearby]);

  useEffect(() => {
    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, []);

  const backButton = (
    <button onClick={onBack} className="flex items-center gap-1 text-[#4A6878] hover:text-[#7CCBE8] text-xs transition-colors bg-transparent border-none cursor-pointer mb-4">
      <ChevronLeft className="w-3.5 h-3.5" /> Back
    </button>
  );

  if (reconState === 'gate') {
    return (
      <div className="animate-fade-up pt-8 pb-6">
        {backButton}
        <div className="text-center pt-6">
          <MapPin className="w-8 h-8 text-[#7CCBE8] mx-auto mb-4" />
          <div className="font-display text-2xl tracking-wide text-[#BAE8FF] mb-3">Find Water Near You</div>
          <div className="text-sm text-[#A8C8D8] leading-relaxed max-w-[300px] mx-auto mb-6">
            Recon uses your device location to pull real water bodies around you right now — lakes, ponds, and rivers, with distance from where you're standing.
          </div>
          {error && <div className="text-[#FC8181] text-xs mb-4">{error}</div>}
          <button onClick={enableLocation} className="w-full py-4 bg-[rgba(186,232,255,0.06)] border border-[#1A3346] rounded-2xl text-[#BAE8FF] text-sm font-semibold cursor-pointer mb-3 flex items-center justify-center gap-2.5 hover:bg-[rgba(186,232,255,0.1)] hover:border-[rgba(186,232,255,0.3)] transition-all">
            <Navigation className="w-4 h-4" /> Enable Location
          </button>
          <button onClick={() => setReconState('manual')} className="w-full py-3.5 bg-transparent border border-[#1A3346] rounded-2xl text-[#4A6878] text-sm cursor-pointer hover:border-[rgba(186,232,255,0.2)] hover:text-[#A8C8D8] transition-all">
            Search a Place Instead
          </button>
        </div>
      </div>
    );
  }

  if (reconState === 'locating') {
    return (
      <div className="animate-fade-up pt-20 text-center">
        {backButton}
        <div className="text-sm text-[#A8C8D8]">Finding water near you...</div>
      </div>
    );
  }

  if (reconState === 'manual') {
    return (
      <div className="animate-fade-up pt-8 pb-6">
        {backButton}
        <div className="text-[10px] uppercase tracking-[3px] text-[#4A6878] mb-4 font-semibold">Search a City, Address, or Zip</div>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={manualQuery}
            onChange={e => setManualQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchManual()}
            placeholder="e.g. city, address, or zip code"
            className="flex-1 bg-[#0c1822] border border-[#1A3346] rounded-xl text-[#C8E4F0] text-sm px-4 py-3.5 outline-none focus:border-[rgba(186,232,255,0.4)] placeholder-[#4A6878] transition-colors"
          />
          <button onClick={searchManual} disabled={manualLoading} className="px-5 py-3.5 bg-[#0c1822] border border-[#1A3346] rounded-xl text-[#7CCBE8] cursor-pointer hover:bg-[rgba(186,232,255,0.06)] disabled:opacity-40 transition-all">
            <Search className="w-4 h-4" />
          </button>
        </div>
        {error && <div className="text-[#FC8181] text-xs mb-3">{error}</div>}
        <button onClick={enableLocation} className="text-xs text-[#4A6878] hover:text-[#7CCBE8] underline underline-offset-2">
          Try device location instead
        </button>
      </div>
    );
  }

  // reconState === 'map'
  const curatedSelected = selected ? findCurated(selected.lat, selected.lon) : null;

  return (
    <div className="animate-fade-up pt-4 pb-6">
      <div className="flex items-center justify-between mb-3">
        {backButton}
        <button onClick={() => setReconState('gate')} className="text-xs text-[#4A6878] hover:text-[#7CCBE8]">Search elsewhere</button>
      </div>

      <div ref={mapRef} className="w-full h-[320px] rounded-2xl border border-[#1A3346] overflow-hidden mb-3" />

      <div className="flex items-center gap-4 text-[10px] text-[#4A6878] mb-4 px-1">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#7CCBE8]" /> In our database</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#4A6878]" /> Map data only</div>
      </div>

      {selected && (
        <div className="bg-[#0c1822] border border-[#1A3346] rounded-2xl p-4 mb-3">
          <div className="flex items-start justify-between mb-2">
            <div className="font-semibold text-sm text-[#C8E4F0]">{selected.name}</div>
            <button onClick={() => setSelected(null)} className="text-[#4A6878] hover:text-[#BAE8FF]"><X className="w-4 h-4" /></button>
          </div>
          <div className="text-xs text-[#7CCBE8] mb-3">{selected.distance.toFixed(1)} mi away · {selected.type}</div>

          {curatedSelected ? (
            <>
              {curatedSelected.species.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {curatedSelected.species.map((sp, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(186,232,255,0.07)] border border-[#1A3346] text-[#7CCBE8]">{sp}</span>
                  ))}
                </div>
              )}
              {curatedSelected.special_regs ? (
                <div className="text-xs text-[#FC8181] bg-[rgba(252,129,129,0.06)] border border-[rgba(252,129,129,0.2)] rounded-xl px-3 py-2">{curatedSelected.special_regs}</div>
              ) : (
                <div className="text-xs text-[#4A6878]">No special regulations on file for this spot.</div>
              )}
            </>
          ) : (
            <div className="text-xs text-[#4A6878] leading-relaxed flex gap-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Not in our verified database yet. Public map data only gives us the outline — not depth, species, or regulations. That data comes from anglers curating it directly.</span>
            </div>
          )}
        </div>
      )}

      <div className="text-[10px] text-[#4A6878] mb-2 uppercase tracking-wider px-1">{nearby.length} spots within ~15 miles</div>
      {nearby.map((w, i) => {
        const curated = findCurated(w.lat, w.lon);
        return (
          <button key={i} onClick={() => setSelected(w)} className="w-full text-left bg-[#0c1822] border border-[#1A3346] rounded-xl p-3 mb-2 flex items-center justify-between hover:border-[rgba(186,232,255,0.25)] transition-all">
            <div>
              <div className="text-sm text-[#C8E4F0] font-medium flex items-center gap-1.5">
                {w.name}
                {curated && <span className="w-1.5 h-1.5 rounded-full bg-[#7CCBE8]" />}
              </div>
              <div className="text-[11px] text-[#4A6878]">{w.type}</div>
            </div>
            <div className="text-xs text-[#7CCBE8]">{w.distance.toFixed(1)} mi</div>
          </button>
        );
      })}
    </div>
  );
}
