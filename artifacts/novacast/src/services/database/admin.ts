import { collection, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Spot } from '../../data/recommendations';
import { safeGetDocs } from './shared';

export interface AdminLakeRecord { id: string; name: string; location: string; region: string; type: string; species: string[]; spots: Spot[]; special_regs: string; notes: string; }

export async function fetchAdminLakes(): Promise<AdminLakeRecord[]> {
  const snap = await safeGetDocs(query(collection(db, 'adminWaters'), orderBy('createdAt', 'desc')));
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
  // Firestore rules deny this today (writes locked down, no client-side
  // password bypass recreated) — kept as a real call so the UI can attempt
  // it and surface the resulting permission-denied error honestly, instead
  // of faking success. Re-enable in rules once real Firebase Auth exists.
  await deleteDoc(doc(db, 'adminWaters', id));
}
