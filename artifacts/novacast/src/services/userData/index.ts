import { localUserDataStore } from './localStore';
import { createFirestoreUserDataStore } from './firestoreStore';
import type { UserDataStore } from './types';

export type { Tacklebox, UserPreferences, UserDataStore } from './types';
export { EMPTY_TACKLEBOX } from './types';
export { localUserDataStore };
export { migrateGuestDataToAccount, alreadyMigrated } from './migrate';
export type { MigrationResult } from './migrate';

const cache = new Map<string, UserDataStore>();

/** guest (no uid) -> localStorage; signed in -> Firestore. */
export function getUserDataStore(uid: string | null | undefined): UserDataStore {
  if (!uid) return localUserDataStore;
  let store = cache.get(uid);
  if (!store) {
    store = createFirestoreUserDataStore(uid);
    cache.set(uid, store);
  }
  return store;
}
