# NovaCast — Product Principles

These are the working rules that turn `VISION.md` into day-to-day product and
engineering decisions. Where a principle conflicts with a shortcut, the
principle wins unless a `DECISIONS.md` entry explicitly overrides it.

## 1. Water first, conditions second

The water body is the anchor. Conditions (time of day, sky, water clarity,
temperature, wind, pressure) are inputs to a recommendation *for* that water,
not the entry point of the app. Any new flow should ask "where" before it
asks "what conditions."

## 2. One flow, not two

NovaCast currently has two independent ways to answer "what are the
conditions and what should I use": the sequential `NovaCastWizard.jsx` flow
and the collapsible `ConditionsPanel.tsx` inside the Lake Workspace, with two
different, drifting option lists (e.g. `smallmouth` vs `trout` as a fish
target — see `TECH_DEBT.md`). New condition inputs must be added to a single
shared source of options, not copy-pasted into a second UI.

## 3. Recommendations are pure functions

`data/recommendations.ts` takes conditions in and returns lures/colors/spots
out with no knowledge of Firestore or React. Keep it that way. Backend and
UI changes should never require touching the scoring logic, and
scoring-logic changes should never require touching a backend client.

## 4. The data layer is an implementation detail

Components import water/lake data through one seam
(`src/services/database/index.ts` — `App.tsx` does this end to end as of
`DECISIONS.md` ADR-008), never reaching into `firebase/firestore` directly
from a screen component. This is what makes a future backend swap possible
without a UI rewrite — which is exactly what let the Supabase-to-Firestore
cutover happen without changing any component's public interface.

## 5. No dead parallel infrastructure

Don't leave two implementations of the same capability half-built side by
side. This happened once already: a complete Firestore data-access layer
sat unused for months while Supabase remained the only thing `App.tsx`
actually called (`DECISIONS.md` ADR-003/ADR-008). When a migration starts,
finish it — cut over the callers, delete the old path, and update the docs
in the same pass — before starting the next one. A half-migrated system is
worse than the system it was replacing, because it hides which copy is
authoritative. The `lib/db`/`artifacts/api-server` Postgres/Drizzle scaffold
is the current instance of this risk — it has no callers and its future
(build it out, or remove it) is still undecided (`ROADMAP.md`).

## 6. Secrets never enter source

API keys and passwords are environment variables read via
`import.meta.env.VITE_*`, injected at build/deploy time, never literals in a
`.tsx`/`.jsx` file. This already happened once (hardcoded OpenWeatherMap key)
and was fixed twice in two different files because the fix wasn't applied
everywhere the pattern was copied — check all copies when fixing this class
of bug.

## 7. Client-side gates are not security

A hardcoded password compared in client-side JavaScript is a UX speed bump,
not an access control — the `#admin` panel had exactly this problem until
`DECISIONS.md` ADR-009 moved the check into a Cloud Function backed by a
Secret Manager value and a Firebase Auth custom claim enforced in
`firestore.rules`. Keep this pattern for anything else that needs real
authorization: check server-side, gate the actual data layer (Firestore
rules, not just the UI), never trust a client-side comparison alone.

## 8. Region-specific content is data, not code

STL-area regions, lake names, and species lists live in database rows and
`REGION_LABELS`-style maps, not in branching logic. Expanding to a new
region should mean adding data, not adding `if` statements.

## 9. Docs are canonical, not historical fiction

A doc that no longer matches the code is worse than no doc. When an
implementation changes in a way that invalidates `ARCHITECTURE.md`,
`DATABASE_MAP.md`, or similar, update the doc in the same change — or, if
that's not practical yet, mark the doc archived/stale explicitly (as done
with `CURRENT_ARCHITECTURE.md` and `DATABASE_MAP.md` in this audit) rather
than let it silently rot.

## 10. Small, reversible steps over big rewrites

Prefer a focused commit that fixes one thing (a duplicated formula, a
hardcoded secret, a stale doc) over a sweeping rewrite that touches
everything at once and can't be reviewed or reverted cleanly. This mirrors
how this repository's own audit work should proceed, and how future agents
should work in it.
