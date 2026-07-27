# Changelog

Format loosely follows [Keep a Changelog](https://keepachangelog.com/).
This project doesn't cut versioned releases yet, so entries are grouped by
date/theme instead of version numbers. Entries before this file existed are
reconstructed from `git log` and marked as such.

## Unreleased — Repository audit (this session)

### Security
- Removed a hardcoded OpenWeatherMap API key from `NovaCastWizard.jsx`
  (`App.tsx`'s copy of the same logic had already been fixed); both now read
  `VITE_OPENWEATHER_API_KEY`.
- Removed a temporary CI step that echoed the OpenWeatherMap secret's length
  and last 4 characters to build logs.

### Changed
- Extracted the haversine distance formula (previously duplicated three
  times across `App.tsx` and `NovaCastWizard.jsx`) into
  `src/lib/geo.ts`.
- Archived `CURRENT_ARCHITECTURE.md` and `DATABASE_MAP.md` with banners
  pointing to the new `ARCHITECTURE.md` — both described the pre-migration
  codebase and no longer matched `artifacts/novacast/`.

### Removed
- Two byte-identical duplicate files: `CURRENT_ARCHITECTURE (copy).md`,
  `CURRENT_ARCHITECTURE (copy) 1.md`, `DATABASE_MAP (copy).md`.

### Added
- `VISION.md`, `PRODUCT_PRINCIPLES.md`, `ARCHITECTURE.md`, `ROADMAP.md`,
  `DECISIONS.md`, `AGENTS.md`, `CONTRIBUTING.md`, `TECH_DEBT.md`, this
  `CHANGELOG.md` — canonical documentation set.

## Reconstructed history (from `git log`, prior to this audit)

- **2026-07-15 → 2026-07-24** — Firebase Hosting deploy pipeline stood up
  (`ci: deploy NovaCast to Firebase Hosting on push to main`), several
  redeploys to pick up OpenWeatherMap secret changes, Replit-only tooling
  dropped in favor of LAN QR code + cross-platform Vite config.
- **2026-07-02 → 2026-07-15** — GPS "nearby water" fix (results were being
  computed then discarded), Vite config made platform-independent.
- **2026-06-29 → 2026-06-30** — Tacklebox updates.
- **2026-06-16** — Firestore data-access layer and Firebase scaffolding
  added (`feat: add Firestore scaffolding for novacast`, later `refactor:
  split data access layer by domain, rename Firestore collections`);
  visual theme/layout pass (nova-blue palette, per
  `.agents/memory/novacast-design-system.md`); Supabase client crash patched.
- **2026-06-15** — Architecture audit performed on the pre-migration
  codebase (`CURRENT_ARCHITECTURE.md`, `DATABASE_MAP.md`,
  `REFACTOR_RECOMMENDATIONS.md`); Lake Workspace redesign proposed
  (`DESIGN_PROPOSAL.md`) and substantially implemented shortly after
  (Discovery/Wizard/Workspace flow now in `App.tsx`).
- **Earlier** — Original Bolt/Supabase export (`.migration-backup/`),
  migrated into the pnpm workspace at `artifacts/novacast/`.
