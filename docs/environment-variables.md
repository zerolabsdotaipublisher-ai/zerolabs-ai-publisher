# Environment Variables Reference

This is the canonical reference for all environment variables used by **ZeroLabs AI Publisher**.

For local setup instructions see [docs/setup/environment.md](./setup/environment.md).
For Vercel deployment instructions see [docs/deployment/vercel-pipeline.md](./deployment/vercel-pipeline.md).

---

## Table of Contents

- [Classification](#classification)
- [Quick Reference](#quick-reference)
- [Service Groups](#service-groups)
  - [App Identity](#app-identity)
  - [Supabase](#supabase)
  - [OpenAI](#openai)
  - [Direct Database Tooling (Optional)](#direct-database-tooling-optional)
  - [Auth / Session (Optional)](#auth--session-optional)
  - [Qdrant — Vector Database (Future)](#qdrant--vector-database-future)
  - [Wasabi — Object Storage (Future)](#wasabi--object-storage-future)
  - [Billing — Stripe (Future)](#billing--stripe-future)
  - [Email — Resend (Future)](#email--resend-future)
  - [ZeroFlow Platform Services (Future)](#zeroflow-platform-services-future)
  - [Website Deployment Pipeline](#website-deployment-pipeline)
  - [Feature Flags (Future)](#feature-flags-future)
  - [Vercel Runtime Variables (Auto-provided)](#vercel-runtime-variables-auto-provided)
- [Environment Matrix](#environment-matrix)
- [Vercel Environment Setup](#vercel-environment-setup)
- [Operations Guide](#operations-guide)
  - [Key Rotation](#key-rotation)
  - [Access Control](#access-control)
- [Naming Convention](#naming-convention)
- [Code Access Pattern](#code-access-pattern)

---

## Classification

Variables are classified along two axes:

**Browser exposure**

| Prefix | Exposed to browser | Example |
|---|---|---|
| `NEXT_PUBLIC_` | ✅ Yes — included in client bundle | `NEXT_PUBLIC_SUPABASE_URL` |
| *(none)* | ❌ No — server-side only | `SUPABASE_SERVICE_ROLE_KEY` |

> Never prefix a secret with `NEXT_PUBLIC_`. Any variable with this prefix becomes part of the JavaScript bundle and is visible to everyone who loads the page.

**Readiness**

| Tag | Meaning |
|---|---|
| **Required now** | App will refuse to start if missing |
| **Optional now** | Safe to omit; only needed for specific tooling or features |
| **Future** | Planned integration; safe to omit until the feature is built |

---

## Quick Reference

| Variable | Public | Readiness | Service | Owner |
|---|---|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | ✅ | Required now | App | Repo / Vercel |
| `NEXT_PUBLIC_APP_URL` | ✅ | Required now | App | Repo / Vercel |
| `NODE_ENV` | — | Set by runtime | App | Next.js / Vercel |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Required now | Supabase | Supabase Console → Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Required now | Supabase | Supabase Console → Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ | Required now | Supabase | Supabase Console → Vercel |
| `OPENAI_API_KEY` | ❌ | Required now | OpenAI | OpenAI Dashboard → Vercel |
| `OPENAI_MODEL` | ❌ | Optional now | OpenAI | Vercel |
| `DATABASE_URL` | ❌ | Optional now | Supabase (direct) | Supabase Console → local only |
| `DIRECT_URL` | ❌ | Optional now | Supabase (direct) | Supabase Console → local only |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Optional now | Auth | Vercel |
| `JWT_SECRET` | ❌ | Optional now | Auth | Generated → Vercel |
| `QDRANT_URL` | ❌ | Future | Qdrant | Qdrant Console → Vercel |
| `QDRANT_API_KEY` | ❌ | Future | Qdrant | Qdrant Console → Vercel |
| `QDRANT_COLLECTION` | ❌ | Future | Qdrant | Vercel |
| `WASABI_ACCESS_KEY_ID` | ❌ | Future | Wasabi | Wasabi Console → Vercel |
| `WASABI_SECRET_ACCESS_KEY` | ❌ | Future | Wasabi | Wasabi Console → Vercel |
| `WASABI_BUCKET` | ❌ | Future | Wasabi | Wasabi Console → Vercel |
| `WASABI_REGION` | ❌ | Future | Wasabi | Vercel |
| `WASABI_ENDPOINT` | ❌ | Future | Wasabi | Vercel |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | Future | Stripe | Stripe Dashboard → Vercel |
| `STRIPE_SECRET_KEY` | ❌ | Future | Stripe | Stripe Dashboard → Vercel |
| `STRIPE_WEBHOOK_SECRET` | ❌ | Future | Stripe | Stripe Dashboard → Vercel |
| `RESEND_API_KEY` | ❌ | Future | Resend | Resend Dashboard → Vercel |
| `EMAIL_FROM` | ❌ | Future | Resend | Vercel |
| `ZEROFLOW_API_URL` | ❌ | Future | ZeroFlow | ZeroFlow Team → Vercel |
| `ZEROFLOW_API_KEY` | ❌ | Future | ZeroFlow | ZeroFlow Team → Vercel |
| `PIPELINE_DEPLOYMENT_TARGET` | ❌ | Optional now | Pipeline | Vercel |
| `PIPELINE_PREVIEW_BASE_URL` | ❌ | Optional now | Pipeline | Vercel |
| `PIPELINE_PRODUCTION_BASE_URL` | ❌ | Optional now | Pipeline | Vercel |
| `PIPELINE_MAX_ATTEMPTS` | ❌ | Optional now | Pipeline | Vercel |
| `PIPELINE_RETRY_BASE_DELAY_MS` | ❌ | Optional now | Pipeline | Vercel |
| `PIPELINE_VERCEL_API_URL` | ❌ | Optional now | Pipeline | Vercel |
| `PIPELINE_VERCEL_TOKEN` | ❌ | Optional now | Pipeline | Vercel |
| `PIPELINE_VERCEL_PROJECT_ID` | ❌ | Optional now | Pipeline | Vercel |
| `PIPELINE_VERCEL_TEAM_ID` | ❌ | Optional now | Pipeline | Vercel |
| `PIPELINE_VERCEL_DEPLOY_HOOK_PREVIEW_URL` | ❌ | Optional now | Pipeline | Vercel |
| `PIPELINE_VERCEL_DEPLOY_HOOK_PRODUCTION_URL` | ❌ | Optional now | Pipeline | Vercel |
| `PIPELINE_VERCEL_DEFAULT_DOMAIN` | ❌ | Optional now | Pipeline | Vercel |
| `PIPELINE_VERCEL_ENABLE_REAL_DEPLOYMENTS` | ❌ | Optional now | Pipeline | Vercel |
| `PIPELINE_VERCEL_TIMEOUT_MS` | ❌ | Optional now | Pipeline | Vercel |
| `ENABLE_ANALYTICS` | ❌ | Future | Feature flag | Vercel |
| `ENABLE_BILLING` | ❌ | Future | Feature flag | Vercel |
| `ENABLE_PUBLISHING` | ❌ | Future | Feature flag | Vercel |
| `ENABLE_PROJECT_CREATION` | ❌ | Future | Feature flag | Vercel |
| `ENABLE_ZEROFLOW_INTEGRATION` | ❌ | Future | Feature flag | Vercel |
| `VERCEL_URL` | — | Auto-provided | Vercel | Vercel (do not set) |
| `VERCEL_ENV` | — | Auto-provided | Vercel | Vercel (do not set) |
| `VERCEL_GIT_COMMIT_SHA` | — | Auto-provided | Vercel | Vercel (do not set) |

---

## Service Groups

### App Identity

| Variable | Public | Required | Default | Description |
|---|---|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | ✅ | Required now | `AI Publisher` | Display name shown in the UI |
| `NEXT_PUBLIC_APP_URL` | ✅ | Required now | `http://localhost:3000` | Canonical URL for this deployment |
| `NODE_ENV` | — | Set by runtime | `development` | Set automatically by Next.js and Vercel; do not override |

---

### Supabase

Used for the primary relational database and authentication.

Find these values in your Supabase project at **Project Settings → API**.

| Variable | Public | Required | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Required now | Project URL — safe for browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Required now | Anon (public) key — safe for browser |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ | Required now | Service role key — full DB access, server-side only |

> `SUPABASE_SERVICE_ROLE_KEY` bypasses Row-Level Security. It must only be used in server-side code (API routes, Server Components, server actions). Never expose it to the browser.

---

### OpenAI

Used for AI content generation, summarization, and embeddings.

Generate a key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

| Variable | Public | Required | Default | Description |
|---|---|---|---|---|
| `OPENAI_API_KEY` | ❌ | Required now | — | API key — server-side only |
| `OPENAI_MODEL` | ❌ | Optional now | `gpt-4o` | Model to use for content generation |

---

### Direct Database Tooling (Optional)

Used only by ORM CLI tools (Drizzle, Prisma) for migrations and seeding. **Not needed at runtime** if using the Supabase client.

Find these connection strings in your Supabase project at **Project Settings → Database → Connection string**.

| Variable | Public | Required | Description |
|---|---|---|---|
| `DATABASE_URL` | ❌ | Optional now | Pooled connection string (used by ORM at runtime) |
| `DIRECT_URL` | ❌ | Optional now | Direct connection string (used by ORM CLI for migrations) |

> Keep these in `.env.local` only. Do not add to Vercel unless a deployed migration runner requires them.

---

### Auth / Session (Optional)

| Variable | Public | Required | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | ✅ | Optional now | Canonical site URL for Supabase OAuth redirect allow-list |
| `JWT_SECRET` | ❌ | Optional now | Secret for signing application-level JWTs — minimum 32 characters |

For auth flows in this repository, configure Supabase redirect URLs to include:

- `${NEXT_PUBLIC_SITE_URL}/auth/callback` (or `${NEXT_PUBLIC_APP_URL}/auth/callback`)
- `${NEXT_PUBLIC_SITE_URL}/reset-password` (or `${NEXT_PUBLIC_APP_URL}/reset-password`)

Generate `JWT_SECRET` with:

```bash
openssl rand -base64 32
```

---

### Qdrant — Vector Database (Future)

Required only when semantic search and embedding features are active.

| Variable | Public | Required | Default | Description |
|---|---|---|---|---|
| `QDRANT_URL` | ❌ | Future | — | Qdrant instance URL |
| `QDRANT_API_KEY` | ❌ | Future | — | API key for authenticated Qdrant instances |
| `QDRANT_COLLECTION` | ❌ | Future | `ai_publisher_default` | Collection name |

---

### Wasabi — Object Storage (Future)

Required only when asset upload and file storage features are active. Wasabi uses the S3-compatible API.

| Variable | Public | Required | Description |
|---|---|---|---|
| `WASABI_ACCESS_KEY_ID` | ❌ | Future | Wasabi access key ID |
| `WASABI_SECRET_ACCESS_KEY` | ❌ | Future | Wasabi secret access key |
| `WASABI_BUCKET` | ❌ | Future | Target bucket name |
| `WASABI_REGION` | ❌ | Future | Bucket region (e.g. `us-east-1`) |
| `WASABI_ENDPOINT` | ❌ | Future | S3-compatible endpoint URL (e.g. `https://s3.wasabisys.com`) |

---

### Billing — Stripe (Future)

Required when `ENABLE_BILLING=true`. The publishable key is browser-safe; the secret and webhook keys are server-only.

| Variable | Public | Required | Description |
|---|---|---|---|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | Future | Stripe publishable key (browser-safe) |
| `STRIPE_SECRET_KEY` | ❌ | Future | Stripe secret key — server-side only |
| `STRIPE_WEBHOOK_SECRET` | ❌ | Future | Stripe webhook signing secret — server-side only |

---

### Email — Resend (Future)

Required when transactional email features are enabled.

| Variable | Public | Required | Default | Description |
|---|---|---|---|---|
| `RESEND_API_KEY` | ❌ | Future | — | Resend API key |
| `EMAIL_FROM` | ❌ | Future | `noreply@example.com` | From address for outbound email |

---

### ZeroFlow Platform Services (Future)

Required when platform-level auth, billing, or orchestration is active. ZeroFlow is a separate platform layer — these are not the same as this app's own secrets.

| Variable | Public | Required | Description |
|---|---|---|---|
| `ZEROFLOW_API_URL` | ❌ | Future | Base URL of the ZeroFlow platform API |
| `ZEROFLOW_API_KEY` | ❌ | Future | API key issued by the ZeroFlow platform |

---

### Website Deployment Pipeline

MVP-safe build/deployment orchestration owned by AI Publisher. `mock` is the default target and performs no external calls; `vercel` supports safe dry-run mode and optional real deploy-hook integration.

| Variable | Public | Required | Default | Description |
|---|---|---|---|---|
| `PIPELINE_DEPLOYMENT_TARGET` | ❌ | Optional now | `mock` | Deployment adapter target: `mock` or `vercel` |
| `PIPELINE_PREVIEW_BASE_URL` | ❌ | Optional now | `NEXT_PUBLIC_APP_URL` | Base URL used when assigning preview deployment URLs |
| `PIPELINE_PRODUCTION_BASE_URL` | ❌ | Optional now | `NEXT_PUBLIC_APP_URL` | Base URL used when assigning production deployment URLs |
| `PIPELINE_MAX_ATTEMPTS` | ❌ | Optional now | `3` | Maximum attempts for retryable adapter failures |
| `PIPELINE_RETRY_BASE_DELAY_MS` | ❌ | Optional now | `100` | Base retry delay in milliseconds |
| `PIPELINE_VERCEL_API_URL` | ❌ | Optional now | `https://api.vercel.com` | Vercel API base URL used by hosting adapter integrations |
| `PIPELINE_VERCEL_TOKEN` | ❌ | Optional now | — | Optional Vercel token for provider API integrations |
| `PIPELINE_VERCEL_PROJECT_ID` | ❌ | Optional now | — | Optional Vercel project identifier for metadata/correlation |
| `PIPELINE_VERCEL_TEAM_ID` | ❌ | Optional now | — | Optional Vercel team scope identifier |
| `PIPELINE_VERCEL_DEPLOY_HOOK_PREVIEW_URL` | ❌ | Optional now | — | Preview deploy-hook URL used for real programmatic preview deployments |
| `PIPELINE_VERCEL_DEPLOY_HOOK_PRODUCTION_URL` | ❌ | Optional now | — | Production deploy-hook URL used for real programmatic production deployments |
| `PIPELINE_VERCEL_DEFAULT_DOMAIN` | ❌ | Optional now | — | Base domain used to derive deterministic generated subdomains |
| `PIPELINE_VERCEL_ENABLE_REAL_DEPLOYMENTS` | ❌ | Optional now | `false` | Enables real Vercel deployment calls when deploy-hook URLs are configured |
| `PIPELINE_VERCEL_TIMEOUT_MS` | ❌ | Optional now | `15000` | Timeout for provider calls in milliseconds |

---

### Feature Flags (Future)

Boolean toggles that gate feature areas. Set to `"true"` to enable.

| Variable | Public | Default | Description |
|---|---|---|---|
| `ENABLE_ANALYTICS` | ❌ | `false` | Enable analytics collection |
| `ENABLE_BILLING` | ❌ | `false` | Enable billing and subscription features |
| `ENABLE_PUBLISHING` | ❌ | `false` | Enable content publishing workflows |
| `ENABLE_PROJECT_CREATION` | ❌ | `false` | Enable project creation and management |
| `ENABLE_ZEROFLOW_INTEGRATION` | ❌ | `false` | Enable ZeroFlow platform integration |

---

### Vercel Runtime Variables (Auto-provided)

These variables are injected automatically by Vercel. **Do not set them manually** — doing so will override the correct values.

| Variable | Description |
|---|---|
| `VERCEL_URL` | Deployment URL without `https://` (e.g. `project-abc123.vercel.app`) |
| `VERCEL_ENV` | Deployment environment: `production`, `preview`, or `development` |
| `VERCEL_GIT_COMMIT_SHA` | Full Git commit SHA for this deployment |

Access via `env.app.vercelUrl` and `env.app.vercelEnv` in `config/env.ts`.

---

## Environment Matrix

This table shows which variables are configured in each environment and where they are managed.

| Variable | Local (`.env.local`) | Preview (Vercel) | Production (Vercel) | Managed in |
|---|---|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | ✅ | ✅ | ✅ | Vercel → Settings → Env Vars |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Preview deployment URL | Production domain | Vercel → Settings → Env Vars |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ✅ | Supabase Console → Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | ✅ | Supabase Console → Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | ✅ | Supabase Console → Vercel |
| `OPENAI_API_KEY` | ✅ | ✅ | ✅ | OpenAI Dashboard → Vercel |
| `OPENAI_MODEL` | Optional | Optional | Optional | Vercel |
| `DATABASE_URL` | Optional | ❌ not needed | ❌ not needed | Supabase Console → local only |
| `DIRECT_URL` | Optional | ❌ not needed | ❌ not needed | Supabase Console → local only |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Preview URL | Production domain | Vercel |
| `JWT_SECRET` | Optional | Optional | Optional | Generated → Vercel |
| `QDRANT_*` | Future | Future | Future | Qdrant Console → Vercel |
| `WASABI_*` | Future | Future | Future | Wasabi Console → Vercel |
| `STRIPE_*` | Future | Future | Future | Stripe Dashboard → Vercel |
| `RESEND_*` | Future | Future | Future | Resend Dashboard → Vercel |
| `ZEROFLOW_*` | Future | Future | Future | ZeroFlow Team → Vercel |
| `ENABLE_ANALYTICS` | Future | Future | Future | Vercel |
| `ENABLE_BILLING` | Future | Future | Future | Vercel |
| `ENABLE_PUBLISHING` | Future | Future | Future | Vercel |
| `ENABLE_PROJECT_CREATION` | Future | Future | Future | Vercel |
| `ENABLE_ZEROFLOW_INTEGRATION` | Future | Future | Future | Vercel |
| `VERCEL_URL` | ❌ auto | ✅ auto | ✅ auto | Vercel (automatic) |
| `VERCEL_ENV` | ❌ auto | ✅ auto | ✅ auto | Vercel (automatic) |

> **Preview vs. production databases**: if you want to isolate preview deployments from production data, create a separate Supabase project for the preview environment and configure its URL/keys under the Vercel **Preview** scope only.

---

## Vercel Environment Setup

### Scoping

Vercel variables can be scoped to one or more environments:

| Scope | When it applies |
|---|---|
| **Production** | Deployments from the `main` branch |
| **Preview** | Deployments from any other branch or pull request |
| **Development** | Local development via `vercel env pull` |

### Steps to populate required variables

1. Open [vercel.com](https://vercel.com) → select the `zerolabs-ai-publisher` project.
2. Go to **Settings → Environment Variables**.
3. Add each required variable for the **Production** and **Preview** scopes:

   ```
   NEXT_PUBLIC_APP_NAME       = AI Publisher
   NEXT_PUBLIC_APP_URL        = https://your-production-domain.com   (Production)
   NEXT_PUBLIC_APP_URL        = https://your-preview-slug.vercel.app (Preview)
   NEXT_PUBLIC_SUPABASE_URL   = https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = <from Supabase console>
   SUPABASE_SERVICE_ROLE_KEY  = <from Supabase console>
   OPENAI_API_KEY             = <from OpenAI dashboard>
   ```

4. Redeploy after adding variables: push an empty commit or use **Deployments → Redeploy** in the Vercel dashboard.

### Pulling variables for local development

```bash
vercel env pull .env.local
```

This populates `.env.local` from the Vercel **Development** scope. Only run this if you have the Vercel CLI installed and are a project collaborator.

---

## Operations Guide

### Key Rotation

**When to rotate**

- A key is accidentally committed to version control
- A team member with key access leaves
- A provider reports a breach or suspicious usage
- Scheduled rotation policy (recommend at least annually for production)

**How to rotate**

1. **Generate the new key** in the provider's console (Supabase, OpenAI, Qdrant, Wasabi, etc.) — do this _before_ removing the old key.
2. **Update Vercel** first: go to **Settings → Environment Variables**, edit the variable, replace the value, and save.
3. **Trigger a redeploy** so the new value takes effect in production.
4. **Update `.env.local`** on every developer machine that uses the old key.
5. **Revoke the old key** in the provider console only after confirming the new key is working in production.
6. **Check for hard-coded values** — search the codebase for fragments of the old key before closing.

> `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to rotate at any time since it is public and subject to Row-Level Security. `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — rotate it carefully and immediately if it is ever exposed.

---

### Access Control

The following table lists who should have access to each secret system. Follow the principle of least privilege — only grant access to the minimum set of people needed.

| System | Who needs access | Where managed | Notes |
|---|---|---|---|
| **Vercel project** | Engineering leads, DevOps | [vercel.com](https://vercel.com) → team settings | All production secrets live here; treat as highly privileged |
| **GitHub repository** | Engineers (read), Engineering leads (write) | GitHub → repo → Settings → Collaborators | Secrets should not be committed; restrict branch protection rules |
| **Supabase project** | Engineering leads, DBAs | [app.supabase.com](https://app.supabase.com) | Service role key is equivalent to DB root; restrict access |
| **OpenAI org** | Engineering leads | [platform.openai.com](https://platform.openai.com) | Restrict to org members; create per-project API keys |
| **Qdrant cloud** | Data engineering | Qdrant console | Restrict to team members working on vector features |
| **Wasabi console** | Platform / storage team | Wasabi console | Create a dedicated IAM user per environment |
| **Stripe dashboard** | Product, Finance, Engineering leads | [dashboard.stripe.com](https://dashboard.stripe.com) | Use restricted keys scoped to required permissions only |
| **Resend dashboard** | Engineering leads | [resend.com](https://resend.com) | Create per-environment API keys |
| **ZeroFlow platform** | ZeroFlow team + this app's lead | ZeroFlow internal | Coordinate key provisioning through the ZeroFlow team |

> When a team member leaves: rotate any secrets they had access to (Vercel, Supabase, OpenAI, etc.) and remove their access from all provider consoles and the GitHub repository.

---

## Naming Convention

- `NEXT_PUBLIC_*` — browser-safe values only. Any variable with this prefix is included in the client JavaScript bundle and visible to all users.
- All other variables — server-side only. Next.js strips them from the client bundle at build time.
- Never promote a secret to `NEXT_PUBLIC_` for convenience. If a value needs to be in the browser, ensure it is safe to expose publicly (e.g., public anon keys, publishable Stripe keys).

---

## Code Access Pattern

All `process.env` access is centralized in `config/env.ts`. **Do not read `process.env` directly in other files.**

The preferred way to access configuration in application code is through the unified entry point:

```typescript
// ✅ Correct — unified entry point
import { config } from "@/config";
const model = config.services.openai.model;
const appName = config.app.name;

// ✅ Also correct — direct env access when needed
import { env } from "@/config";
const url = env.supabase.url;

// ❌ Incorrect — bypasses central config and validation
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
```

`config/index.ts` (`@/config`) exports:

- `config` — unified object with `app`, `services`, and `features` sections.
- `env` — raw typed environment object (use for direct env-layer access).
- `validateEnv()` — throws a comprehensive error listing all missing required variables.
- `isProduction()`, `isPreview()`, `isDevelopment()` — environment detection helpers.
- `getPublicConfig()` — browser-safe app config subset.
- `routes` — navigation route constants.

Since server-only variables (those without `NEXT_PUBLIC_`) are stripped from the client bundle by Next.js, only import `config` (or `config/env.ts`) in server-side code (API routes, Server Components, server actions).

See [docs/setup/configuration.md](./setup/configuration.md) for the full configuration architecture guide.
