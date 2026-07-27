# Contributing to NovaCast

Read `VISION.md` and `PRODUCT_PRINCIPLES.md` first if you're new — they
explain what NovaCast is trying to be, which matters more here than in a
typical CRUD app because the product's shape (lake-first, recommendations as
pure functions, voice as optional) is easy to accidentally erode one
convenient shortcut at a time.

## Setup

This is a **pnpm-only** monorepo — the root `preinstall` script hard-fails on
`npm`/`yarn`. From the repo root:

```
pnpm install
```

## Running things

```
pnpm --filter @workspace/novacast run dev       # the actual app, port 8080
pnpm --filter @workspace/api-server run dev     # health-check-only skeleton, port 8081
pnpm --filter @workspace/mockup-sandbox run dev # design/component sandbox, port 8082
```

`.claude/launch.json` has matching launch configs if your tooling reads it.

`artifacts/novacast` needs these env vars to talk to its live backend (see
`.env.production` construction in `.github/workflows/firebase-hosting.yml`
for the full list): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
`VITE_OPENWEATHER_API_KEY`. It also accepts `VITE_FIREBASE_*` vars for the
built-but-unwired Firestore layer (`ARCHITECTURE.md` §3) — these aren't
required for the app to run since nothing calls that layer yet.

## Checks before you push

```
pnpm run typecheck   # root + libs, then artifacts/** and scripts
pnpm run build       # typecheck, then build every workspace package
```

Note: CI does **not** run `typecheck` before deploying `novacast` today
(`TECH_DEBT.md` #4) — run it yourself locally regardless, don't rely on CI
to catch type errors.

There is no test suite yet (`TECH_DEBT.md` #4, `AGENTS.md` Testing). If
you're adding tests, `data/recommendations.ts` is the highest-value, lowest-
effort place to start — it's pure functions with no I/O.

## Conventions

- **TypeScript everywhere except `NovaCastWizard.jsx`.** That file is a known
  exception, not a precedent — new components should be `.tsx`.
- **Tailwind utility classes**, matching the existing hand-written style in
  `App.tsx`/`ConditionsPanel.tsx`/`NovaCastTacklebox.tsx`. Don't reach for
  `src/components/ui/` (the shadcn scaffolding) — it isn't wired into the
  app's build/import graph today and isn't the established pattern here; see
  `ARCHITECTURE.md` §7 item 8 before deciding to adopt it.
- **Design tokens** live in `index.css` as CSS custom properties, documented
  in `.agents/memory/novacast-design-system.md`. Update both together if you
  change a color.
- **Secrets are env vars**, read via `import.meta.env.VITE_*`, never
  literals in source (`PRODUCT_PRINCIPLES.md` #6). If you're fixing a
  hardcoded-secret bug, grep for other copies of the same logic before
  considering it fixed — this exact mistake happened once already
  (`DECISIONS.md` ADR-006).
- **Recommendation logic stays pure.** `data/recommendations.ts` must not
  import React, Supabase, or Firestore.
- **One data-access seam.** Prefer importing water/lake data through
  `src/services/database/index.ts`-style barrels over reaching into a
  specific SDK from a screen component — even though today's live app
  doesn't yet do this consistently (`ARCHITECTURE.md` §3), new code
  shouldn't add a fourth way of doing it.

## Commits & branches

Small, focused commits over large ones — a duplicated-formula fix, a stale
doc update, and a UI feature are three commits, not one. Write commit
messages that explain *why*, not just *what* (the diff already shows what).
Record any decision with real architectural weight in `DECISIONS.md` as a
new ADR rather than only in a commit message, so it's discoverable without
digging through `git log`.

## Docs stay synchronized

If your change makes `ARCHITECTURE.md`, `DATABASE_MAP.md`, or another
canonical doc inaccurate, update it in the same change. If you can't update
it properly yet, mark the affected section stale explicitly (see the
"ARCHIVED" banners added to `CURRENT_ARCHITECTURE.md`/`DATABASE_MAP.md` in
this audit) rather than leaving silently outdated content.
