# NovaCast

NovaCast helps anglers discover, understand, and fish every body of water —
a water-discovery platform (mapping, intelligent recommendations, logging,
education) where voice guidance is an optional mode, not the primary
experience. See `VISION.md` for the full product vision.

## Run & Operate

- `pnpm --filter @workspace/novacast run dev` — run the actual app (port 8080)
- `pnpm --filter @workspace/api-server run dev` — run the API server skeleton (health-check only, not wired to novacast)
- `pnpm --filter @workspace/mockup-sandbox run dev` — design/component sandbox
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec (nothing generated yet — the spec only has a health check)
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only; schema is currently empty)
- `artifacts/novacast` env vars: `VITE_FIREBASE_*` (API key/auth domain/project ID/storage bucket/messaging sender ID/app ID) and `VITE_OPENWEATHER_API_KEY` — required for the live app

## Stack

- pnpm workspaces, Node.js 22/24, TypeScript 5.9
- **The live product** (`artifacts/novacast`): React 19 + Vite 7, Tailwind v3, no router (state-driven views)
- **Backend** (canonical, ADR-008): Firestore + Firebase Auth (anonymous) + Cloud Functions (`functions/`) + Firebase Hosting
- API skeleton (`artifacts/api-server`, unwired to novacast, not part of the Firebase stack): Express 5
- DB scaffold (`lib/db`, empty schema, not part of the Firebase stack): PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle) for api-server/functions; Vite for novacast

## Where things live

- Full repo map, data flow, and app navigation: `ARCHITECTURE.md`
- Product vision and principles: `VISION.md`, `PRODUCT_PRINCIPLES.md`
- Recommendation engine (pure functions, no I/O): `artifacts/novacast/src/data/recommendations.ts`
- Design tokens: `artifacts/novacast/src/index.css` + `.agents/memory/novacast-design-system.md`
- Roadmap, ADRs, known debt: `ROADMAP.md`, `DECISIONS.md`, `TECH_DEBT.md`

## Architecture decisions

See `DECISIONS.md` for the full ADR log. Headline: Firebase is the
canonical backend (ADR-008) — `App.tsx` talks to Firestore through
`src/services/database/`, Firebase Auth (anonymous) backs the auth model,
and `functions/` holds server-side logic (admin authorization, ADR-009).
Supabase has been fully removed. Two things from this cutover are still
unverified against a live project (no deploy credentials were available
when it happened): whether Firestore is actually seeded with data, and
whether `functions/` has actually been deployed — see `TECH_DEBT.md` #1a/#1b.

## Product

See `VISION.md` and `ARCHITECTURE.md` §2 for the current Discovery → Wizard/
GPS → Lake Workspace flow (Game Plan / Learn / Tacklebox tabs).

## Gotchas

- Don't upgrade `artifacts/novacast`'s Tailwind v3 to match the workspace
  catalog's v4 pin without testing — the `@tailwind` directive syntax
  changed between versions (see `TECH_DEBT.md` #14).
- `src/components/ui/` (shadcn scaffolding) is not wired into the app —
  don't assume it's available for reuse without checking imports first.
- CI now typechecks `novacast` before deploying — keep it green.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- `AGENTS.md` for scoped responsibilities if you're an AI agent working on a specific area of this repo
- `CONTRIBUTING.md` for setup and conventions
