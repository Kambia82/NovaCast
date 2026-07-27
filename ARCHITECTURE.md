# NovaCast — Architecture

> Canonical, current-state architecture doc. Supersedes `CURRENT_ARCHITECTURE.md`
> and `DATABASE_MAP.md` (both archived, pre-migration snapshots). Every claim
> below was verified by reading the referenced file directly as of this audit.

## 1. Repository shape

NovaCast is a pnpm workspace monorepo (`pnpm-workspace.yaml`), root package
named `workspace`, license MIT. Workspaces: `artifacts/*`, `lib/*`,
`lib/integrations/*` (currently empty), `scripts`.

```
NovaCast/
├── artifacts/
│   ├── novacast/            # THE PRODUCT — the live, deployed app (now on Firebase/Firestore)
│   ├── api-server/          # Express skeleton — health check only, not wired to novacast
│   └── mockup-sandbox/      # UI component sandbox for design exploration
├── functions/                # Cloud Functions (Gen 2) — `claimAdmin` callable, server-side admin auth
├── lib/
│   ├── db/                  # Drizzle + Postgres — schema is empty, unused (not part of the Firebase stack)
│   ├── api-spec/            # OpenAPI spec (health check only) + Orval codegen config
│   ├── api-zod/             # Re-exports Orval-generated Zod schemas (nothing generated yet)
│   └── api-client-react/    # Re-exports Orval-generated React Query hooks (nothing generated yet)
├── scripts/                 # `pnpm run hello` — placeholder workspace, not build tooling in active use
├── .migration-backup/       # Frozen pre-migration source tree (Bolt/Supabase export) — archival only
├── attached_assets/         # Product-vision source material (brainstorm notes, screenshot, PDF)
├── firebase.json, .firebaserc, firestore.rules, firestore.indexes.json   # Firebase Hosting + Firestore + Functions config
└── .github/workflows/firebase-hosting.yml   # CI: typecheck + build novacast, deploy to Firebase Hosting on push to main
```

Only `artifacts/novacast` is deployed and user-facing today. `functions/`
exists but has not been deployed from this environment (no Firebase CLI
credentials available here — see `DECISIONS.md` ADR-008). `lib/db`,
`artifacts/api-server`, and the Orval codegen packages under `lib/` remain
unbuilt scaffolding for a Postgres/Drizzle direction that is not part of the
Firebase stack (§7 item 4).

## 2. The product: `artifacts/novacast`

React 19 + Vite 7 + TypeScript 5.9 SPA. Tailwind CSS v3 (project-level
`tailwind.config.js`; the workspace catalog pins Tailwind v4, but novacast
overrides to v3 in its own `package.json` — a real version split, not an
oversight to "fix" casually, since v3→v4 changes the `@tailwind` directive
syntax). No router — navigation is React state in `App.tsx`, same approach
as the pre-migration app.

### 2.1 Application flow

```
App (src/App.tsx)
  view: 'discovery' | 'wizard' | 'workspace'

  'discovery'  — renderDiscovery()
      ├── "Find Near Me"   → startWithGPS(): Overpass API, raw OSM water bodies within 30km
      ├── Zip code search  → searchByZip(): Nominatim geocode → Overpass API, same as above
      ├── result tap       → sets locName/locLat/locLon, view='workspace'
      ├── "Browse STL Lakes" → view='wizard'
      ├── "My Tacklebox"   → view='workspace', activeTab='tacklebox'
      └── "Reference"      → view='workspace', activeTab='learn'

  'wizard'     — <NovaCastWizard /> (src/NovaCastWizard.jsx, plain JS, not TS)
      6-step flow: target fish → reel (skippable) → time of day → conditions
      (sky/water/temp/wind/pressure, with its own weather auto-fill) → recent
      weather (skippable) → location (GPS / city search / region browse,
      backed by waterBodies/customLakes/adminLakes props from App.tsx).
      onComplete(wizardState) → App sets state, view='workspace'

  'workspace'  — renderWorkspace(), tabbed hub anchored to the selected lake
      Tab: Game Plan (activeTab='recommendations')
          <ConditionsPanel /> (src/ConditionsPanel.tsx) — a SECOND, independent
          conditions UI (pill groups) feeding the same App-level `state`
          → renderRecommendations(): calls data/recommendations.ts functions
            (getFishMovement, getBarometricImpact, getRecentWeatherImpact,
            getSpots, getLures, getColors, getWalmart, getProTip) and renders
            output; heart buttons write into `tacklebox` state
      Tab: Learn (activeTab='learn')
          <NovaCastReference inline /> — static educational content
      Tab: Tacklebox (activeTab='tacklebox')
          <NovaCastTacklebox externalTacklebox={tacklebox} onToggleSaved={...} />
          Also contains its OWN internal "Guide" view (reels/knots/bait/
          water-reading) — a second, separate copy of reference-style content
          alongside the same-purpose "Learn" tab (see TECH_DEBT.md #7).

  '#admin' hash — renderAdmin(): password entered client-side is sent to the
      `claimAdmin` Cloud Function, which checks it server-side and grants an
      `admin` custom claim; the panel then lists/deletes `adminWaters`
      documents in Firestore, enforced by firestore.rules.
```

