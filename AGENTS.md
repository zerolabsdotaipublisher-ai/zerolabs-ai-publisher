# AGENTS.md

## Project

Zero Labs AI Publisher is a Next.js application for generating, previewing, managing, and publishing AI-assisted websites.

The app includes:

- authenticated customer workspace
- Generate Website flow
- generated website preview/rendering
- admin dashboard
- admin users management
- Vercel deployment/admin visibility
- Supabase-backed application data

## Primary instructions for AI coding agents

Work carefully and keep changes scoped to the requested task.

Before editing code:

1. Read the relevant files.
2. Understand the existing routing, data flow, and styling conventions.
3. Avoid broad refactors unless the task explicitly asks for them.
4. Preserve working behavior.
5. Do not fabricate analytics, deployment, user, or website data.

## Tech stack

- Next.js App Router
- React
- TypeScript
- Supabase
- Vercel
- CSS in `app/globals.css`
- npm scripts for validation

## Common validation commands

Run these before reporting a task as complete:

```bash
npm run lint
npm run typecheck
npm run build
git diff --check