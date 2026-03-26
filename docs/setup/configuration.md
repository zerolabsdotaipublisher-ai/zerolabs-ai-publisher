# Configuration Architecture

This document describes the application configuration structure for **ZeroLabs AI Publisher**.

For environment variable values, defaults, and Vercel setup see [docs/environment-variables.md](../environment-variables.md).

---

## Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [Config Categories](#config-categories)
  - [App Config](#app-config)
  - [Services Config](#services-config)
  - [Feature Flags](#feature-flags)
  - [Routes](#routes)
  - [Raw Environment](#raw-environment)
- [How to Use](#how-to-use)
  - [Server-side usage](#server-side-usage)
  - [Browser-safe usage](#browser-safe-usage)
  - [Environment detection](#environment-detection)
- [How to Add a New Variable](#how-to-add-a-new-variable)
- [How to Add a New Service Config Section](#how-to-add-a-new-service-config-section)
- [How to Add a Feature Flag](#how-to-add-a-feature-flag)
- [Browser-safe vs Server-only Rules](#browser-safe-vs-server-only-rules)
- [Anti-patterns](#anti-patterns)
- [Validation](#validation)

---

## Overview

All configuration is centralized under the `config/` directory. External consumers should use the single entry point:

```typescript
import { config, isProduction, getPublicConfig } from "@/config";
```

The configuration follows a layered architecture:

```
config/index.ts        ← single public entry point (re-exports + helpers)
  ├── config/app.ts    ← app metadata and operational settings
  ├── config/services.ts ← grouped external service configs
  ├── config/features.ts ← feature flag definitions
  ├── config/routes.ts ← navigation route constants
  └── config/env.ts    ← raw env vars (single process.env source of truth)
```

`config/env.ts` is the only file that reads `process.env`. Everything above it composes typed structures from that raw data.

---

## File Structure

| File | Purpose |
|---|---|
| `config/env.ts` | Raw environment variable access, `validateEnv()`, `RuntimeEnvironment` type |
| `config/app.ts` | `AppConfig` / `PublicAppConfig` interfaces and values |
| `config/services.ts` | Typed service configs grouped by provider |
| `config/features.ts` | `FeatureFlags` interface and values |
| `config/routes.ts` | Navigation route constants |
| `config/index.ts` | Unified `config` export, re-exports, and helper functions |

---

## Config Categories

### App Config

`config.app` — application metadata and operational settings.

```typescript
config.app.name         // "AI Publisher"
config.app.description  // short description
config.app.url          // canonical base URL for this deployment
config.app.environment  // RuntimeEnvironment: "development" | "preview" | "production"
```

**Types:** `AppConfig`, `PublicAppConfig`

### Services Config

`config.services` — all external service integrations, grouped by provider.

| Group | Provider | Notes |
|---|---|---|
| `services.supabase` | Supabase | DB + auth. `serviceRole` is server-only. |
| `services.db` | Supabase (direct) | Migration tooling only, not for runtime. |
| `services.openai` | OpenAI | `apiKey` is server-only. |
| `services.qdrant` | Qdrant | Future — optional until vector features are active. |
| `services.wasabi` | Wasabi (S3) | Future — optional until storage features are active. |
| `services.billing` | Stripe | Future — optional until billing is enabled. |
| `services.email` | Resend | Future — optional until email features are enabled. |
| `services.zeroflow` | ZeroFlow | Future — optional until platform integration is active. |
| `services.auth` | App-level auth | `jwtSecret` is optional. |

**Type:** `ServiceConfig`

### Feature Flags

`config.features` — boolean flags that gate feature areas. All default to `false`.

| Flag | Env var | Default | Description |
|---|---|---|---|
| `enableAnalytics` | `ENABLE_ANALYTICS` | `false` | Analytics collection |
| `enableBilling` | `ENABLE_BILLING` | `false` | Billing and subscriptions |
| `enablePublishing` | `ENABLE_PUBLISHING` | `false` | Content publishing workflows |
| `enableProjectCreation` | `ENABLE_PROJECT_CREATION` | `false` | Project creation and management |
| `enableZeroFlowIntegration` | `ENABLE_ZEROFLOW_INTEGRATION` | `false` | ZeroFlow platform integration |

**Type:** `FeatureFlags`

### Routes

`routes` — navigation route constants.

```typescript
import { routes } from "@/config";
routes.home       // "/"
routes.login      // "/login"
routes.dashboard  // "/dashboard"
```

### Raw Environment

`env` — the raw environment object. Prefer `config.*` over `env.*` in application code. Use `env` only when you need direct access to a specific env section or within other config files.

```typescript
import { env } from "@/config";
env.runtime.stage      // "development" | "preview" | "production"
env.app.vercelUrl      // Vercel-injected deployment URL
```

---

## How to Use

### Server-side usage

Only import `config` in server-side code (API routes, Server Components, server actions).

```typescript
// ✅ Correct — server component or API route
import { config } from "@/config";

const model = config.services.openai.model;
const appName = config.app.name;

if (config.features.enablePublishing) {
  // publishing feature is active
}
```

### Browser-safe usage

Use `getPublicConfig()` to obtain a subset safe for client components.

```typescript
// ✅ Correct — passing safe values to a Client Component
import { getPublicConfig } from "@/config";

export default function Layout() {
  const pub = getPublicConfig();
  return <ClientComponent appName={pub.name} env={pub.environment} />;
}
```

`PublicAppConfig` only includes values backed by `NEXT_PUBLIC_*` environment variables.

### Environment detection

```typescript
import { isProduction, isPreview, isDevelopment } from "@/config";

if (isProduction()) {
  // production-only logic
}
```

Or access the stage string directly:

```typescript
import { env } from "@/config";
const stage = env.runtime.stage; // "development" | "preview" | "production"
```

The stage is derived from `VERCEL_ENV` (preferred) with a `NODE_ENV` fallback:

| Context | VERCEL_ENV | NODE_ENV | stage |
|---|---|---|---|
| Vercel production | `production` | — | `"production"` |
| Vercel preview | `preview` | — | `"preview"` |
| Local production build | — | `production` | `"production"` |
| Local dev server | — | `development` | `"development"` |

---

## How to Add a New Variable

1. Add the variable (with a placeholder value) to `.env.example`, in the correct section.
2. Add the variable to `docs/environment-variables.md` Quick Reference and Service Groups tables.
3. Read it in `config/env.ts` using `required()` or `optional()`:

   ```typescript
   // Required — build fails if missing
   myService: {
     apiKey: required("MY_SERVICE_API_KEY", process.env.MY_SERVICE_API_KEY),
   },

   // Optional — safe to omit
   myService: {
     endpoint: optional(process.env.MY_SERVICE_ENDPOINT),
     region: process.env.MY_SERVICE_REGION ?? "us-east-1",
   },
   ```

4. If required, add the key to `REQUIRED_VARS` in `config/env.ts`.
5. Expose it through the appropriate typed config file (`config/services.ts`, etc.).

---

## How to Add a New Service Config Section

1. Follow the "Add a New Variable" steps for all variables in the service.
2. In `config/services.ts`:
   - Add an interface for the service (e.g. `MyServiceConfig`).
   - Add the field to `ServiceConfig`.
   - Map `env.myService.*` values in `servicesConfig`.
3. Access via `config.services.myService` or import the type from `@/config`.

---

## How to Add a Feature Flag

1. Choose an env var name: `ENABLE_<FEATURE_AREA>` (all caps, underscores).
2. Add it commented-out to `.env.example` in the feature flags section.
3. Add it to `config/env.ts` under `env.features`:

   ```typescript
   enableMyFeature: process.env.ENABLE_MY_FEATURE === "true",
   ```

4. Add the field to `FeatureFlags` in `config/features.ts`:

   ```typescript
   /** Enable my feature (ENABLE_MY_FEATURE) */
   enableMyFeature: boolean;
   ```

5. Map it in the `features` export in `config/features.ts`:

   ```typescript
   enableMyFeature: env.features.enableMyFeature,
   ```

6. Gate the feature in code:

   ```typescript
   if (config.features.enableMyFeature) { ... }
   ```

---

## Browser-safe vs Server-only Rules

| Rule | Why |
|---|---|
| Variables **without** `NEXT_PUBLIC_` are stripped from the client bundle by Next.js | Server secrets never reach the browser |
| Only import `config` (or `config/env.ts`) in **server-side code** | `services` contains server-only secrets |
| Use `getPublicConfig()` to pass values to Client Components | Only `NEXT_PUBLIC_*`-backed fields are included |
| Never prefix a secret with `NEXT_PUBLIC_` | It becomes part of the JS bundle and visible to all users |

### Currently browser-safe values

| Value | Source |
|---|---|
| `config.app.name` | `NEXT_PUBLIC_APP_NAME` |
| `config.app.url` | `NEXT_PUBLIC_APP_URL` |
| `config.app.environment` | Derived at build time from `VERCEL_ENV` / `NODE_ENV` |
| `config.services.supabase.url` | `NEXT_PUBLIC_SUPABASE_URL` |
| `config.services.supabase.anonKey` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

### Server-only values (never expose to client)

- `config.services.supabase.serviceRole` (`SUPABASE_SERVICE_ROLE_KEY`)
- `config.services.openai.apiKey` (`OPENAI_API_KEY`)
- `config.services.wasabi.secretKey` (`WASABI_SECRET_ACCESS_KEY`)
- `config.services.billing.stripeSecretKey` (`STRIPE_SECRET_KEY`)
- `config.services.billing.stripeWebhookSecret` (`STRIPE_WEBHOOK_SECRET`)
- `config.services.zeroflow.apiKey` (`ZEROFLOW_API_KEY`)
- `config.services.auth.jwtSecret` (`JWT_SECRET`)

---

## Anti-patterns

```typescript
// ❌ Never read process.env directly outside config/env.ts
const key = process.env.OPENAI_API_KEY;

// ❌ Never import config/* directly when @/config works
import { env } from "../../config/env";

// ❌ Never expose server-only config to Client Components
"use client";
import { config } from "@/config"; // secrets included — DO NOT do this

// ❌ Never construct your own env checks
if (process.env.NODE_ENV === "production") { ... }
```

```typescript
// ✅ Always read env vars through config/env.ts
import { env } from "@/config";

// ✅ Always use the unified entry point
import { config, isProduction } from "@/config";

// ✅ Use environment helpers instead of raw checks
if (isProduction()) { ... }

// ✅ Pass only browser-safe values to client
import { getPublicConfig } from "@/config";
const pub = getPublicConfig();
```

---

## Validation

`validateEnv()` is called in `next.config.ts` at build time and dev-server startup. It checks all variables listed in `REQUIRED_VARS` in `config/env.ts` and throws a clear error listing every missing variable.

To add a variable to the required-at-startup check, add its name to the `REQUIRED_VARS` array in `config/env.ts` and ensure it also has a `required()` call in the `env` object.
