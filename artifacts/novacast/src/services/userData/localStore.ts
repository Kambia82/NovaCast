import { EMPTY_TACKLEBOX, type Tacklebox, type UserDataStore, type UserPreferences } from './types';

// Device-local user data — the default. Key names are unchanged from the
// original inline App.tsx implementation so existing installs keep their gear.
const TACKLEBOX_KEY = 'novacast_tacklebox';
const PREFS_KEY = 'novacast_prefs';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota / private mode */ }
}

export const localUserDataStore: UserDataStore = {
  async getTacklebox() {
    return read<Tacklebox>(TACKLEBOX_KEY, EMPTY_TACKLEBOX);
  },
  async setTacklebox(next) {
    write(TACKLEBOX_KEY, next);
  },
  async getPreferences() {
    return read<UserPreferences>(PREFS_KEY, {});
  },
  async setPreferences(next) {
    write(PREFS_KEY, next);
  },
};
