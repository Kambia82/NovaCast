// Runtime discovery of the USGS 3DHP Waterbody layer, and the spatial query
// against it. Nothing here hard-codes a layer ID or assumes exact field
// names — the FeatureServer's own layer directory and field metadata are
// read at request time (and cached in memory for the life of this function
// instance) so this keeps working if USGS renumbers or renames fields.

const FEATURE_SERVER = 'https://3dhp.nationalmap.gov/arcgis/rest/services/usgs_3dhp_all/FeatureServer';

interface WaterbodyLayer {
  id: number;
  fields: string[];
}

let cachedLayer: WaterbodyLayer | null = null;
let cachedLayerAt = 0;
const LAYER_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h — cheap insurance against USGS restructuring the service without a redeploy

async function fetchJson(url: string, timeoutMs: number): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      const err: any = new Error(`upstream_${res.status}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function discoverWaterbodyLayer(): Promise<WaterbodyLayer> {
  if (cachedLayer && Date.now() - cachedLayerAt < LAYER_CACHE_TTL_MS) return cachedLayer;

  const dir = await fetchJson(`${FEATURE_SERVER}?f=json`, 10000);
  const candidates: any[] = [...(dir.layers ?? []), ...(dir.tables ?? [])];
  const match = candidates.find(
    (l) => typeof l.name === 'string' && /waterbody/i.test(l.name) && l.geometryType === 'esriGeometryPolygon'
  );
  if (!match) {
    throw new Error('waterbody_layer_not_found');
  }

  const meta = await fetchJson(`${FEATURE_SERVER}/${match.id}?f=json`, 10000);
  const fields: string[] = Array.isArray(meta.fields) ? meta.fields.map((f: any) => f.name).filter(Boolean) : [];

  cachedLayer = { id: match.id, fields };
  cachedLayerAt = Date.now();
  return cachedLayer;
}

function pickField(fields: string[], patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const found = fields.find((f) => pattern.test(f));
    if (found) return found;
  }
  return null;
}

const toRad = (d: number) => (d * Math.PI) / 180;
function distanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Outer ring of a Polygon, or the largest ring across a MultiPolygon.
function outerRing(geometry: any): [number, number][] | null {
  if (!geometry) return null;
  if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates?.[0])) {
    return geometry.coordinates[0];
  }
  if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
    let largest: [number, number][] | null = null;
    let largestLen = 0;
    for (const poly of geometry.coordinates) {
      const ring = poly?.[0];
      if (Array.isArray(ring) && ring.length > largestLen) {
        largest = ring;
        largestLen = ring.length;
      }
    }
    return largest;
  }
  return null;
}

function centroidOf(ring: [number, number][]): [number, number] | null {
  if (!ring || ring.length === 0) return null;
  let sumLon = 0, sumLat = 0;
  for (const [lon, lat] of ring) { sumLon += lon; sumLat += lat; }
  return [sumLon / ring.length, sumLat / ring.length];
}

// Planar approximation (equirectangular projection around the ring's mean
// latitude) — accurate enough for pond/lake-scale polygons, not intended for
// anything approaching continental scale.
function approxAreaAcres(ring: [number, number][]): number | null {
  if (!ring || ring.length < 3) return null;
  const meanLat = ring.reduce((s, [, lat]) => s + lat, 0) / ring.length;
  const meanLatRad = toRad(meanLat);
  const metersPerDegLon = 111320 * Math.cos(meanLatRad);
  const metersPerDegLat = 110540;
  const pts = ring.map(([lon, lat]) => [lon * metersPerDegLon, lat * metersPerDegLat]);

  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    area += x1 * y2 - x2 * y1;
  }
  const sqMeters = Math.abs(area) / 2;
  return sqMeters / 4046.8564224; // -> acres
}

const TYPE_KEYWORDS: Array<[RegExp, string]> = [
  [/reservoir/i, 'Reservoir'],
  [/lake/i, 'Lake'],
  [/pond/i, 'Pond'],
  [/swamp|marsh/i, 'Swamp/Marsh'],
  [/estuary/i, 'Estuary'],
  [/playa/i, 'Playa'],
  [/ice ?mass/i, 'Ice Mass'],
];

function classifyType(raw: string | null | undefined): string {
  if (!raw) return 'Water';
  for (const [pattern, label] of TYPE_KEYWORDS) {
    if (pattern.test(raw)) return label;
  }
  return 'Water';
}

export interface NearbyWaterFeature {
  name: string | null;
  isNamed: boolean;
  featureType: string;
  areaAcres: number | null;
  distanceMi: number | null;
  lat: number | null;
  lon: number | null;
  geometry: any;
}

export async function queryNearbyWater(lat: number, lon: number, radiusMeters: number): Promise<{ features: NearbyWaterFeature[]; layerId: number }> {
  const layer = await discoverWaterbodyLayer();
  const nameField = pickField(layer.fields, [/^gnis_?name$/i, /^name$/i, /name/i]);
  const typeField = pickField(layer.fields, [/^ftype$/i, /^f_?type$/i, /featuretype/i, /^type$/i]);

  const qs = new URLSearchParams({
    f: 'geojson',
    geometry: `${lon},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    outSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    distance: String(radiusMeters),
    units: 'esriSRUnit_Meter',
    outFields: '*',
    returnGeometry: 'true',
    resultRecordCount: '50',
  });

  const geojson = await fetchJson(`${FEATURE_SERVER}/${layer.id}/query?${qs.toString()}`, 15000);
  const rawFeatures: any[] = Array.isArray(geojson.features) ? geojson.features : [];

  const features: NearbyWaterFeature[] = rawFeatures.map((f) => {
    const props = f.properties ?? {};
    const rawName: string | null = nameField ? (props[nameField] || null) : null;
    const typeRaw: string | null = typeField ? String(props[typeField] ?? '') : null;
    const ring = outerRing(f.geometry);
    const centroid = ring ? centroidOf(ring) : null;

    return {
      name: rawName,
      isNamed: !!rawName,
      featureType: classifyType(typeRaw),
      areaAcres: ring ? approxAreaAcres(ring) : null,
      distanceMi: centroid ? distanceMiles(lat, lon, centroid[1], centroid[0]) : null,
      lat: centroid ? centroid[1] : null,
      lon: centroid ? centroid[0] : null,
      geometry: f.geometry ?? null,
    };
  })
    .filter((f) => f.geometry && f.lat !== null && f.lon !== null)
    .sort((a, b) => (a.distanceMi ?? Infinity) - (b.distanceMi ?? Infinity))
    .slice(0, 25);

  return { features, layerId: layer.id };
}
