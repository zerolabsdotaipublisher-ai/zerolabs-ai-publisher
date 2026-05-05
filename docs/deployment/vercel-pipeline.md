# Vercel Deployment Pipeline

This document is the authoritative reference for how **ZeroLabs AI Publisher** is built and deployed via GitHub and Vercel. It covers project linkage, build settings, environment variable requirements, preview and production deployment behavior, rollback/redeploy procedures, and common 404 root causes.

---

## Table of Contents

- [Project Linkage](#1-project-linkage)
- [Build Settings](#2-build-settings)
- [Environment Variables](#3-environment-variables)
- [Deployment Behavior](#4-deployment-behavior)
- [Rollback and Redeploy](#5-rollback-and-redeploy)
- [Common 404 Causes and Remediation](#6-common-404-causes-and-remediation)

---

## 1. Project Linkage

### Required Vercel project configuration

| Setting | Required value |
|---|---|
| Connected repository | `zerolabsdotaipublisher-ai/zerolabs-ai-publisher` |
| Production branch | `main` |
| Preview branches | All other branches (automatic) |
| Root directory | *(leave blank — repo root is the app root)* |
| Framework preset | **Next.js** |

### How to verify

1. Open [vercel.com](https://vercel.com) → select the `zerolabs-ai-publisher` project.
2. Go to **Settings → General**.
3. Confirm **Framework Preset** is `Next.js`.
4. Go to **Settings → Git**.
5. Confirm **Connected Repository** matches the GitHub org/repo above.
6. Confirm **Production Branch** is `main`.

> **Important:** if the framework preset is set to anything other than Next.js, Vercel will not know how to build or serve the app correctly. This is a common cause of 404s and broken deployments.

---

## 2. Build Settings

The `vercel.json` committed to the repository root makes these settings explicit and reviewable:

```json
{
  "framework": "nextjs",
  "installCommand": "npm install",
  "buildCommand": "npm run build"
}
```

### Validation checklist

| Setting | Expected value | Notes |
|---|---|---|
| Framework | `nextjs` | Declared in `vercel.json` and must match Vercel project settings |
| Install command | `npm install` | Uses `package-lock.json`; do not switch to `yarn`/`pnpm` without updating lockfile |
| Build command | `npm run build` | Runs `next build`; output goes to `.next/` (Vercel handles this automatically) |
| Output directory | *(not set — Next.js default)* | Vercel's Next.js integration reads `.next/` natively; do not override `outputDirectory` |
| Root directory | *(not set — repo root)* | The Next.js app is at the repository root, not a subdirectory |
| Node.js version | **20.x** | Match the `.node-version` or `engines` field if added; 20 LTS is the baseline |

### Verifying build settings in the Vercel dashboard

1. Go to **Settings → General → Build & Development Settings**.
2. Confirm the values above are either set or inherited from `vercel.json`.
3. A successful build produces a deployment URL ending in `.vercel.app`.

---

## 3. Environment Variables

For the complete variable reference, classification, environment matrix, and rotation procedures see **[docs/environment-variables.md](../environment-variables.md)**.

### Scoping rules

Vercel environment variables can be scoped to one or more environments:

| Scope | When it applies |
|---|---|
| **Production** | Deployments from the `main` branch |
| **Preview** | Deployments from any other branch or pull request |
| **Development** | Local development via `vercel env pull` |

### Required variables

The following variables must be present in **Production**, **Preview**, and **Development** environments.

| Variable | Scope | Notes |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | Production + Preview + Development | Set to `ZeroLabs AI Publisher` |
| `NEXT_PUBLIC_APP_URL` | Production + Preview + Development | Set to canonical domain for Production, preview slug for Preview, and `http://localhost:3000` for Development |
| `NEXT_PUBLIC_SUPABASE_URL` | Production + Preview | Public — safe in browser. Throws at startup if missing. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production + Preview | Public — safe in browser. Throws at startup if missing. |
| `SUPABASE_SERVICE_ROLE_KEY` | Production + Preview | Server-side only. Do not prefix with `NEXT_PUBLIC_`. |
| `OPENAI_API_KEY` | Production + Preview | Server-side only. Throws at startup if missing. |

> `config/env.ts` exports `validateEnv()`, which is called from `next.config.ts`. If any required variable is absent when the app starts, it throws a startup error listing all missing variables. This prevents broken deployments from reaching production silently.

### Optional variables

These variables are needed only when the corresponding feature is active:

| Variable | Scope | Notes |
|---|---|---|
| `OPENAI_MODEL` | Production + Preview | Defaults to `gpt-4o` if omitted |
| `NEXT_PUBLIC_SITE_URL` | Production + Preview | Used by Supabase for OAuth redirects |
| `JWT_SECRET` | Production + Preview | Required if application-level JWT signing is used |
| `QDRANT_URL` | Production + Preview | Optional unless vector search features are enabled |
| `QDRANT_API_KEY` | Production + Preview | Optional |
| `QDRANT_COLLECTION` | Production + Preview | Defaults to `ai_publisher_default` if omitted |
| `WASABI_ACCESS_KEY_ID` | Production + Preview | Required when storage features are active |
| `WASABI_SECRET_ACCESS_KEY` | Production + Preview | Required when storage features are active |
| `WASABI_BUCKET` | Production + Preview | Required when storage features are active |
| `WASABI_REGION` | Production + Preview | Defaults to `us-east-1` if omitted |
| `ZEROFLOW_API_URL` | Production + Preview | Required when ZeroFlow platform features are active |
| `ZEROFLOW_API_KEY` | Production + Preview | Required when ZeroFlow platform features are active |
| `ENABLE_ANALYTICS` | Production + Preview | Feature flag. Defaults to `false`. |
| `ENABLE_BILLING` | Production + Preview | Feature flag. Defaults to `false`. |

### Checking variable names

The canonical list of variable names is in `.env.example` at the repository root and in [docs/environment-variables.md](../environment-variables.md). Always verify that variable names in Vercel exactly match the names in `.env.example` — trailing spaces, capitalization differences, and typos are silent failures.

---

## 4. Deployment Behavior

### Branch → deployment mapping

| Branch | Deployment type | URL pattern |
|---|---|---|
| `main` | **Production** | `https://<project>.vercel.app` (or custom domain) |
| `develop` | Preview | `https://<project>-git-develop-<team>.vercel.app` |
| `feature/*` | Preview | `https://<project>-git-<branch>-<team>.vercel.app` |
| Pull request | Preview | Unique URL generated per PR |

Every push to any connected branch triggers a new deployment automatically. Production deployments are only created from `main`.

### Validating a production deployment

1. Merge a PR into `main` (or push to `main` if protections allow).
2. Open the Vercel dashboard → **Deployments**.
3. Confirm a new deployment is created with the `main` branch and environment `Production`.
4. Wait for **Ready** status.
5. Open the production URL and confirm the root path `/` loads the homepage.

### Validating a preview deployment

1. Push to any non-`main` branch or open a pull request.
2. Vercel creates a preview deployment automatically.
3. Confirm the deployment is created with environment `Preview`.
4. Open the preview URL and confirm `/` loads correctly.
5. GitHub pull request comments will include a preview deployment link when Vercel GitHub integration is active.

### Expected root route behavior

The root route `/` is served by `app/page.tsx`. It is a static React Server Component with no external data dependencies. A correctly deployed app must load this page without error. A 404 at `/` is a deployment configuration problem, not an application logic problem.

---

## 5. Rollback and Redeploy

### Rollback to a previous production deployment

1. Open the Vercel dashboard → **Deployments**.
2. Filter by **Production** environment and locate the last known-good deployment.
3. Click the three-dot menu → **Promote to Production**.
4. Confirm — Vercel will instantly alias the production URL to that deployment.

> Rollback in Vercel is instant (a URL alias swap). No rebuild is required.

### Redeploy from a specific commit

1. Open the Vercel dashboard → **Deployments**.
2. Find the target deployment.
3. Click the three-dot menu → **Redeploy**.
4. Choose whether to use the original build cache or a clean build.

### Triggering a redeploy from GitHub

Push an empty commit to the target branch to trigger a new build:

```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push origin main
```

---

## 6. Common 404 Causes and Remediation

The following table maps the most likely causes of a 404 on the deployed app to their verification steps and fixes.

| # | Cause | How to verify | Fix |
|---|---|---|---|
| 1 | **Framework preset is not Next.js** | Vercel → Settings → General → Framework Preset | Set to **Next.js** |
| 2 | **Root directory set to wrong path** | Vercel → Settings → General → Root Directory | Clear the field (leave blank — repo root is the app root) |
| 3 | **Production branch not set to `main`** | Vercel → Settings → Git → Production Branch | Set to `main` |
| 4 | **Wrong GitHub repository connected** | Vercel → Settings → Git → Connected Repository | Disconnect and reconnect to `zerolabsdotaipublisher-ai/zerolabs-ai-publisher` |
| 5 | **Build failed — deployment never reached Ready** | Vercel → Deployments → check status and build logs | Fix the build error; a failed deployment does not serve traffic |
| 6 | **Required env var missing — app throws at startup** | Check Vercel env vars against `.env.example`; check runtime logs for `Missing environment variable` errors | Add the missing variable in Vercel → Settings → Environment Variables |
| 7 | **`next.config.ts` `output: 'export'` set incorrectly** | Check `next.config.ts` for `output` field | Remove `output: 'export'` if present — static export disables dynamic routes and API routes |
| 8 | **Custom domain DNS not propagated** | Open the bare production `.vercel.app` URL directly | Wait for DNS propagation or check domain settings in Vercel |
| 9 | **`vercel.json` `routes` or `rewrites` conflict** | Check `vercel.json` for routing overrides | Remove or correct conflicting route entries |
| 10 | **Preview deployment showing 404 but production is fine** | Open the specific preview URL from the Vercel dashboard | This is expected if preview env vars are not configured — add them to the Preview scope |

### Quick diagnostic checklist for a root `/` 404

```
1. Open the Vercel dashboard deployment list.
2. Is the latest deployment in "Ready" state?
   - No → read build logs → fix build error → redeploy.
   - Yes → continue.
3. Is the framework preset set to Next.js?
   - No → fix in Vercel settings → redeploy.
   - Yes → continue.
4. Is the root directory blank (repo root)?
   - No → clear the field → redeploy.
   - Yes → continue.
5. Are NEXT_PUBLIC_APP_NAME, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, OPENAI_API_KEY set?
   - No → add to Vercel environment variables → redeploy.
   - Yes → continue.
6. Does next.config.ts contain output: 'export'?
   - Yes → remove it → commit → push → redeploy.
   - No → continue.
7. Open the deployment's function/runtime logs for errors.
8. If all above pass, the 404 may be in application-level routing — escalate to app-level investigation.
```

---

## Related documents

- [docs/setup/environment.md](../setup/environment.md) — Local environment variable setup
- [docs/setup/nextjs-framework.md](../setup/nextjs-framework.md) — Framework conventions
- [docs/branching-strategy.md](../branching-strategy.md) — Branch model and protection rules
- [README.md — Deployment section](../../README.md#deployment)
