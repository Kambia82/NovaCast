// One-time lift of a guest's device-local data into their new account
// (blueprint §14: "existing local data should ideally migrate into the account
// rather than disappear"). Runs once per uid; a localStorage flag prevents
// re-running and prevents clobbering account data that's already richer.

import { localUserDataStore } from './localStore';
import { createFirestoreUserDataStore } from './firestoreStore';
import { localCatchLogStore } from '../catchLog';
import { createFirestoreCatchLogStore } from '../catchLog/firestoreStore';
import { EMPTY_TACKLEBOX } from './types';

function migratedKey(uid: string) {
  return `novacast_migrated_${uid}`;
}

export function alreadyMigrated(uid: string): boolean {
  try { return localStorage.getItem(migratedKey(uid)) === '1'; } catch { return false; }
}

export interface MigrationResult {
  ran: boolean;
  tackleboxMoved: boolean;
  catchesMoved: number;
  error?: string;
}

export async function migrateGuestDataToAccount(uid: string): Promise<MigrationResult> {
  if (!uid || alreadyMigrated(uid)) return { ran: false, tackleboxMoved: false, catchesMoved: 0 };

  const cloudData = createFirestoreUserDataStore(uid);
  const cloudCatches = createFirestoreCatchLogStore(uid);
  const result: MigrationResult = { ran: true, tackleboxMoved: false, catchesMoved: 0 };

  try {
    // Tacklebox — only push up if the account has none yet.
    const [localTb, cloudTb] = await Promise.all([
      localUserDataStore.getTacklebox(),
      cloudData.getTacklebox(),
    ]);
    const cloudEmpty = cloudTb.lures.length === 0 && cloudTb.colors.length === 0 && cloudTb.walmart.length === 0;
    const localHasSomething = localTb.lures.length || localTb.colors.length || localTb.walmart.length;
    if (cloudEmpty && localHasSomething) {
      await cloudData.setTacklebox(localTb);
      result.tackleboxMoved = true;
    }

    // Preferences — merge (harmless if empty).
    const localPrefs = await localUserDataStore.getPreferences();
    if (Object.keys(localPrefs).length) await cloudData.setPreferences(localPrefs);

    // Catches — copy any local catch not already in the account (by id).
    const [localList, cloudList] = await Promise.all([
      localCatchLogStore.list(),
      cloudCatches.list(),
    ]);
    const cloudIds = new Set(cloudList.map((c) => c.id));
    for (const c of localList) {
      if (cloudIds.has(c.id)) continue;
      const { id, createdAt, updatedAt, ...draft } = c;
      void id; void createdAt; void updatedAt;
      await cloudCatches.add(draft);
      result.catchesMoved += 1;
    }

    try { localStorage.setItem(migratedKey(uid), '1'); } catch { /* noop */ }
    return result;
  } catch (err) {
    return { ...result, error: err instanceof Error ? err.message : 'migration failed' };
  }
}

export { EMPTY_TACKLEBOX };
