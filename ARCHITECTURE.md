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
│   ├── novacast/            # THE PRODUCT — the live, deployed app
│   ├── api-server/          # Express skeleton — health check only, not wired to novacast
│   └── mockup-sandbox/      # UI component sandbox for design exploration
├── lib/
│   ├── db/                  # Drizzle + Postgres — schema is empty, unused
│   ├── api-spec/            # OpenAPI spec (health check only) + Orval codegen config
│   ├── api-zod/             # Re-exports Orval-generated Zod schemas (nothing generated yet)
│   └── api-client-react/    # Re-exports Orval-generated React Query hooks (nothing generated yet)
├── scripts/                 # `pnpm run hello` — placeholder workspace, not build tooling in active use
├── .migration-backup/       # Frozen pre-migration source tree (Bolt/Supabase export) — archival only
├── attached_assets/         # Product-vision source material (brainstorm notes, screenshot, PDF)
├── firebase.json, .firebaserc, firestore.rules, firestore.indexes.json   # Firebase Hosting + Firestore config
└── .github/workflows/firebase-hosting.yml   # CI: build novacast, deploy to Firebase Hosting on push to main
```

Only `artifacts/novacast` is deployed and user-facing today. Everything else
under `lib/` and the other two `artifacts/*` packages is scaffolding for a
direction that was started but not finished (see §5).

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
          alongside the same-purpose "Learn" tab (see TECH_DEBT.md #4).

  '#admin' hash — renderAdmin(), password-gated (hardcoded 'castmaster2025' in
      App.tsx) panel to list/delete `admin_lakes` rows via Supabase.
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

## 3. Data layer — three parallel backends, one actually wired up

This is the single most consequential architectural fact about the current
codebase.

| Backend | Where | Status |
|---|---|---|
| **Supabase (Postgres + RLS)** | `src/lib/supabase.ts`, called directly from `App.tsx` (`loadWaterBodies`, `loadCustomLakes`, `loadAdminLakes`, `deleteAdminLake`) | **Live.** This is what the deployed app actually reads and writes today. |
| **Firestore** | `src/lib/firebase.ts`, `src/services/database/{waters,customLakes,admin,shared}.ts`, `firestore.rules`, `firestore.indexes.json` | **Built, never wired in.** A complete, well-commented data-access layer (`fetchWaterBodies`, `fetchCustomLakes`, `fetchAdminLakes`, `deleteAdminLake`) exists behind a clean barrel (`src/services/database/index.ts`) but **`App.tsx` never imports from it.** It is dead code from the running app's perspective — present in the bundle, exercised by nothing. |
| **Postgres + Drizzle** | `lib/db/` (`drizzle.config.ts`, empty `src/schema/index.ts`), consumed by `artifacts/api-server/` | **Unbuilt scaffold.** Schema file is the untouched template comment; the Express server (`artifacts/api-server`) only implements `/api/healthz`. Not connected to novacast at all. |

Firebase Hosting (`firebase.json`, `.firebaserc`, `novacast-26e4c` project)
is genuinely used — it's the deploy target — but that's independent of
whether Firestore (the database product, not Hosting) is in use, and today
it isn't.

`firestore.rules` currently allows public read on `waters`/`adminWaters` and
denies all writes, and denies **both read and write** on `customLakes`
outright. Even if `App.tsx` were switched to the Firestore layer tomorrow,
custom lakes would be unreadable and admin deletes would fail by design —
the code in `services/database/admin.ts` deliberately lets that
permission-denied error surface rather than faking success, per its own
comment, "until real Firebase Auth exists."

**Why this matters:** three backend technologies are represented in the
repository, CI provisions secrets for two of them (Supabase and Firebase —
see the workflow's `Create production env file` step), and only one is
load-bearing. A reader (human or agent) who doesn't check `App.tsx`'s
imports directly could easily believe the app is on Firestore already. See
`DECISIONS.md` ADR-003 and `TECH_DEBT.md` for the path forward.

### 3.1 Supabase schema (as actually queried by `App.tsx`)

Three tables, matching the pre-migration schema documented in the archived
`DATABASE_MAP.md` — `App.tsx`'s queries are byte-for-byte the same shape:

- `water_bodies` — curated spots (`key`, `name`, `location`, `region`,
  `type`, `species[]`, `tags jsonb`, `latitude`/`longitude`, `spots jsonb`,
  `special_regs`)
- `custom_lakes` — user-added spots (`name`, `location`, `type`, `notes`) —
  `App.tsx` reads this table with no auth call anywhere in the app, so RLS
  policies requiring `auth.uid()` (per the archived audit) would make this
  perpetually empty unless the Supabase project's RLS was loosened since
  that audit. Not independently re-verified against the live Supabase
  project from this repository (no credentials available to this audit).
- `admin_lakes` — admin-panel-managed spots, deletable via the `#admin` UI

### 3.2 Firestore schema (built, unused)

Collections referenced by `src/services/database/*.ts`: `waters`,
`adminWaters`, `customLakes`. Coordinates are stored as a Firestore
`GeoPoint` rather than flat lat/lng fields specifically to leave room for
future geospatial queries (see the doc comment in `waters.ts`) — a
deliberate schema choice for where this layer is headed, not a 1:1 port of
the Supabase table.

## 4. Authentication

There is no authentication anywhere in the live app. `custom_lakes` reads
happen unauthenticated. The `#admin` panel is a single hardcoded client-side
password string (`castmaster2025` in `App.tsx`) — visible in the shipped
bundle to anyone who opens devtools, and not backed by any server-side
check. Treat it as a UX speed bump, not access control (see
`PRODUCT_PRINCIPLES.md` #7).

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
  scoped to novacast, writes `.env.production` from GitHub Secrets covering
  both Supabase and Firebase config plus the OpenWeatherMap key, builds, and
  deploys via `FirebaseExtended/action-hosting-deploy` to the
  `novacast-26e4c` Firebase Hosting site.
- No CI step runs tests, lint, or typecheck before deploy — a build that
  passes `vite build` (which does not type-check by default) can ship
  broken types straight to production. See `TECH_DEBT.md`.
- `artifacts/api-server` and `lib/db` are typecheck-only in CI's `pnpm run
  typecheck` (via the root script's `--filter "./artifacts/**"`); nothing
  deploys or runs them outside local dev (`.claude/launch.json` has a launch
  config for it on port 8081, for local use only).

## 7. Known architectural inconsistencies (see `TECH_DEBT.md` for the full list)

1. Firestore data layer built and unused while Supabase is live (§3).
2. Two independent conditions-input UIs with drifting option sets
   (`NovaCastWizard.jsx` vs `ConditionsPanel.tsx`).
3. Two independent "find water nearby" implementations (Discovery's Overpass
   flow vs the Wizard's curated-database GPS flow).
4. Two independent reference/field-guide UIs (`NovaCastReference.tsx` "Learn"
   tab vs `NovaCastTacklebox.tsx`'s internal "Guide" view).
5. `lib/db` + `artifacts/api-server` + `lib/api-spec`/`api-zod`/
   `api-client-react` form a complete, unbuilt "proper backend" scaffold
   (Postgres, Drizzle, Express, OpenAPI codegen) that has no callers and no
   schema — a second competing direction to the Supabase/Firestore client-
   direct model, not yet reconciled with it.
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
