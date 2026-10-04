// Firestore-backed user data for signed-in anglers.
//   users/{uid}/appdata/tacklebox
//   users/{uid}/appdata/preferences

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { EMPTY_TACKLEBOX, type Tacklebox, type UserDataStore, type UserPreferences } from './types';

export function createFirestoreUserDataStore(uid: string): UserDataStore {
  const ref = (name: string) => doc(db, 'users', uid, 'appdata', name);

  return {
    async getTacklebox() {
      const snap = await getDoc(ref('tacklebox'));
      return snap.exists() ? { ...EMPTY_TACKLEBOX, ...(snap.data() as Partial<Tacklebox>) } : EMPTY_TACKLEBOX;
    },
    async setTacklebox(next) {
      await setDoc(ref('tacklebox'), next, { merge: true });
    },
    async getPreferences() {
      const snap = await getDoc(ref('preferences'));
      return snap.exists() ? (snap.data() as UserPreferences) : {};
    },
    async setPreferences(next) {
      await setDoc(ref('preferences'), next, { merge: true });
    },
  };
}
