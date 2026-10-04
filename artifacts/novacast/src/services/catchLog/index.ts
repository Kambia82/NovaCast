// Catch Log entry point. Components take a `CatchLogStore` (from
// getCatchLogStore) and never touch a concrete store.
//
//   - guest (no uid)  -> localStorage, exactly as before
//   - signed in (uid) -> Firestore users/{uid}/catches, follows the account
//
// `catchLog` stays exported as the local store so existing guest-only callers
// keep working unchanged.

import { localCatchLogStore } from './localStore';
import { createFirestoreCatchLogStore } from './firestoreStore';
import type { CatchLogStore } from './types';

export type {
  CatchRecord,
  CatchDraft,
  CatchLogStore,
  CatchConditionsSnapshot,
} from './types';

export const catchLog: CatchLogStore = localCatchLogStore;
export { localCatchLogStore };

const firestoreCache = new Map<string, CatchLogStore>();

export function getCatchLogStore(uid: string | null | undefined): CatchLogStore {
  if (!uid) return localCatchLogStore;
  let store = firestoreCache.get(uid);
  if (!store) {
    store = createFirestoreCatchLogStore(uid);
    firestoreCache.set(uid, store);
  }
  return store;
}
