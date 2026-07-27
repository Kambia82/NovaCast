# NovaCast — Agent Responsibilities

This defines scope for AI agents (or humans acting in these roles) working in
this repository. Every agent should read `VISION.md`, `PRODUCT_PRINCIPLES.md`,
and `ARCHITECTURE.md` before making changes, and record any non-trivial
architectural choice in `DECISIONS.md`.

## Architect

**Scope:** Whole-repository coherence. Owns `ARCHITECTURE.md`,
`DECISIONS.md`, `TECH_DEBT.md`, `ROADMAP.md`. Firebase is the decided
canonical backend (ADR-008) — this agent's job now is verifying that
decision is fully executed (Firestore data actually seeded, `functions/`
actually deployed — both open per `TECH_DEBT.md` #1a/#1b) and deciding the
fate of the still-unrelated `lib/db`/`artifacts/api-server` Postgres/Drizzle
scaffold. Reviews changes that cross package boundaries.

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

**Scope:** `functions/` (Cloud Functions — the real backend-logic layer per
ADR-009) is the primary home for new server-side work. `artifacts/api-server/`,
`lib/db/`, `lib/api-spec/`, `lib/api-zod/`, `lib/api-client-react/` are a
separate, still-unbuilt Postgres/Drizzle/Express scaffold (health-check
endpoint only, empty schema) with no callers and no confirmed future — don't
build it out without an Architect-level decision that Cloud Functions can't
cover the need.

**Out of scope:** Adding schema/endpoints to the Postgres/Drizzle scaffold
"just in case" without a concrete caller and an Architect decision that it's
needed alongside `functions/`.

## Firebase

**Scope:** `firebase.json`, `.firebaserc`, `firestore.rules`,
`firestore.indexes.json`, `src/lib/firebase.ts`,
`src/services/database/*.ts`, `functions/`, the Firebase Hosting deploy step
in `.github/workflows/firebase-hosting.yml`. Firebase is canonical (ADR-008)
— this agent owns keeping Firestore rules/schema, Firebase Auth, and Cloud
Functions consistent with what `App.tsx` actually calls, and owns the two
open verification items in `TECH_DEBT.md` (#1a: is `waters`/`adminWaters`
actually seeded; #1b: is `functions/` actually deployed) as soon as project
credentials are available to whoever picks this up. Also owns building out
Firebase Storage when a feature needs file uploads (none does yet).

**Out of scope:** Reintroducing Supabase or any other BaaS without a new
ADR explicitly superseding ADR-008.

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
or integration tests. A CI typecheck gate is now in place
(`.github/workflows/firebase-hosting.yml`); owns adding a real test gate
alongside it once a suite exists.

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
recommendation engine and Firestore queries.

**Out of scope:** Premature optimization of `data/recommendations.ts` — it's
already pure and fast; the actual cost centers are network calls (Overpass,
Nominatim, OpenWeatherMap) and bundle size, not scoring logic.
