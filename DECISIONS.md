# NovaCast — Architectural Decisions

ADR format: Context / Decision / Consequences. Numbered sequentially; never
renumbered or deleted — superseded ADRs are marked as such, not removed.

---

## ADR-001: pnpm workspace monorepo

**Context.** The project needed to house a deployed app, a design sandbox, an
API-server prototype, and shared/generated packages (DB schema, OpenAPI
client) without duplicating dependency management.

**Decision.** Adopt a pnpm workspace (`pnpm-workspace.yaml`) with packages
under `artifacts/*`, `lib/*`, `lib/integrations/*`, `scripts`. Root
`preinstall` script hard-fails on non-pnpm package managers to keep the
lockfile single-sourced.

**Consequences.** One lockfile, one `catalog:` version pin per shared
dependency (React, Vite, Tailwind, etc.) reduces version drift across
packages — except where a package deliberately overrides the catalog (see
`artifacts/novacast/package.json` pinning Tailwind v3 against the workspace
catalog's v4; that override is intentional, not a bug, per
`REFACTOR_RECOMMENDATIONS.md`'s note not to upgrade Tailwind without
testing the v4 directive changes). New packages must live under one of the
declared workspace globs or `pnpm install` won't pick them up.

---

## ADR-002: Lake Workspace as the primary navigation model

**Context.** The original app (documented in the now-archived
`CURRENT_ARCHITECTURE.md`) picked the lake last, in wizard step 6 of 6, and
treated the result screen as ephemeral. `DESIGN_PROPOSAL.md` (2026-06-15)
proposed flipping this: pick the water first, then treat everything else
(conditions, recommendations, tacklebox, reference) as tabs anchored to that
selection.

**Decision.** Adopt the lake-first, tabbed-workspace model. Implemented in
`artifacts/novacast/src/App.tsx` as `view: 'discovery' | 'wizard' |
'workspace'` with `activeTab: 'recommendations' | 'learn' | 'tacklebox'`.

**Consequences.** This is now the load-bearing navigation shape — new
features should add tabs or extend the Discovery flow, not introduce a
parallel top-level view. Two tabs from the original proposal (Trip Planning,
Multi-Angler) were never built; see `ROADMAP.md`. The proposal's
recommendation to remove the Overpass "any OSM water body" GPS flow from the
entry screen was **not** carried out — Discovery still has its own Overpass
implementation, separate from the Wizard's curated-database GPS flow (see
ADR-003's sibling issue in `TECH_DEBT.md` #3 for the parallel case in data
backends).

---

## ADR-003: Firestore migration started, not completed — Supabase remains live

