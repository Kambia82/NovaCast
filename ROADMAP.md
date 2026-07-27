# NovaCast — Roadmap

Committed work vs. speculative ideas are kept in separate sections on
purpose. Nothing in "Future Ideas" is promised; everything in "Immediate" is
grounded in a verified, current gap.

## Immediate (fix what's broken or misleading)

- [x] ~~Reconcile the three backend implementations~~ — done: Firebase
  declared canonical, `App.tsx` cut over to Firestore, Supabase removed
  entirely (`DECISIONS.md` ADR-008).
- [x] ~~Add a typecheck gate to CI before deploy~~ — done: `.github/workflows/
  firebase-hosting.yml` now runs `pnpm run typecheck` before `pnpm build`.
- [x] ~~Resolve the pre-existing `NovaCastReference.tsx` implicit-`any`
  errors~~ — done, plus a `NovaCastWizard.d.ts` ambient declaration for the
  Wizard's still-untyped `.jsx` (see Short-term below for the full
  conversion). `pnpm run typecheck` is clean across all 10 workspace
  packages.
- [ ] **Verify Firestore is actually seeded.** No Firebase CLI/credentials
  were available in the environment that did the Firestore cutover — it's
  unconfirmed whether `waters`/`adminWaters` in the live `novacast-26e4c`
  project contain the same curated lakes that were in Supabase's
  `water_bodies`/`admin_lakes`. **Check the Firestore console before/right
  after this deploys; migrate the data if it's missing.** See
  `DECISIONS.md` ADR-008, `TECH_DEBT.md` #1a.
- [ ] **Deploy `functions/`.** Run `firebase functions:secrets:set
  ADMIN_PASSWORD` once, then `firebase deploy --only functions`, before the
  admin panel's `claimAdmin` call will succeed in production. See
  `DECISIONS.md` ADR-009, `TECH_DEBT.md` #1b.
- [ ] Add missing PWA icons (`icon-192.png`, `icon-512.png`) referenced by
  `artifacts/novacast/public/manifest.json` but absent from `public/`.

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
- [ ] Convert `NovaCastWizard.jsx` to TypeScript (still plain JS/JSX; a
  `NovaCastWizard.d.ts` now types its import boundary, but the file's
  internals are still untyped).

## Medium-term (finish the platform foundation)

- [x] ~~Pick one persistence backend~~ — Firebase/Firestore, done
  (ADR-008). Remaining under this heading:
- [ ] Build a real "add a custom lake" UI + handler in `App.tsx`
  (`customLakes` reads now work via anonymous Firebase Auth, but nothing
  writes to the collection — see `TECH_DEBT.md` #3) with an
  ownership-scoped Firestore rule (`resource.data.userId ==
  request.auth.uid`) once it exists.
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
  `lib/api-spec`/`api-zod`/`api-client-react`: this Postgres/Drizzle/Express
  scaffold is not part of the Firebase-canonical stack (`functions/` is now
  the home for server-side logic per ADR-009) — either find it a real job
  Cloud Functions doesn't cover, or remove the scaffold.
- [ ] Remove or actually adopt `artifacts/novacast/src/components/ui/` (the
  unused shadcn scaffolding, `ARCHITECTURE.md` §7 item 8) — currently dead
  weight either way.

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
