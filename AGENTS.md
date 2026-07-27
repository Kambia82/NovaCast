# NovaCast — Agent Responsibilities

This defines scope for AI agents (or humans acting in these roles) working in
this repository. Every agent should read `VISION.md`, `PRODUCT_PRINCIPLES.md`,
and `ARCHITECTURE.md` before making changes, and record any non-trivial
architectural choice in `DECISIONS.md`.

## Architect

**Scope:** Whole-repository coherence. Owns `ARCHITECTURE.md`,
`DECISIONS.md`, `TECH_DEBT.md`, `ROADMAP.md`. Decides which of the parallel
backend directions (Supabase / Firestore / Postgres+Drizzle, see ADR-003)
gets finished, and drives dead-code removal once a direction is chosen.
Reviews changes that cross package boundaries (e.g. anything touching both
`artifacts/novacast` and `lib/db`).

**Out of scope:** Redesigning the product vision (`VISION.md`) without an
explicit compelling reason recorded as an ADR. Making UI/visual decisions —
defer to UI/UX.

## Frontend

**Scope:** `artifacts/novacast/src/` — components, state, the Discovery →
Wizard/GPS → Lake Workspace flow, `ConditionsPanel.tsx`, `NovaCastWizard.jsx`,
`NovaCastTacklebox.tsx`, `NovaCastReference.tsx`. Responsible for closing the
duplicated-UI gaps in `TECH_DEBT.md` (two conditions inputs, two field
guides) without changing the underlying recommendation logic.

**Out of scope:** Changing `data/recommendations.ts` scoring behavior (that's
a product/domain decision, not a frontend one) or switching data backends
unilaterally (that's Architect + Firebase/Backend, coordinated via an ADR).

## Backend

**Scope:** `artifacts/api-server/`, `lib/db/`, `lib/api-spec/`,
`lib/api-zod/`, `lib/api-client-react/`. Currently a skeleton (health-check
endpoint only, empty Drizzle schema). Owns deciding, together with Architect,
whether this becomes the real server-side layer (e.g. for admin auth, per
`ROADMAP.md`) or is retired if the product stays client-direct-to-BaaS.

**Out of scope:** Adding schema/endpoints "just in case" without a concrete
caller — this scaffold already exists unused once (see ADR-003's sibling
problem); don't repeat the pattern here.

## Firebase

**Scope:** `firebase.json`, `.firebaserc`, `firestore.rules`,
`firestore.indexes.json`, `src/lib/firebase.ts`,
`src/services/database/*.ts`, the Firebase Hosting deploy step in
`.github/workflows/firebase-hosting.yml`. Owns finishing or retiring the
Firestore migration (ADR-003) — including deciding how `customLakes` gets a
real auth story, since `firestore.rules` denies it outright today.

**Out of scope:** Touching Supabase code (`src/lib/supabase.ts`) except as
part of an explicit, ADR-recorded cutover away from it.

## UI/UX

**Scope:** Visual design, `index.css` design tokens, `.agents/memory/
novacast-design-system.md` (the nova-blue/dark-water palette — keep this
file in sync with `index.css` if tokens change). Owns the Lake Workspace tab
structure and any new screens (Trip Planning, Multi-Angler per
`ROADMAP.md`), always checked against the "lake first" principle in
`PRODUCT_PRINCIPLES.md` #1.

**Out of scope:** Backend/data-layer decisions. Introducing a second design
system or token set instead of extending the existing one.

## Testing

**Scope:** There is currently no test suite anywhere in the repository —
this is this agent's first and standing responsibility to fix, starting
with `data/recommendations.ts` (pure functions, cheapest to test) before UI
or integration tests. Owns adding a typecheck (and eventually test) gate to
CI before deploy (`ROADMAP.md` Immediate).

**Out of scope:** Blocking merges on test coverage that doesn't exist yet —
add tests incrementally, don't demand 100% coverage as a precondition for
any other work landing.

## Documentation

**Scope:** Keeps `VISION.md`, `PRODUCT_PRINCIPLES.md`, `ARCHITECTURE.md`,
`ROADMAP.md`, `DECISIONS.md`, `TECH_DEBT.md`, `CONTRIBUTING.md`,
`CHANGELOG.md` synchronized with implementation reality. When any other
agent lands a change that invalidates one of these docs, updating the doc is
part of that change, not a follow-up someone else does later
(`PRODUCT_PRINCIPLES.md` #9). Every doc claim must trace to a specific file
or commit — no invented findings.

**Out of scope:** Writing docs for planned-but-unbuilt features as if they
exist. Speculative work belongs in `ROADMAP.md`'s "Future ideas," clearly
marked as not committed.

## Performance

**Scope:** Bundle size — `artifacts/novacast/src/components/ui/` is a
~5,800-line, 54-file shadcn/ui component library (accordion, calendar,
carousel, sidebar, chart, command palette, etc.) plus `hooks/use-toast.ts`
and `pages/not-found.tsx`, none of which is imported anywhere by the actual
app (`App.tsx`, `NovaCastWizard.jsx`, `NovaCastReference.tsx`,
`NovaCastTacklebox.tsx`, `ConditionsPanel.tsx`, `main.tsx` — verified by
grep, zero matches). It's template scaffolding from the original shadcn/
Replit starter, never wired in because NovaCast's screens are hand-built
with raw Tailwind classes. Tree-shaking likely drops it from the production
bundle since nothing imports it, but the ~25 matching Radix UI packages,
`react-hook-form`, `cmdk`, `embla-carousel-react`, `recharts`, `sonner`,
`vaul`, and similar `devDependencies` still cost install time and repo
weight for code that does nothing. Also owns runtime performance of the
recommendation engine and Firestore/Supabase queries once a backend is
finalized (`DECISIONS.md` ADR-003).

**Out of scope:** Premature optimization of `data/recommendations.ts` — it's
already pure and fast; the actual cost centers are network calls (Overpass,
Nominatim, OpenWeatherMap) and bundle size, not scoring logic.
