# NovaCast — Technical Debt

Every item below was verified by reading the referenced file(s) directly.
Ordered roughly by impact, not by ease of fix. See `ROADMAP.md` for when
each is scheduled and `DECISIONS.md` for ADRs on the ones already acted on.

## P0 — Architectural ambiguity / real risk

### 1. Three parallel backend implementations, one actually used
`src/lib/supabase.ts` is what `App.tsx` calls for every read/write. A
complete, separate Firestore data-access layer
(`src/services/database/{waters,customLakes,admin,shared}.ts`,
`src/lib/firebase.ts`, `firestore.rules`) exists with zero callers. A third,
unbuilt Postgres+Drizzle+Express scaffold (`lib/db`, `artifacts/api-server`)
has an empty schema and one health-check route. See `ARCHITECTURE.md` §3 and
`DECISIONS.md` ADR-003. **Risk:** anyone reading only the Firestore layer or
only `firestore.rules` will misjudge what the live app actually does.

### 2. `~5,800 lines` of unused shadcn/ui scaffolding
`src/components/ui/` (54 files), `src/hooks/use-toast.ts`, and
`src/pages/not-found.tsx` have no callers anywhere in the live app —
verified by grep against every real entry point. Leftover from the original
shadcn/Replit starter template; NovaCast's actual screens are hand-built
Tailwind. See `ARCHITECTURE.md` §7 item 8.

### 3. `custom_lakes`/`customLakes` is unreachable in both backends
Per the archived `DATABASE_MAP.md`, Supabase RLS on `custom_lakes` requires
`auth.uid()`, and the app never calls any Supabase auth method. Per
`firestore.rules`, `customLakes` denies both read and write outright. The
custom-lake feature (add your own spot) has had no working backend path
through either migration.

### 4. No CI typecheck/test gate before deploy
`.github/workflows/firebase-hosting.yml` runs `pnpm build` inside
`artifacts/novacast`, which is `vite build` only (verified in
`package.json`) — no `tsc`, no tests. A type error can ship straight to
Firebase Hosting. No test suite exists to gate on yet either (verified: no
`*.test.*`/`*.spec.*` files, no test runner in any `package.json`).

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

### 9. Hardcoded admin password
`App.tsx`: `if (adminPw === 'castmaster2025')`. Client-side only, visible in
the shipped bundle, no server-side backing. Not fixed with an env-var swap
in this audit because no `VITE_ADMIN_PASSWORD` secret is provisioned in CI
and doing so with no fallback would silently disable the admin panel in
every deployed build — see `DECISIONS.md` ADR-007. Real fix is a
server-side check (candidate home: `artifacts/api-server`), tracked in
`ROADMAP.md`.

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

### 13. Pre-existing TypeScript errors
`pnpm --filter novacast run typecheck` currently fails with implicit-`any`
errors in `NovaCastReference.tsx` (untyped destructured params, untyped
object-index lookups) and a warning that `NovaCastWizard.jsx` has no type
declarations (it's still `.jsx`, not `.tsx` — `REFACTOR_RECOMMENDATIONS.md`
1-A recommended converting it; never done). None of these are related to
changes made in this audit — verified by running typecheck before and after.

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
