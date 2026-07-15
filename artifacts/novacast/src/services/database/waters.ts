import { collection, orderBy, query, type GeoPoint } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Spot } from '../../data/recommendations';
import { safeGetDocs } from './shared';

/**
 * `waters` is the start of NovaCast's long-term water knowledge model, not a
 * one-for-one port of the old `water_bodies` Postgres table. Documents here
 * may carry fields beyond what WaterBodyRecord maps today — richer geometry,
 * access points, aliases, connected water, regulations, external API IDs,
 * cached weather/conditions, recommendation metadata — as Discovery evolves.
 * Extend this mapping additively (new optional fields on WaterBodyRecord,
 * read here) rather than restructuring what already exists. Coordinates are
 * stored as a Firestore GeoPoint (not flat lat/lng fields) so future
 * geospatial queries aren't blocked by today's schema.
 */
export interface WaterBodyRecord {
  id: string; key: string; name: string; location: string; region: string;
  type: string; species: string[]; tags: { label: string; color: string }[];
  latitude: number | null; longitude: number | null; spots: Spot[] | null; special_regs: string | null;
}

export async function fetchWaterBodies(): Promise<WaterBodyRecord[]> {
  const snap = await safeGetDocs(query(collection(db, 'waters'), orderBy('name')));
  if (!snap) return [];
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, any>;
    const coords = data.coordinates as GeoPoint | undefined;
    return {
      id: d.id,
      key: (data.key as string) ?? d.id,
      name: data.name,
      location: data.location,
      region: data.region,
      type: data.type,
      species: data.species ?? [],
      tags: data.tags ?? [],
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      spots: data.spots ?? null,
      special_regs: data.specialRegs ?? null,
    } as WaterBodyRecord;
  });
}
