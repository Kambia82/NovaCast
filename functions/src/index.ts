import * as functions from 'firebase-functions/v1';
import { queryNearbyWater } from './discovery';

const DEFAULT_RADIUS_METERS = 24140; // ~15 miles, matches the existing Overpass radius
const MAX_RADIUS_METERS = 40000; // hard cap so a bad/abusive request can't force a huge query

function setCors(res: functions.Response): void {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
}

// Server-side proxy: the NovaCast client only ever calls this function. It
// never talks to USGS 3DHP directly, so the browser's CORS/reachability
// characteristics against nationalmap.gov are irrelevant to the app working.
export const nearbyWater = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    const lat = parseFloat(String(req.query.lat ?? ''));
    const lon = parseFloat(String(req.query.lon ?? ''));
    const radiusParam = parseFloat(String(req.query.radius ?? ''));
    const radiusMeters = Number.isFinite(radiusParam) && radiusParam > 0
      ? Math.min(radiusParam, MAX_RADIUS_METERS)
      : DEFAULT_RADIUS_METERS;

    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      res.status(400).json({ error: 'invalid_coordinates' });
      return;
    }

    try {
      const { features, layerId } = await queryNearbyWater(lat, lon, radiusMeters);
      res.status(200).json({ features, layerId });
    } catch (err) {
      functions.logger.error('nearbyWater failed', { message: err instanceof Error ? err.message : String(err) });
      res.status(502).json({ error: 'service_unreachable' });
    }
  });
