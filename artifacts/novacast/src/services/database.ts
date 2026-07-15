import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Spot } from '../data/recommendations';

export interface WaterBodyRecord {
  id: string; key: string; name: string; location: string; region: string;
  type: string; species: string[]; tags: { label: string; color: string }[];
  latitude: number | null; longitude: number | null; spots: Spot[] | null; special_regs: string | null;
}
export interface CustomLakeRecord { id: string; name: string; location: string; type: string; notes: string; }
export interface AdminLakeRecord { id: string; name: string; location: string; region: string; type: string; species: string[]; spots: Spot[]; special_regs: string; notes: string; }

// Firestore denies reads/writes on some collections for now (see firestore.rules) —
// treat permission-denied the same way broken Supabase RLS used to: an empty list,
// not a crash.
async function safeGetDocs(q: ReturnType<typeof query>) {
  try {
    return await getDocs(q);
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'permission-denied') {
      return null;
    }
    throw err;
  }
}

export async function fetchWaterBodies(): Promise<WaterBodyRecord[]> {
  const snap = await safeGetDocs(query(collection(db, 'waterBodies'), orderBy('name')));
  if (!snap) return [];
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, any>;
    return {
      id: d.id,
      key: (data.key as string) ?? d.id,
      name: data.name,
      location: data.location,
      region: data.region,
      type: data.type,
      species: data.species ?? [],
      tags: data.tags ?? [],
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      spots: data.spots ?? null,
      special_regs: data.specialRegs ?? null,
    } as WaterBodyRecord;
  });
}

export async function fetchCustomLakes(): Promise<CustomLakeRecord[]> {
  const snap = await safeGetDocs(query(collection(db, 'customLakes'), orderBy('createdAt', 'desc')));
  if (!snap) return [];
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, any>;
    return {
      id: d.id,
      name: data.name,
      location: data.location,
      type: data.type,
      notes: data.notes,
    } as CustomLakeRecord;
  });
}

export async function fetchAdminLakes(): Promise<AdminLakeRecord[]> {
  const snap = await safeGetDocs(query(collection(db, 'adminLakes'), orderBy('createdAt', 'desc')));
  if (!snap) return [];
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, any>;
    return {
      id: d.id,
      name: data.name,
      location: data.location,
      region: data.region,
      type: data.type,
      species: data.species ?? [],
      spots: data.spots ?? [],
      special_regs: data.specialRegs ?? '',
      notes: data.notes ?? '',
    } as AdminLakeRecord;
  });
}

export async function deleteAdminLake(id: string): Promise<void> {
  await deleteDoc(doc(db, 'adminLakes', id));
}