**Context.** Commits `4bb19ad` ("feat: add Firestore scaffolding for
novacast (additive)") and `81676fd` ("refactor: split data access layer by
domain, rename Firestore collections") added a full Firestore client
(`src/lib/firebase.ts`), a data-access layer
(`src/services/database/{waters,customLakes,admin,shared}.ts`), and Firebase
project config (`firestore.rules`, `firestore.indexes.json`, `.firebaserc`).
`App.tsx`, however, still imports and calls `src/lib/supabase.ts` directly
for every read (`loadWaterBodies`, `loadCustomLakes`, `loadAdminLakes`) and
write (`deleteAdminLake`) — verified by reading `App.tsx`'s imports and
function bodies. The Firestore layer has zero callers in the shipped app.

**Decision (as found, not yet re-decided).** No final decision has been made
between Supabase and Firestore — the repository currently contains both,
with Supabase as the de facto live choice by default (because it's the one
nothing has cut over from) and Firestore as a fully-built but unreachable
alternative. This ADR exists to make that ambiguity explicit and recorded,
not to resolve it — resolving it is a product/infra call for whoever owns
the Firebase/Supabase billing and project, tracked as an Immediate item in
`ROADMAP.md`.

**Consequences.** Until resolved: (1) any change to water/lake data shape
must be applied to *both* `src/lib/supabase.ts` callers and the parallel
Firestore layer to avoid the two drifting further apart; (2) CI provisions
secrets for both backends (`VITE_SUPABASE_*` and `VITE_FIREBASE_*` in
`.github/workflows/firebase-hosting.yml`), which is safe but wasteful; (3) a
future agent reading only `services/database/` or only `firestore.rules`
would incorrectly conclude the app runs on Firestore — this doc and
`ARCHITECTURE.md` §3 are the correction.

---

## ADR-004 (this audit): Archive stale root docs instead of rewriting or deleting them

**Context.** `CURRENT_ARCHITECTURE.md` and `DATABASE_MAP.md` accurately
described the pre-migration `.migration-backup/` codebase but no longer
describe `artifacts/novacast/` — they predate the Lake Workspace redesign and
the Firestore scaffolding. Each also had a byte-identical duplicate file
sitting next to it in the repo root.

**Decision.** Delete the exact-duplicate copies (`CURRENT_ARCHITECTURE
(copy).md`, `CURRENT_ARCHITECTURE (copy) 1.md`, `DATABASE_MAP (copy).md`);
keep the originals but prepend an explicit "ARCHIVED" banner pointing to the
new `ARCHITECTURE.md`, rather than rewriting their content in place or
deleting them outright.

**Consequences.** The pre-migration audit remains available as a historical
reference (useful for understanding what changed and why), while a reader
landing on either file first is immediately redirected to the current,
accurate doc. `ARCHITECTURE.md` is now the single canonical description of
the live system.

---

## ADR-005 (this audit): Extract shared haversine distance calculation

**Context.** The same haversine distance formula was implemented
independently three times: twice inline inside `App.tsx` (`startWithGPS` and
`searchByZip` each defined their own `calcDist`/`toRad`), and again inside
`NovaCastWizard.jsx` as `calcDistance`/`formatDist`. This is flagged in the
archived `CURRENT_ARCHITECTURE.md` §5 and `REFACTOR_RECOMMENDATIONS.md`
1-E as pre-existing debt that survived the Lake Workspace migration.

**Decision.** Extract `calcDistance`/`formatDist` into
`artifacts/novacast/src/lib/geo.ts` and import it from all three call sites.
No behavior change.

**Consequences.** One implementation to maintain; verified via `pnpm
--filter novacast run typecheck` to introduce no new type errors (remaining
errors are pre-existing and unrelated — see `TECH_DEBT.md`).

---

## ADR-006 (this audit): Fix live hardcoded secret and CI secret-debug step

**Context.** `NovaCastWizard.jsx` had its own copy of the OpenWeatherMap
weather auto-fill call with the API key hardcoded in source
(`appid=9e751a40a370416832496e123e1098cc`). `App.tsx`'s copy of the same
logic had already been fixed (commit `a45563b`, "fix: move OpenWeatherMap
API key out of client source into env var") to read
`VITE_OPENWEATHER_API_KEY` — but the fix was applied to only one of the two
duplicate implementations, missing the Wizard's copy. Separately, the CI
workflow (`.github/workflows/firebase-hosting.yml`) contained a step titled
"Debug secret (temporary, remove after diagnosing)" that echoed the
OpenWeatherMap secret's length and last four characters to build logs — left
in place since the commit that added it (`0e5335a`).

**Decision.** Apply the same env-var fix to `NovaCastWizard.jsx`'s copy, and
remove the temporary debug step from the workflow now that its own commit
message marked it for removal.

**Consequences.** No more live secret in source control going forward
(history still contains the old key — rotating it is an infra action outside
this repository's scope, flagged in `TECH_DEBT.md`). CI no longer prints any
part of a secret to logs. This underscores `PRODUCT_PRINCIPLES.md` #6: when
fixing a hardcoded-secret bug, check every duplicate of the code that used
it, not just the first one found.

---

## ADR-007 (this audit): Defer fixing the hardcoded admin password

**Context.** `App.tsx`'s `#admin` panel gates on a hardcoded string
(`'castmaster2025'`) with no server-side backing. Moving it to an
environment variable (mirroring ADR-006's pattern) was considered.

**Decision.** Not changed in this audit. Unlike the OpenWeatherMap key, no
production `VITE_ADMIN_PASSWORD` secret is currently provisioned in CI
(verified: absent from `.github/workflows/firebase-hosting.yml`'s env file
step). Introducing an env-var read with no fallback would silently disable
the admin panel in every deployed build until someone adds the secret —
a functional regression, not a pure hygiene fix, and one this audit
shouldn't make unilaterally.

**Consequences.** The admin password remains in source, tracked as a
Medium-term roadmap item (`ROADMAP.md`) to replace with a real server-side
check rather than another client-side string. Until then, treat the panel
as having no real access control (`PRODUCT_PRINCIPLES.md` #7) and don't
expand what it's trusted to protect.
