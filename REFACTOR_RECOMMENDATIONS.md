# Novacast — Refactor Recommendations

> Based on architecture audit of June 15, 2026  
> Philosophy: fix what is broken first, modernize what holds the app back, leave working logic alone.

---

## Priority 0 — Fix Broken Features (Do These First)

These are not cosmetic or architectural — the app is functionally broken in these areas right now.

### 0-A: Fix the Supabase RLS / auth problem

**What's broken:** All three Supabase tables require `authenticated` session. The app never calls `supabase.auth.signIn*()`. Result: `water_bodies`, `custom_lakes`, and `admin_lakes` all return empty arrays silently on every load. The app appears to work but the location database is empty.

**Options (pick one):**

| Option | Effort | Trade-off |
|---|---|---|
| **Enable anon read on water_bodies and admin_lakes** | Low — change RLS policy in Supabase dashboard | `water_bodies` becomes public-readable. Fine for a fishing app. |
| **Use Supabase anonymous auth** | Medium — call `supabase.auth.signInAnonymously()` on mount | Gives each device a stable UUID; enables custom_lakes later |
| **Move water_bodies to a static JSON file** | Low | Eliminates the Supabase dependency for read-only reference data |

**Recommended path:** Change the `water_bodies` and `admin_lakes` SELECT policy to `TO public` (no auth required). Implement `supabase.auth.signInAnonymously()` on mount so `custom_lakes` works per-device.

### 0-B: Remove the hardcoded OpenWeatherMap API key

**File:** `NovaCastWizard.jsx` line ~218  
**Risk:** The key is visible in the client bundle. Anyone can extract it and exhaust the quota.  
**Fix:** Move to `VITE_OPENWEATHER_API_KEY` in Replit secrets.

```typescript
// Before
const res = await fetch(`...&appid=9e751a40a370416832496e123e1098cc&...`);

// After
const key = import.meta.env.VITE_OPENWEATHER_API_KEY;
const res = await fetch(`...&appid=${key}&...`);
```

### 0-C: Fix the tacklebox storage key conflict

**What's broken:** App.tsx seeds its `tacklebox` state from `novacast_tacklebox` (old key). NovaCastTacklebox.tsx reads/writes `novacast_tacklebox_v2`. Items saved from the result screen (via `toggleTacklebox` in App.tsx) go into the old key. Items displayed in the tacklebox component come from the new key. They diverge.

**Fix:** Migrate to a single key `novacast_tacklebox_v2` everywhere. On mount, check for the old key, merge it into v2, and delete the old key.

```typescript
// One-time migration on app mount
const old = localStorage.getItem('novacast_tacklebox');
if (old) {
  const oldData = JSON.parse(old);
  const current = JSON.parse(localStorage.getItem('novacast_tacklebox_v2') || '{}');
  const merged = {
    lures: [...new Set([...(current.lures || []), ...(oldData.lures || [])])],
    colors: [...new Set([...(current.colors || []), ...(oldData.colors || [])])],
    walmart: [...new Set([...(current.walmart || []), ...(oldData.walmart || [])])],
    memories: current.memories || [],
    wishlist: current.wishlist || [],
  };
  localStorage.setItem('novacast_tacklebox_v2', JSON.stringify(merged));
  localStorage.removeItem('novacast_tacklebox');
}
```

### 0-D: Remove the hardcoded admin password from source code

**File:** `App.tsx` line ~184 — `if (adminPw === 'castmaster2025')`  
**Risk:** Password is visible to anyone who views source or downloads the bundle.  
**Fix:** Move to `VITE_ADMIN_PASSWORD` environment variable. Not ideal for production (client-side secrets are still extractable) but removes it from version-controlled source code. Long term, move admin to a server-side route.

---

## Priority 1 — Core Structural Improvements

### 1-A: Convert NovaCastWizard.jsx to TypeScript

