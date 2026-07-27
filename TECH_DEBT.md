# NovaCast — Technical Debt

Every item below was verified by reading the referenced file(s) directly.
Ordered roughly by impact, not by ease of fix. See `ROADMAP.md` for when
each is scheduled and `DECISIONS.md` for ADRs on the ones already acted on.

## P0 — Architectural ambiguity / real risk

### 1. Three parallel backend implementations, one actually used — **resolved in this audit**
`src/lib/supabase.ts` used to be what `App.tsx` called for every
read/write, alongside a complete-but-unwired Firestore layer. Firebase was
declared the canonical backend; `App.tsx` now calls Firestore exclusively
and Supabase has been deleted from the repository (`DECISIONS.md` ADR-008).
The unbuilt Postgres+Drizzle+Express scaffold (`lib/db`,
`artifacts/api-server`) remains, unrelated to the Firebase stack — see
`ARCHITECTURE.md` §7 item 5 for its open status. Listed here for the
historical record; the Supabase/Firestore ambiguity itself is no longer
outstanding.

### 1a. Firestore data seeding is unverified — **open blocker**
This audit had no Firebase CLI or project credentials available, so whether
the live `novacast-26e4c` project's `waters`/`adminWaters` Firestore
collections actually contain the curated lake data (previously in
Supabase's `water_bodies`/`admin_lakes` tables) could not be checked. If
they're empty, the app will show zero water bodies after this cutover
deploys. **Action needed from someone with project access:** check the
Firestore console, and if empty, migrate/import the data before or
immediately after this deploys. See `DECISIONS.md` ADR-008.

### 1b. `functions/` is unverified against a live project — **open blocker**
The `claimAdmin` Cloud Function (`functions/src/index.ts`) typechecks
cleanly but has never been deployed or exercised against a real Firebase
project from this environment. Before the admin panel works in production:
run `firebase functions:secrets:set ADMIN_PASSWORD` once, then
`firebase deploy --only functions`. See `DECISIONS.md` ADR-009.

### 2. `~5,800 lines` of unused shadcn/ui scaffolding
`src/components/ui/` (54 files), `src/hooks/use-toast.ts`, and
`src/pages/not-found.tsx` have no callers anywhere in the live app —
verified by grep against every real entry point. Leftover from the original
shadcn/Replit starter template; NovaCast's actual screens are hand-built
Tailwind. See `ARCHITECTURE.md` §7 item 8.

### 3. `custom_lakes`/`customLakes` — reads fixed, writes still have no feature
Per the archived `DATABASE_MAP.md`, Supabase RLS on `custom_lakes` required
`auth.uid()`, which the app never established, so it was permanently empty.
Firestore rules now allow `customLakes` reads for any authenticated
(including anonymous) session (`DECISIONS.md` ADR-008) — the first time
this collection has been readable in either backend. **Writes remain
unbuilt**: `App.tsx` still has no "add a custom lake" UI or handler at all
(confirmed by reading the full file — `adminForm`-style state doesn't even
exist for this feature), so the collection has no writer regardless of
rules. Building that UI + an ownership-scoped rule (`resource.data.userId
== request.auth.uid`) is tracked in `ROADMAP.md`.

### 4. No CI typecheck gate before deploy — **fixed in this audit**
`.github/workflows/firebase-hosting.yml` used to run `pnpm build` inside
`artifacts/novacast` (`vite build` only, no `tsc`) with nothing catching
type errors before they shipped. A "Typecheck" step now runs
`pnpm run typecheck` before the build step, and the pre-existing errors
that would have made this gate immediately fail have been fixed (see #13).
No test suite exists to gate on yet — that's still open.

## P1 — Duplicated logic that will drift

### 5. Two independent conditions-input UIs with different option sets
`NovaCastWizard.jsx`'s `FISH_OPTIONS` includes `smallmouth` but not `trout`;
`ConditionsPanel.tsx`'s `PILL_GROUPS` fish list includes `trout` but not
`smallmouth`. Same pattern likely applies to other option groups — these
were never reconciled when `ConditionsPanel.tsx` was built as the
Workspace's condensed alternative to the Wizard.

### 6. Two independent "find water nearby" implementations
Discovery's `startWithGPS`/`searchByZip` (Overpass API, raw unnamed OSM
water bodies) vs. the Wizard's GPS flow (curated `waterBodies`/`adminLakes`
props). Flagged in the archived `CURRENT_ARCHITECTURE.md` §4 as a pre-
migration issue; it survived the migration essentially unchanged, just moved
from Welcome-vs-Wizard to Discovery-vs-Wizard.

