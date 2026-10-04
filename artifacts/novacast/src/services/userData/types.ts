// Per-user data that should eventually follow an account across devices
// (blueprint §14): the Tacklebox and lightweight preferences. Catch Log has its
// own store (services/catchLog). Fishing history is derived from catches.

export interface Tacklebox {
  lures: string[];
  colors: string[];
  walmart: string[];
}

export interface UserPreferences {
  /** Last target species the angler picked, offered as a default next time. */
  defaultSpecies?: string | null;
  /** Angler's usual reel, for lure filtering. */
  defaultReel?: string | null;
  /** Opt-in to spoken answers in On the Bank. */
  voiceByDefault?: boolean;
}

export const EMPTY_TACKLEBOX: Tacklebox = { lures: [], colors: [], walmart: [] };

export interface UserDataStore {
  getTacklebox(): Promise<Tacklebox>;
  setTacklebox(next: Tacklebox): Promise<void>;
  getPreferences(): Promise<UserPreferences>;
  setPreferences(next: UserPreferences): Promise<void>;
}