The Wizard is the most critical interactive component (6 screens, GPS logic, weather loading, location selection) and has zero type safety. Props like `waterBodies`, `customLakes`, `adminLakes` receive `any`.

**Steps:**
1. Rename `NovaCastWizard.jsx` → `NovaCastWizard.tsx`
2. Import and reuse the existing interfaces from `data/waterBodies.ts` (`WaterBody`, `Spot`)
3. Define the `WizardProps` interface explicitly
4. The existing `WaterBodyRow`, `CustomLakeRow`, `AdminLakeRow` interfaces in App.tsx should move to a shared `types.ts`

### 1-B: Extract shared types into `src/types.ts`

Currently, `WaterBodyRow`, `CustomLakeRow`, `AdminLakeRow`, `WizardState`, `AppView` are all defined inline in `App.tsx`. They're needed in multiple components.

```typescript
// src/types.ts
export interface WaterBodyRow { ... }
export interface CustomLakeRow { ... }
export interface AdminLakeRow { ... }
export interface WizardState { ... }
export type AppView = 'welcome' | 'wizard' | 'result' | 'tacklebox' | 'reference';
```

### 1-C: Break up App.tsx

At ~480 lines, `App.tsx` is a monolith containing four distinct logical views inlined. Split into:

```
src/
├── App.tsx               # Only: view router + shared state + data loading
├── screens/
│   ├── WelcomeScreen.tsx # "Find Near Me", zip, Browse — extracted from App.tsx renderWelcome()
│   ├── ResultScreen.tsx  # Game plan, lures, spots — extracted from App.tsx renderResult()
│   └── AdminPanel.tsx    # Admin password gate + lake management
├── NovaCastWizard.tsx    # Renamed from .jsx
├── NovaCastReference.tsx # Unchanged
└── NovaCastTacklebox.tsx # Unchanged
```

This is a refactor, not a rewrite — copy the JSX blocks, do not redesign them.

### 1-D: Deduplicate constants

Remove duplicated `RECENT_WEATHER_OPTIONS` and `REGION_LABELS` from both `App.tsx` and `NovaCastWizard.jsx`. Move to `src/constants.ts`:

```typescript
// src/constants.ts
export const RECENT_WEATHER_OPTIONS = [ ... ];
export const REGION_LABELS = { ... };  // include 'custom' key (missing in Wizard)
```

Import in both files. Fixes the subtle divergence in descriptions.

### 1-E: Deduplicate the haversine distance function

Both `App.tsx` and `NovaCastWizard.jsx` implement the same haversine formula independently. Move to a shared utility:

```typescript
// src/lib/geo.ts
export function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number { ... }
export function formatDist(miles: number): string { ... }
```

---

## Priority 2 — UX and Feature Improvements

### 2-A: Consolidate the two GPS flows into one

**Problem:** The welcome screen "Find Near Me" button calls the Overpass API and returns raw OSM water bodies (unnamed ponds, rivers). The Wizard's GPS returns the app's curated Supabase list ranked by distance. These are completely different results.

**Recommendation:** Remove the Overpass API flow from the welcome screen entirely. The "Find Near Me" button on the welcome screen should launch the Wizard directly and trigger the Wizard's GPS flow, which returns known, curated spots.

The Overpass flow could be preserved as a secondary "Show me anything nearby" option for users who want to explore locations not in the database — but it should not be the default behavior.

### 2-B: Style consistency — inline styles vs Tailwind

The Wizard uses raw inline style objects (`const st = { card: { ... }, ... }`) while the rest of the app uses Tailwind classes. This creates a maintenance burden: the dark navy theme (`#0f1f3d`, `#152a4f`, etc.) is hardcoded in both the CSS variables (`index.css`) and the Wizard's `st` object.

**Recommendation:** Convert the Wizard's `st` object inline styles to Tailwind classes. The design tokens are already in `index.css` — they just need to be used consistently. This is a significant effort but makes future theming changes much easier.