This is a materially different — and more evolved — flow than the one
described in the now-archived `CURRENT_ARCHITECTURE.md`. The Discovery →
Wizard/GPS → Lake Workspace shape matches `DESIGN_PROPOSAL.md`'s "Lake
Workspace" redesign: that proposal has already been substantially
implemented, though its Trip Planning and Multi-Angler tabs have not (see
`ROADMAP.md`).

### 2.2 The recommendation engine

`src/data/recommendations.ts` — pure TypeScript functions, no I/O, no
framework dependency:

```
getFishMovement(time, sky) → { title, depthPct, moveText }
applyRecentWeatherToDepth(movement, recentWeather[]) → movement
getBarometricImpact(pressure) → { title, text, depthAdj, activityMod } | null
getRecentWeatherImpact(recentWeather[]) → string[]
getGeneralBestRecommendation(month) → seasonal fallback when conditions are skipped
getSpots(spots, time, sky) → re-sorted Spot[]
getLures(sky, water, temp, fish, time, pressure?) → Lure[]
getColors(sky, water, time) → { colors, reason }
getWalmart(fish, water, time) → WalmartItem[]
getProTip(...) → string
getCustomSpots(type, notes) → Spot[] (for user-added lakes with no curated spots)
```

`src/data/waterBodies.ts` holds the `WaterBody`/`Spot`/`WaterBodyTag`
interfaces and the `REGION_LABELS` / `TYPE_LABELS` display maps. This module
is clean and does not need to change to support a backend swap.

## 3. Data layer — Firebase/Firestore is canonical; Supabase is removed

Supabase was the live backend through most of this project's history, in
parallel with a fully-built but unwired Firestore data-access layer (see
`DECISIONS.md` ADR-003 for that period, and ADR-008 for the cutover). As of
ADR-008, `App.tsx` reads and writes exclusively through Firestore, and the
Supabase client (`src/lib/supabase.ts`) and its dependency
(`@supabase/supabase-js`) have been deleted from the repository entirely.

| Layer | Where | Status |
|---|---|---|
| **Firestore** | `src/lib/firebase.ts` (client init + `ensureAnonAuth`), `src/services/database/{waters,customLakes,admin,shared}.ts`, `firestore.rules`, `firestore.indexes.json` | **Live.** `App.tsx` calls `fetchWaterBodies`, `fetchCustomLakes`, `fetchAdminLakes`, `deleteAdminLake` through the `src/services/database` barrel — this is the only data layer in the app. |
| **Firebase Auth** | `src/lib/firebase.ts` (`ensureAnonAuth`) | **Live, anonymous only.** Established on `App.tsx` mount so Firestore rules can require `request.auth != null` (customLakes reads) without a login screen. No named-account auth exists yet. |
| **Cloud Functions** | `functions/` (`claimAdmin` callable) | **Written, not yet deployed** from this environment — no Firebase CLI credentials available here. Requires `firebase functions:secrets:set ADMIN_PASSWORD` once, then `firebase deploy --only functions`, before `App.tsx`'s admin login will succeed against a live project. |
| **Postgres + Drizzle** | `lib/db/` (`drizzle.config.ts`, empty `src/schema/index.ts`), consumed by `artifacts/api-server/` | **Unbuilt scaffold, unrelated to the Firebase stack.** Schema file is the untouched template comment; the Express server only implements `/api/healthz`. Not part of the canonical backend decision and not connected to novacast. |

