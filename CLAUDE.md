# NovaCast — Working Notes for Claude

**Read `NOVACAST_BLUEPRINT.md` first.** It is the product source of truth (direction, architecture guardrails, feature roadmap, priority order). This file is the condensed version plus a live status snapshot — update the status section as work lands, but resolve any conflict in favor of the blueprint, not this summary.

## Non-negotiable guardrails

- Firebase/Firestore is the backend. **Never** reintroduce Supabase — no `@supabase/supabase-js`, no `supabase.from(...)` calls, no Supabase env vars, no Supabase tables as a fallback. (`lib/supabase.ts` is unused dead code left in place; do not build on it.)
- Don't redesign NovaCast into a new concept, collapse it back into a single-flow wizard, remove existing menus/flows, or migrate architecture — unless explicitly instructed.
- Don't force accounts, catch logging, or history on users. Every advanced capability (login, voice coach, catch log, tackle analytics) must stay optional; the "open app → find water → fish → leave" path must keep working with zero setup.
- Don't build a social/community feed. NovaCast answers "what should I do right now," not Fishbrain.
- Don't pre-decide monetization. No feature gating without real user data (see blueprint §21-23).

## Development workflow (blueprint §25)

For any non-trivial change: **(1) inspect** what already exists (implemented/partial/broken/missing, existing components/services/data) → **(2) diagnose** in plain language before touching code (what's broken, what already solves part of it, smallest fix, files involved) → **(3) implement only the approved scope** → **(4) verify** with typecheck/build/tests, and say plainly when something (GPS, maps, live Firebase, weather/GIS APIs) can only be confirmed on a real device/deployment, not from a clean build.

## Current status vs. blueprint priorities

- **Priority 1 (location/water discovery works)** — Code-complete, not yet device/live-verified. Fixed 2026-08-10 on `claude/novacast-location-diagnosis-qql77p`: `App.tsx` was still calling the legacy Supabase client for `waterBodies`/`adminLakes`/`customLakes` while the rest of the app had already moved to Firestore (`services/database/`) — that silent failure was the shared root cause behind Recon's "Couldn't reach map data," the Wizard Step 6 "No known spots in our database," and the missing St. Louis favorites list. Switched to the Firestore service layer; hardened Overpass/Nominatim calls in `NovaCastRecon.tsx` and `NovaCastWizard.jsx` with timeouts and real error surfacing instead of one generic message. **Still needed:** confirm on the live deployment that GPS prompts, nearby-water results, and map rendering actually work end to end.
- **Priority 2 (selected waterbody feeds lake info/weather/Game Plan/On the Bank)** — Not yet audited against the blueprint's fuller vision (lake snapshot, richer environmental model). Existing wiring (`getLocSpots`/`getLocSpecialRegs`/`getLocCoords`/`getLocSpecies` in `App.tsx`) predates this pass and should be re-checked, not assumed correct.
- **Priority 3 (Tackle Box / Catch Log / tutorial system actually work)** — Audited 2026-08-11. Findings:
  - Tackle Box save/persist (`App.tsx` + `NovaCastTacklebox.tsx`) — works correctly, no bug found. Gap vs. blueprint §12: no manual/custom tackle entry, only hearting recommended items.
  - Catch Log — does not exist anywhere in the codebase (not broken, just not built yet — blueprint §13 work).
  - Tutorial/reference system — two divergent implementations live side by side: `NovaCastReference.tsx` (via "Learn & Fun" tile) and a second, different Reels/Knots/Bait/Read-Water dataset inside `NovaCastTacklebox.tsx`'s own "Field Guide" tab (via "Tacklebox" tile). Both work, but give inconsistent instructions for the same topics (e.g. two different backlash write-ups). Not yet consolidated — worth doing before/alongside Priority 4's troubleshooting section, which should reuse the backlash content already in `NovaCastTacklebox.tsx` rather than writing a third version.
  - **Fixed:** the "Game Plan" home tile led to a dead-end pre-wizard screen (`renderLocationSearch` in `App.tsx`) whose "Find Near Me" button and city/zip input did nothing but discard input and jump to Wizard Step 0. Removed the stub; "Game Plan" now opens the wizard directly, where the real (already-working) location step lives at Step 6.
- **Priority 4 (Line Masterclass + troubleshooting)** — Line Masterclass **done** (`NovaCastReference.tsx`, `🧵 Line` tab). Troubleshooting section (backlash, snags, bottom fouling, line problems, stuck-in-cover) — **not started**.
- **Priority 5 (USGS 3DHP investigation)** — Not started. Test against Pressler + known-working + known-failing + small/unnamed water before touching the current OSM/Firestore water-discovery code.
- **Priority 6 (optional Firebase Auth)** — Not started.
- **Priority 7 (AI voice coach)** — Not started.
- **Priority 8 (paywall feedback collection)** — Not started.

## Key architecture pointers

- Data access layer: `artifacts/novacast/src/services/database/` (`waters.ts`, `admin.ts`, `customLakes.ts`, barrel at `index.ts`) — Firestore collections `waters`, `adminWaters`, `customLakes`. This is the only sanctioned way to read curated water data; don't call Firestore directly from components.
- Firebase client: `artifacts/novacast/src/lib/firebase.ts`.
- Location entry points: `NovaCastRecon.tsx` (GPS/Overpass + Nominatim manual search + Leaflet map), `NovaCastWizard.jsx` Step 6 (Game Plan "Where Are You Fishing?"), `App.tsx` (`startOnTheBank`, `startWithGPS`/`searchByZip` → wizard).
- Tutorial/reference system: `NovaCastReference.tsx` — single file, `TABS` array + matching data array + `*Tab()` render function per category. Add new categories this way, not a new component tree.
- Recommendation engine: `data/recommendations.ts` — pure functions, no DB queries.