**If doing this incrementally:** At minimum, extract the repeating color values in `st` to CSS custom properties that map to `index.css` variables, so a color change only needs to happen in one place.

### 2-C: Add Supabase anonymous auth for custom lakes

As noted in Priority 0-A, custom lakes are broken because there's no auth. The lightest-weight fix that restores the feature without building a full login UI:

```typescript
// src/lib/supabase.ts — add on init
import { supabase } from './supabase';

export async function ensureAnonSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    await supabase.auth.signInAnonymously();
  }
}
```

Call `ensureAnonSession()` once in `App.tsx` `useEffect`. This gives each device a stable anonymous UUID. Custom lakes are now tied to the device, not a named account. If the user clears browser storage, they lose their custom lakes — acceptable for v1.

### 2-D: Add a proper admin backend route

The current admin panel is a client-side password gate with the password visible in source. For any production use, admin mutations (`insert`/`delete` on `admin_lakes`) should go through a server-side API route that validates a proper secret before calling Supabase with the service role key.

In the Replit stack, this means adding routes to `artifacts/api-server/`.

---

## Priority 3 — What to Leave Alone

These are working well and should not be refactored without a specific reason:

| Module | Verdict |
|---|---|
| `data/recommendations.ts` | Clean, pure functions, well-organized. Do not touch unless adding new logic. |
| `NovaCastReference.tsx` | Static content, clean structure. Expansion (more species, more lures) is additive. |
| `index.css` | Design tokens, animations, scrollbar styling are well-done. Keep the CSS variable system. |
| `src/lib/supabase.ts` | Minimal and correct. |
| Tailwind v3 setup | Working. Do not upgrade to v4 without testing — the `@tailwind` directive syntax changes. |
| PWA manifest + service worker | Working. The sw.js in `public/` is a pre-built file — do not let Vite overwrite it. |

---

## Modernization Plan — Suggested Order

```
Phase 1: Fix broken features (1–2 days, no visible UX change)
  ✓ Fix Supabase RLS (anon read on water_bodies + admin_lakes)
  ✓ Implement supabase.auth.signInAnonymously() for custom_lakes
  ✓ Move OpenWeatherMap key to environment variable
  ✓ Fix tacklebox storage key conflict (one-time migration)
  ✓ Move admin password to environment variable

Phase 2: Code health (2–3 days, no visible UX change)
  ✓ Extract shared types to src/types.ts
  ✓ Convert NovaCastWizard.jsx → .tsx with proper types
  ✓ Deduplicate RECENT_WEATHER_OPTIONS and REGION_LABELS
  ✓ Deduplicate haversine function into src/lib/geo.ts
  ✓ Split App.tsx into WelcomeScreen, ResultScreen, AdminPanel

Phase 3: UX improvements (variable effort, visible changes)
  ✓ Consolidate GPS flows (remove Overpass from welcome screen)
  ✓ Wizard inline styles → Tailwind classes
  ✓ Admin backend route (server-side auth for admin mutations)

Phase 4: New features (separate, future work)
  • More water bodies in the Supabase database
  • Named user accounts (Supabase Auth email/social)
  • Cloud sync for tacklebox/memories across devices
  • Push notifications for weather changes at saved spots
  • Offline mode (service worker caching of Supabase data)
```

---

## Files Safe to Delete

| File | Reason |
|---|---|
| `.migration-backup/novacast_source.html` | Old HTML prototype, different color scheme, not referenced |
| `.migration-backup/FULL_PROJECT_COPY.txt` | Source dump artifact from Bolt export |
| `.migration-backup/firebase.json` | Firebase hosting config — Replit deployment replaces this |
| `.migration-backup/.bolt/` (if present) | StackBlitz metadata, irrelevant on Replit |

Do not delete:
- `supabase/migrations/` — useful reference for recreating the schema
- Any file currently imported by `App.tsx` or `main.tsx`