Firebase Hosting (`firebase.json`, `.firebaserc`, `novacast-26e4c` project)
remains the deploy target, now joined by Firestore (database) and Cloud
Functions (backend logic) under the same project — Firebase is the single
canonical backend end to end, as decided.

**What this audit could not verify:** whether the `waters`/`adminWaters`
Firestore collections in the live `novacast-26e4c` project are actually
seeded with the same curated lake data that lived in Supabase's
`water_bodies`/`admin_lakes` tables. No Firebase CLI or credentials were
available in this environment to check or migrate live data. If those
collections are empty, the deployed app will show zero water bodies after
this cutover ships — **this must be checked (and the data migrated/seeded
if needed) before or immediately after deploying this change.** Flagged as
a blocker in this session's report.

### 3.1 Firestore schema

Collections, per `src/services/database/*.ts`:

- **`waters`** — curated spots: `key`, `name`, `location`, `region`, `type`,
  `species[]`, `tags`, `coordinates` (Firestore `GeoPoint`, not flat lat/lng
  — deliberately, to leave room for future geospatial queries per the doc
  comment in `waters.ts`), `spots`, `specialRegs`. Public read, no client
  writes (`firestore.rules`).
- **`adminWaters`** — admin-added spots: `name`, `location`, `region`,
  `type`, `species[]`, `spots`, `specialRegs`, `notes`. Public read; writes
  require the `admin` custom claim (granted by `claimAdmin`, see §4).
- **`customLakes`** — user-added spots: `name`, `location`, `type`, `notes`.
  Readable by any authenticated (including anonymous) session; writes
  denied — there is still no "add a custom lake" UI anywhere in `App.tsx`,
  so this collection has no writer regardless of rules (tracked in
  `TECH_DEBT.md`/`ROADMAP.md`).

## 4. Authentication

Firebase Authentication, anonymous sign-in only (`ensureAnonAuth()` in
`src/lib/firebase.ts`, called on `App.tsx` mount). This gives every device a
stable `request.auth.uid` so Firestore rules can gate reads/writes without a
login screen — matching the product's no-account-required UX.

The `#admin` panel's password is no longer a client-side literal: `adminLogin`
in `App.tsx` calls the `claimAdmin` Cloud Function (`functions/src/index.ts`),
which checks the password against a value held in Secret Manager (never
shipped to the client bundle) and, on success, grants the caller's Firebase
Auth session the `admin` custom claim. `firestore.rules` requires that claim
to write to `adminWaters`. This replaces the previous client-side-only
string comparison, which had no real enforcement behind it — any client
could have written to `admin_lakes`/`adminWaters` directly regardless of
what the UI checked. See `DECISIONS.md` ADR-009.

No named user accounts exist yet — that's still future work (`ROADMAP.md`).

## 5. External API integrations

