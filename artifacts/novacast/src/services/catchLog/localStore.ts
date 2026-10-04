// localStorage-backed Catch Log.
//
// This is the real persistence implementation for now: NovaCast has no auth yet
// (blueprint §14), so a catch belongs to the device. The `CatchLogStore`
// interface is the seam — a Firestore implementation (collection
// `users/{uid}/catches`) drops in behind `catchLog` in ./index.ts once Firebase
// Auth exists, and anonymous device catches can be migrated up at that point.

import type { CatchDraft, CatchLogStore, CatchRecord } from './types';

const KEY = 'novacast_catch_log';

function readAll(): CatchRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CatchRecord[]) : [];
  } catch {
    return [];
  }
}

function writeAll(records: CatchRecord[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(records));
  } catch {
    /* quota / private mode — the in-session list still reflects the change */
  }
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `catch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const localCatchLogStore: CatchLogStore = {
  async list() {
    return readAll().sort((a, b) => b.caughtAt.localeCompare(a.caughtAt));
  },

  async add(draft: CatchDraft) {
    const now = new Date().toISOString();
    const record: CatchRecord = { ...draft, id: newId(), createdAt: now, updatedAt: now };
    writeAll([record, ...readAll()]);
    return record;
  },

  async update(id: string, patch: Partial<CatchDraft>) {
    const all = readAll();
    const idx = all.findIndex(r => r.id === id);
    if (idx === -1) return null;
    const updated: CatchRecord = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
    all[idx] = updated;
    writeAll(all);
    return updated;
  },

  async remove(id: string) {
    writeAll(readAll().filter(r => r.id !== id));
  },
};
