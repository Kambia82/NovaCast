// Firestore-backed Catch Log for signed-in users: users/{uid}/catches/{id}.
//
// Selected by getCatchLogStore(uid) once auth exists. Guest users keep using
// localCatchLogStore and lose nothing. Shape matches CatchLogStore exactly so
// no UI changes when the backing store swaps.

import {
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { CatchDraft, CatchLogStore, CatchRecord } from './types';

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `catch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createFirestoreCatchLogStore(uid: string): CatchLogStore {
  const col = () => collection(db, 'users', uid, 'catches');

  return {
    async list() {
      const snap = await getDocs(query(col(), orderBy('caughtAt', 'desc')));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CatchRecord, 'id'>) }));
    },

    async add(draft: CatchDraft) {
      const id = newId();
      const now = new Date().toISOString();
      const record: CatchRecord = { ...draft, id, createdAt: now, updatedAt: now };
      await setDoc(doc(col(), id), { ...record, _serverTs: serverTimestamp() });
      return record;
    },

    async update(id: string, patch: Partial<CatchDraft>) {
      const ref = doc(col(), id);
      const updatedAt = new Date().toISOString();
      await updateDoc(ref, { ...patch, updatedAt });
      const snap = await getDocs(query(col()));
      const found = snap.docs.find((d) => d.id === id);
      return found ? ({ id, ...(found.data() as Omit<CatchRecord, 'id'>) }) : null;
    },

    async remove(id: string) {
      await deleteDoc(doc(col(), id));
    },
  };
}
