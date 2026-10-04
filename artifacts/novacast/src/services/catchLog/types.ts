// Catch Log data model (blueprint §13).
//
// Optional feature. Fields mirror what the blueprint lists; every field except
// the system ones is optional so "CAUGHT A FISH -> pick lure -> save" stays a
// two-tap flow with everything else pre-filled from what NovaCast already knows.

export interface CatchConditionsSnapshot {
  time: string | null;
  sky: string | null;
  water: string | null;
  temp: string | null;
  wind: string | null;
  pressure: string | null;
  /** Raw measured value in inHg, when a live weather reading was available at catch time. */
  pressureInHg?: number | null;
  /** Free-text weather line as shown in the app, if one was loaded. */
  weatherText?: string | null;
}

export interface CatchDraft {
  waterName: string;
  waterKey: string | null;
  lat: number | null;
  lon: number | null;
  species: string;
  lure: string;
  rod: string;
  reel: string;
  line: string;
  lengthIn: string;
  weightLb: string;
  spot: string;
  notes: string;
  /** ISO string; defaults to now. */
  caughtAt: string;
  conditions: CatchConditionsSnapshot;
}

export interface CatchRecord extends CatchDraft {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CatchLogStore {
  list(): Promise<CatchRecord[]>;
  add(draft: CatchDraft): Promise<CatchRecord>;
  update(id: string, patch: Partial<CatchDraft>): Promise<CatchRecord | null>;
  remove(id: string): Promise<void>;
}
