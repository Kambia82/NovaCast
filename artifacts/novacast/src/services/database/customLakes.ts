import { collection, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { safeGetDocs } from './shared';

export interface CustomLakeRecord { id: string; name: string; location: string; type: string; notes: string; }

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
