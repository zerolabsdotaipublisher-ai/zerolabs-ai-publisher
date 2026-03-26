# Next.js Framework Setup

This document captures the framework baseline currently implemented in this repository for **ZLAP-STORY 1-1**.

## Baseline Status

The repository already contains a valid Next.js application baseline and was **validated in place** rather than recreated.

Validated baseline components:

- `package.json` scripts: `dev`, `build`, `start`, `lint`
- `next.config.ts` present
- App Router structure present in `app/`
- TypeScript configuration present in `tsconfig.json`
- ESLint configured with Next.js recommendations in `eslint.config.mjs`
- Static asset handling through `public/`

## Package Manager and Local Commands

This repository uses **npm** (`package-lock.json` is committed).

Framework validation commands:

```bash
npm install
npm run lint
npm run build
npm run dev
```

## App Router Conventions

- Use the **App Router** (`app/`) for all route segments.
- Keep `app/layout.tsx` as the root shell and metadata entry point.
- Add feature routes under route segment folders in `app/`.
- Do not introduce a Pages Router (`pages/`) unless explicitly required by a future story.

Current baseline files:

- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`

## TypeScript Conventions

- TypeScript is enabled and strict mode is on.
- Prefer `.ts`/`.tsx` for app, components, config, services, and utilities.
- Keep path alias usage consistent with `@/*` from `tsconfig.json`.

## Styling Conventions

- Use `app/globals.css` for global reset/theme tokens and app-wide baseline styles.
- Use CSS Modules for route/component-scoped styling (example: `app/page.module.css`).
- Keep framework baseline styles minimal and avoid adding product-specific design system concerns at this layer.

## Environment Variable Conventions

- Use `.env.example` as the committed template.
- Use `.env.local` for local secrets (never commit).
- Only `NEXT_PUBLIC_*` variables are browser-exposed.
- Keep server secrets (for example `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`) server-side only.
- Keep optional integrations (Qdrant, Wasabi, ZeroFlow services) optional unless a feature actively requires them.
- All `process.env` access must go through `config/env.ts` — never read `process.env` directly in other files.

See also: [docs/environment-variables.md](../environment-variables.md) (canonical reference) and [environment.md](./environment.md) (local setup guide).

## Static Asset Conventions

- Keep reusable static assets in `public/`.
- Maintain clean folders for future growth (`public/icons`, `public/images`, `public/brand`).
- Keep placeholder/demo assets minimal.

## Layer Alignment

This repository is a **Layer 1 product application**:

- Owns product routes, UI, and app-level backend entry points.
- Integrates with shared platform/infrastructure services through clear boundaries.
- Targets GitHub + Vercel delivery.

Avoid introducing shared-platform implementations (billing authority, tenant authority, orchestration internals) into the framework baseline.
