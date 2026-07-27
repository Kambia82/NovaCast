# NovaCast — Roadmap

Committed work vs. speculative ideas are kept in separate sections on
purpose. Nothing in "Future Ideas" is promised; everything in "Immediate" is
grounded in a verified, current gap.

## Immediate (fix what's broken or misleading)

- [ ] Reconcile the three backend implementations (Supabase live, Firestore
  built-but-unused, Postgres/Drizzle unbuilt) — see `DECISIONS.md` ADR-003
  and `TECH_DEBT.md` #1. Either finish the Firestore cutover or remove the
  unused layer; don't leave both.
- [ ] Add missing PWA icons (`icon-192.png`, `icon-512.png`) referenced by
  `artifacts/novacast/public/manifest.json` but absent from `public/`.
- [ ] Add a typecheck (and, once one exists, test) gate to
  `.github/workflows/firebase-hosting.yml` before deploy — today `vite
  build` ships without type-checking the app first.
- [ ] Resolve the pre-existing `NovaCastReference.tsx` implicit-`any` errors
  and the untyped `NovaCastWizard.jsx` import, surfaced by `pnpm --filter
  novacast run typecheck` during this audit.

## Short-term (consolidate duplicated logic)

- [ ] Merge the two conditions-input UIs (`NovaCastWizard.jsx`'s step-by-step
  flow and `ConditionsPanel.tsx`'s pill groups) onto one shared options
  source, so `fish`/`reel`/etc. option lists can't drift again.
- [ ] Decide whether Discovery's Overpass "Find Near Me" (raw OSM results) or
  the Wizard's curated-database GPS flow is the canonical "water near me" —
  per `REFACTOR_RECOMMENDATIONS.md`'s original recommendation, prefer the
  curated flow and keep Overpass only as an explicit "search beyond our
  database" fallback, if kept at all.
- [ ] Fold `NovaCastTacklebox.tsx`'s internal "Guide" view (reels/knots/bait/
  water-reading) into the "Learn" tab (`NovaCastReference.tsx`) so there is
  one field-guide surface, not two.
- [ ] Convert `NovaCastWizard.jsx` to TypeScript (still plain JS/JSX; every
  prop is implicitly `any`).

## Medium-term (finish the platform foundation)

- [ ] Pick one persistence backend and finish the migration end to end:
  schema, security rules, data-access layer, and every caller in the UI.
  (See ADR-003.) Whichever is chosen, `custom_lakes`/`customLakes` needs a
  real auth story (even lightweight anonymous auth) — right now it's
  unreachable in both Supabase (per the archived RLS audit) and Firestore
  (rules deny it outright).
- [ ] Replace the client-side `#admin` password with a real server-side
  check — `artifacts/api-server` already exists as a place to put this if
  the Postgres/Drizzle direction is chosen instead of a Firebase Cloud
  Function.
- [ ] Build the Trip Planning tab from `DESIGN_PROPOSAL.md` (date picker,
  seasonal recommendation via `getGeneralBestRecommendation(month)`,
  pre-trip gear checklist) — the only Lake Workspace tab from that proposal
  not yet started.
- [ ] Extend the region/water-body data model beyond the STL area, per
  `VISION.md`'s "every body of water" pillar — this should be additive data,
  not new branching logic (`PRODUCT_PRINCIPLES.md` #8).
- [ ] Add an automated test suite — none exists today for any package.

## Long-term

- [ ] Multi-Angler support (Phase 1: single-device, multiple angler profiles
  sharing one session) from `DESIGN_PROPOSAL.md`.
- [ ] Named user accounts with cross-device sync for tacklebox/memories
  (currently `localStorage`-only, single device).
- [ ] Offline mode / service-worker caching of water body data for
  in-the-field use with no signal.
- [ ] Decide the fate of `artifacts/api-server` + `lib/db` +
  `lib/api-spec`/`api-zod`/`api-client-react`: either build them into the
  real backend for admin/auth/future server-side features, or remove the
  scaffold if the product stays client-direct-to-BaaS long term.

## Future ideas (speculative — not committed)

- **Live bait alongside artificial lures.** Captured in
  `attached_assets/Pasted-Love-this-vision...txt`: a brainstorm on
  integrating live-bait recommendations (minnows, nightcrawlers, crawfish)
  next to the existing lure engine without overwhelming a beginner — e.g. a
  unified "what do I put on my hook" results list, a Tackle Box/Bait Shop
  toggle, or a "stepping stone" beginner-to-advanced progression. No
  direction has been chosen; this needs a product decision before any code.
- Voice guidance mode (per `VISION.md`, explicitly secondary/optional —
  should not be started before the visual platform's foundation — Discover/
  Understand/Recommend/Log — is solid).
- Push notifications for weather/condition changes at saved/starred lakes.
- Embedded map UI (today, coordinates only produce Google Maps deep links —
  no in-app map).
- Multi-device "shared trip" sessions (Phase 2 of Multi-Angler).