| API | Used for | Where |
|---|---|---|
| OpenStreetMap Overpass | "Find Near Me" / zip search on the Discovery screen — any named OSM water body within 30km | `App.tsx` (`startWithGPS`, `searchByZip`) |
| Nominatim | Zip code and city-name geocoding | `App.tsx`, `NovaCastWizard.jsx` |
| OpenWeatherMap | Conditions auto-fill (sky/temp/wind/pressure) | `App.tsx` `loadWeather`, `NovaCastWizard.jsx` `loadWeather` — two independent implementations of the same call, now both reading `VITE_OPENWEATHER_API_KEY` (fixed in this audit; previously the Wizard's copy had the key hardcoded) |
| Google Maps (deep links only) | Navigate / directions links | Rendered inline, no SDK |

Discovery's Overpass flow and the Wizard's GPS flow remain two separate,
non-overlapping "find water near me" implementations, exactly as flagged in
the archived audit — this was never consolidated, it just moved from
Welcome-screen-vs-Wizard to Discovery-screen-vs-Wizard.

## 6. Build & deploy

- Package manager: pnpm only (root `preinstall` script hard-fails on
  npm/yarn user agents).
- `pnpm run build` = typecheck (root + libs) then `pnpm -r build`.
- `artifacts/novacast`: `vite build` → `dist/public` (see `vite.config.ts`;
  `PORT`/`BASE_PATH` env-overridable, defaults 8080 and `/`).
- CI (`.github/workflows/firebase-hosting.yml`): on push to `main`, installs
  scoped to novacast, writes `.env.production` from GitHub Secrets (Firebase
  config + the OpenWeatherMap key — Supabase secrets removed), **typechecks**,
  builds, and deploys via `FirebaseExtended/action-hosting-deploy` to the
  `novacast-26e4c` Firebase Hosting site.
- CI does **not** deploy `functions/` — that still requires a manual
  `firebase deploy --only functions` (after `firebase functions:secrets:set
  ADMIN_PASSWORD` has been run once) from an environment with real Firebase
  CLI credentials, which this environment does not have. Adding an
  automated functions-deploy step is tracked in `ROADMAP.md` rather than
  done blind.
- No CI step runs tests — none exist yet (`TECH_DEBT.md`).
- `artifacts/api-server`, `lib/db`, and `functions` are typecheck-only in
  CI's `pnpm run typecheck` (via the root script's `--filter`); nothing
  deploys or runs `api-server`/`lib/db` outside local dev (`.claude/launch.json`
  has a launch config for `api-server` on port 8081, for local use only).

## 7. Known architectural inconsistencies (see `TECH_DEBT.md` for the full list)

1. ~~Firestore data layer built and unused while Supabase is live~~ —
   **resolved** (ADR-008): `App.tsx` now calls Firestore exclusively and
   Supabase has been removed from the repository.
2. Two independent conditions-input UIs with drifting option sets
   (`NovaCastWizard.jsx` vs `ConditionsPanel.tsx`).
3. Two independent "find water nearby" implementations (Discovery's Overpass
   flow vs the Wizard's curated-database GPS flow).
4. Two independent reference/field-guide UIs (`NovaCastReference.tsx` "Learn"
   tab vs `NovaCastTacklebox.tsx`'s internal "Guide" view).
5. `lib/db` + `artifacts/api-server` + `lib/api-spec`/`api-zod`/
   `api-client-react` form a complete, unbuilt Postgres/Drizzle/Express
   scaffold that has no callers and no schema. It is not part of the
   Firebase-canonical stack (§3) and its future is undecided — either build
   it out for a real server-side need Cloud Functions doesn't cover, or
   remove it.
6. PWA `manifest.json` references `/icon-192.png` and `/icon-512.png`; neither
   file exists in `artifacts/novacast/public/`.
7. No test suite exists anywhere in the repository (`grep`-verified: no
   `*.test.*`/`*.spec.*` files, no test runner in any `package.json`).
8. `artifacts/novacast/src/components/ui/` — a ~5,800-line, 54-file shadcn/ui
   component library (accordion, calendar, carousel, sidebar, chart, command
   palette, forms, etc.), plus `src/hooks/use-toast.ts` and
   `src/pages/not-found.tsx` — has **zero callers** anywhere in the actual
   app (verified: grepping `App.tsx`, `main.tsx`, `NovaCastWizard.jsx`,
   `NovaCastReference.tsx`, `NovaCastTacklebox.tsx`, and
   `ConditionsPanel.tsx` for `components/ui`, `@/components`, `@/hooks`,
   `@/pages` returns no matches). NovaCast's real screens are hand-built with
   raw Tailwind classes; this is leftover shadcn/Replit starter template
   scaffolding. Likely tree-shaken out of the production bundle since
   nothing imports it, but it's real weight in the repo and in
   `devDependencies` (the matching ~25 `@radix-ui/*` packages, `cmdk`,
   `embla-carousel-react`, `recharts`, `sonner`, `vaul`, `react-hook-form`,
   etc.) for code that does nothing today.
9. `functions/` is written but unverified against a live Firebase project —
   no deploy credentials were available in this environment (§3, §6).
