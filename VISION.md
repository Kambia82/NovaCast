# NovaCast — Vision

## What NovaCast is

NovaCast helps anglers **discover, understand, and fish every body of water.**

The foundation is a complete water discovery platform: find a lake, river, or
pond; understand what's in it and how to fish it; get intelligent,
condition-aware recommendations; log what happened; and get better at the
sport over time. Mapping, logging, recommendations, and education are equal
citizens of the product — none of them is a bolt-on to the others.

## What NovaCast is not

NovaCast is not a voice assistant with a fishing app attached. **Voice
guidance is an optional mode, not the primary experience.** Every capability
in the product must work fully through the visual UI on its own. Voice, when
it exists, is a second way to reach the same underlying platform — never a
gate in front of it.

NovaCast is not a single-region hobby project forever. The current data set
is scoped to the St. Louis, Missouri area (see `REGION_LABELS` in
`artifacts/novacast/src/data/waterBodies.ts`), but the architecture — schema,
recommendation engine, UI — is expected to generalize to any water body
anywhere, not just STL. Region-specific content is data, not code.

## The four pillars

1. **Discover** — find water. Near me, by name, by zip/city, by region browse.
   A water body is a first-class object with an identity (`waterId`), not a
   transient search result.
2. **Understand** — know the water. Species present, known spots, special
   regulations, access points, and (eventually) the angler's own accumulated
   notes about that specific place.
3. **Recommend** — intelligent, condition-aware guidance: what to throw, what
   color, where to stand, informed by time of day, sky, water clarity,
   temperature, wind, barometric pressure, and recent weather trends. This is
   the existing `data/recommendations.ts` engine — a pure scoring function,
   deliberately decoupled from any specific backend or UI.
4. **Log & Learn** — a tacklebox of saved gear, a trip/memory log tied to real
   water bodies, and a reference library (reels, knots, species, lures) that
   teaches rather than just answers.

## Product shape

The lake (or river, or pond) is the anchor of the experience, not a
by-product of a linear form. A user picks their water first, then everything
else — conditions, recommendations, notes, gear, trip history — is organized
around that selection and persists across visits. This "lake workspace"
model (see `DESIGN_PROPOSAL.md` and `ARCHITECTURE.md`) is already partially
built in `artifacts/novacast/src/App.tsx` (`discovery` → `wizard`/GPS/zip →
`workspace` with Recommendations/Learn/Tacklebox tabs) and is the direction
all future UI work should extend, not replace.

## Architectural intent

The app should be **modular, scalable, maintainable, and AI-friendly**:

- Modular — the recommendation engine, the data-access layer, and the UI are
  separable concerns. A future agent (or human) should be able to swap the
  backend without touching `data/recommendations.ts`, and vice versa.
- Scalable — today's STL-only, three-table schema should generalize to many
  regions and many water bodies without a rewrite.
- Maintainable — one source of truth per concept. Duplicated constants,
  duplicated formulas, and duplicated UI flows (see `TECH_DEBT.md`) work
  against this and should be resolved as they're found, not accumulated.
- AI-friendly — code and docs should be legible to an AI agent working from
  this repository alone: clear naming, current documentation, and decisions
  recorded in `DECISIONS.md` rather than left implicit in commit history.

## Guardrail for future work

**Do not redesign the product vision to fit an implementation shortcut.** If
an architectural change is compelling (see `DECISIONS.md` for the bar this
must clear), make it — but the four pillars above, the lake-as-anchor shape,
and "voice is optional" stay fixed unless the user/product owner explicitly
changes them.