### 7. Two independent field-guide / reference UIs
`NovaCastReference.tsx` (wired as the Workspace's "Learn" tab) and
`NovaCastTacklebox.tsx`'s internal `DualView`/`GuideTab` ('reels', 'knots',
'bait', 'water') both present reels/knots/species reference content,
independently written, in the same running app.

### 8. Haversine distance formula — **fixed in this audit**
Was implemented three times independently (`App.tsx` ×2, `NovaCastWizard.jsx`
×1). Consolidated into `src/lib/geo.ts` — see `DECISIONS.md` ADR-005. Listed
here for the historical record; no longer outstanding.

## P2 — Known, deliberately deferred

### 9. Hardcoded admin password — **fixed in this audit**
`App.tsx` used to compare `adminPw` against a literal `'castmaster2025'`
string client-side, with no server-side backing at all. Replaced with a
`claimAdmin` Cloud Function that checks the password server-side (Secret
Manager) and grants a Firebase Auth custom claim that `firestore.rules`
enforces (`DECISIONS.md` ADR-009, supersedes ADR-007). **Not yet verified
against a live project** — see #1b above; the code path is real but
undeployed.

### 10. OpenWeatherMap key was hardcoded twice, fixed once, now fixed in both
`App.tsx`'s copy was fixed to read `VITE_OPENWEATHER_API_KEY` in commit
`a45563b`. `NovaCastWizard.jsx`'s independent copy of the same weather
auto-fill logic still had the literal key
(`9e751a40a370416832496e123e1098cc`) hardcoded until this audit fixed it
(`DECISIONS.md` ADR-006). The key's value is still present in git history;
rotating it in the OpenWeatherMap dashboard is an infra action outside this
repository's scope, worth doing given it was exposed in public source.

### 11. CI printed secret metadata to logs — **fixed in this audit**
`.github/workflows/firebase-hosting.yml` had a step (added in `0e5335a`)
that echoed the OpenWeatherMap secret's length and last 4 characters to
build logs, titled "temporary, remove after diagnosing" by its own author
and never removed until this audit. Removed — see `DECISIONS.md` ADR-006.

## P3 — Smaller / cosmetic

### 12. Missing PWA icons
`artifacts/novacast/public/manifest.json` references `/icon-192.png` and
`/icon-512.png`; neither file exists in `public/` (only `favicon.svg`,
`manifest.json`, `robots.txt`, `sw.js` are present).

### 13. Pre-existing TypeScript errors — **fixed in this audit**
`pnpm --filter novacast run typecheck` used to fail with implicit-`any`
errors in `NovaCastReference.tsx` (untyped destructured params, untyped
object-index lookups) and a warning that `NovaCastWizard.jsx` has no type
declarations. Fixed: typed `NovaCastReference.tsx`'s component/prop
signatures (including a generic `TabBar<T>` and `as const` tab arrays so
inference works), and added `NovaCastWizard.d.ts` — an ambient module
declaration typing the Wizard's one call site in `App.tsx` — as a lighter
alternative to the full `.jsx` → `.tsx` conversion, which is still tracked
separately in `ROADMAP.md` since the file's internals remain untyped, only
its import boundary. `pnpm run typecheck` (all 10 workspace packages) is
now clean, which is what made the CI typecheck gate (#4) safe to add.

### 14. Tailwind version split
The workspace `catalog:` pins Tailwind v4.1.14, but
`artifacts/novacast/package.json` pins `tailwindcss: ^3.4.19` directly,
overriding the catalog. This is intentional (see `DECISIONS.md` ADR-001 and
`REFACTOR_RECOMMENDATIONS.md`'s warning not to upgrade without testing the
v3→v4 `@tailwind` directive changes), not something to "fix" by aligning it
to the catalog without a deliberate, tested migration.

### 15. `replit.md` was an unfilled template — **fixed in this audit**
Previously still contained its placeholder instructions (`_Replace the
heading above..._`, `_Populate as you build..._`) rather than real project
content. Filled in with real content and pointers to `VISION.md`/
`ARCHITECTURE.md`/`AGENTS.md`/`CONTRIBUTING.md` in this audit. Listed here
for the historical record; no longer outstanding.
