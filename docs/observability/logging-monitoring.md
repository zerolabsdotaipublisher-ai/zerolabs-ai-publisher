# Logging and Monitoring — Zero Labs AI Publisher

> **Story:** ZLAP-STORY 1-5 — Establish Logging and Monitoring Foundation
>
> This document is the canonical reference for observability standards in
> this repository. All logging, metrics, and monitoring work must align
> with the rules defined here.

---

## Table of Contents

- [Logging Strategy](#logging-strategy)
  - [Log Levels](#log-levels)
  - [Event Categories](#event-categories)
  - [Required Fields](#required-fields)
  - [Redaction Rules](#redaction-rules)
- [Module Overview](#module-overview)
- [Usage Guide](#usage-guide)
  - [Basic Logging](#basic-logging)
  - [Error Logging](#error-logging)
  - [Request Logging](#request-logging)
  - [External Service Logging](#external-service-logging)
- [Metrics Foundation](#metrics-foundation)
- [Health Check Endpoint](#health-check-endpoint)
- [Startup Logging](#startup-logging)
- [Vercel Deployment Inspection](#vercel-deployment-inspection)
- [Alert Readiness](#alert-readiness)
- [Architecture Boundaries](#architecture-boundaries)

---

## Logging Strategy

### Log Levels

| Level   | When to use                                                     | Output stream |
|---------|-----------------------------------------------------------------|---------------|
| `error` | Unhandled exceptions, failed operations that break a workflow   | stderr        |
| `warn`  | Recoverable issues, deprecated usage, unexpected but non-fatal  | stderr        |
| `info`  | Normal significant events: request completion, service init     | stdout        |
| `debug` | Verbose developer-facing details; disabled in production review | stdout        |

### Event Categories

Every log entry should carry a `category` field from this controlled vocabulary:

| Category      | When to use                                          |
|---------------|------------------------------------------------------|
| `startup`     | App or service initialisation                        |
| `request`     | Inbound HTTP request lifecycle                       |
| `config`      | Configuration load, validation, or change            |
| `health`      | Health-check endpoint access                         |
| `service_call`| Outbound call to an external service                 |
| `security`    | Auth failure, permission check, secret-related event |
| `error`       | Unhandled exception or unexpected error condition    |

### Required Fields

Every structured log entry must include:

| Field         | Type     | Source                                     |
|---------------|----------|--------------------------------------------|
| `timestamp`   | string   | ISO 8601 UTC — set by the logger           |
| `level`       | string   | `error` \| `warn` \| `info` \| `debug`    |
| `message`     | string   | Human-readable description                 |
| `app`         | string   | `config.app.name` (from `NEXT_PUBLIC_APP_NAME`) |
| `environment` | string   | `config.app.environment` — production / preview / development |

Common optional fields:

| Field        | Type   | When to include                                    |
|--------------|--------|----------------------------------------------------|
| `service`    | string | Module or external service name                    |
| `category`   | string | Event category from vocabulary above               |
| `requestId`  | string | Inbound HTTP correlation ID                        |
| `durationMs` | number | Elapsed time for a timed operation                 |
| `error`      | object | Normalised error — `{ name, message, stack? }`     |

### Redaction Rules

**Never log any of the following:**

- API keys, tokens, passwords, or secrets (e.g. `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`)
- Personally-identifiable information (email address, full name, IP address, user ID)
- Request or response bodies that may contain sensitive user data
- Database connection strings

**Stack traces** are included only in `preview` and `development` environments.
In `production`, the `stack` field is omitted from normalised error objects.

---

## Module Overview

All observability code lives under `lib/observability/`:

```
lib/observability/
├── index.ts            — Public barrel export; import from "@/lib/observability"
├── schema.ts           — TypeScript types: LogLevel, EventCategory, LogEntry
├── logger.ts           — Centralized logger (the ONLY place console.* is used)
├── error-utils.ts      — normalizeError() and logError() helpers
├── request-context.ts  — createRequestId(), withRequestLogging() HOF
├── metrics.ts          — In-memory counters and duration summaries
└── external-service.ts — withServiceLogging(), logServiceCall/Success/Error()
```

---

## Usage Guide

### Basic Logging

```typescript
import { logger } from "@/lib/observability";

// Info — normal significant event
logger.info("content published", {
  category: "request",
  service: "publishing",
  requestId,
});

// Warn — recoverable issue
logger.warn("openai rate limit approaching", {
  category: "service_call",
  service: "openai",
  requestId,
});

// Error — failure requiring attention
logger.error("database write failed", {
  category: "error",
  service: "supabase",
  error: normalizeError(err),
  requestId,
});

// Debug — developer detail (verbose)
logger.debug("vector query parameters", {
  category: "service_call",
  service: "qdrant",
  topK: 10,
  requestId,
});
```

### Error Logging

```typescript
import { logger, normalizeError, logError } from "@/lib/observability";

// Option A — embed in a log entry
try {
  await someOperation();
} catch (err) {
  logger.error("operation failed", {
    category: "error",
    service: "supabase",
    error: normalizeError(err),
  });
}

// Option B — logError shorthand
try {
  await someOperation();
} catch (err) {
  logError(logger, "operation failed", err, { category: "error", service: "supabase" });
}
```

### Request Logging

Wrap your API route handler with `withRequestLogging` to automatically log
every inbound request with method, path, status code, duration, and requestId:

```typescript
// app/api/projects/route.ts
import { NextResponse } from "next/server";
import { withRequestLogging } from "@/lib/observability";

export const GET = withRequestLogging(async (req, requestId) => {
  // requestId is available for correlation with downstream logs
  const data = await fetchProjects();
  return NextResponse.json(data);
}, "projects"); // optional service label
```

The `x-request-id` header is honoured if set by the upstream proxy or
Vercel's edge layer. Otherwise a fresh UUID is generated per request.

### External Service Logging

Use `withServiceLogging` to wrap any outbound service call:

```typescript
import { withServiceLogging } from "@/lib/observability";

// Wrap a Supabase query
const user = await withServiceLogging(
  "supabase",
  "auth.getUser",
  () => supabase.auth.getUser(),
  { requestId }
);

// Wrap an OpenAI call
const completion = await withServiceLogging(
  "openai",
  "chat.completions.create",
  () => openai.chat.completions.create({ model: "gpt-4o", messages }),
  { requestId, model: "gpt-4o" }
);
```

For manual control, use the lower-level helpers:

```typescript
import {
  logServiceCall,
  logServiceSuccess,
  logServiceError,
} from "@/lib/observability";

const start = Date.now();
logServiceCall("wasabi", "putObject", { bucket, key });
try {
  await s3Client.putObject({ ... });
  logServiceSuccess("wasabi", "putObject", Date.now() - start);
} catch (err) {
  logServiceError("wasabi", "putObject", err, Date.now() - start);
  throw err;
}
```

---

## Metrics Foundation

The `metrics` module provides lightweight in-process counters and duration
summaries. These are foundational scaffolding — not a full APM solution.

```typescript
import { metrics } from "@/lib/observability";

// Read a counter
const totalRequests = metrics.getCounter("requestCount");

// Snapshot all metrics (e.g. for a debug endpoint)
const snap = metrics.snapshot();
// {
//   counters: { requestCount, errorCount, externalServiceCallCount, externalServiceFailureCount },
//   durations: { responseDurationMs: { count, totalMs, minMs, maxMs, avgMs } }
// }
```

**Available counters:**

| Counter                       | Incremented by                             |
|-------------------------------|--------------------------------------------|
| `requestCount`                | `withRequestLogging` — every inbound request |
| `errorCount`                  | `withRequestLogging` — on unhandled error  |
| `externalServiceCallCount`    | `withServiceLogging` — before every call   |
| `externalServiceFailureCount` | `withServiceLogging` / `logServiceError`   |

**Serverless caveat:** Each Vercel function invocation has its own memory
space. Counters reset between cold starts. Future work can extend this
module to flush counts to an external store (Supabase, Redis, etc.) for
cross-instance aggregation.

---

## Health Check Endpoint

**Route:** `GET /api/health`

Returns a `200 OK` with a machine-readable JSON payload:

```json
{
  "status": "ok",
  "app": "Zero Labs AI Publisher",
  "environment": "preview",
  "timestamp": "2026-03-26T08:00:00.000Z"
}
```

This endpoint is suitable for:
- Vercel uptime monitoring
- Load-balancer health probes
- CI smoke tests after deployment

**Note:** The health route does not probe external dependencies (Supabase,
OpenAI, etc.). A future `/api/health/deep` route can be added when service
clients are implemented.

---

## Startup Logging

The `instrumentation.ts` file at the project root uses the Next.js
[Instrumentation API](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)
to emit a structured startup log entry when the server starts:

```json
{
  "timestamp": "2026-03-26T08:00:00.000Z",
  "level": "info",
  "message": "application started",
  "app": "Zero Labs AI Publisher",
  "environment": "production",
  "category": "startup",
  "service": "app"
}
```

---

## Vercel Deployment Inspection

### Where to find logs

| Deployment type | Log location in Vercel Dashboard |
|-----------------|----------------------------------|
| Production      | **zerolabs-ai-publisher → Deployments → [latest prod] → Functions** |
| Preview (branch/PR) | **zerolabs-ai-publisher → Deployments → [preview deploy] → Functions** |
| Real-time stream | **zerolabs-ai-publisher → Logs** (top-level tab) |

### Filtering logs

Because all entries are structured JSON, you can filter by any field using
Vercel's log search or a log drain:

```
# Filter by level
level:error

# Filter by service
service:openai

# Filter by category
category:service_call

# Correlate a request across all log lines
requestId:abc123
```

### Log drain (future)

To aggregate logs beyond the 7-day Vercel retention window, attach a log
drain (Settings → Log Drains) pointing to Datadog, Axiom, Logtail, or any
HTTP endpoint. Because all entries are structured JSON, no parser
configuration is required.

---

## Alert Readiness

The following conditions should trigger alerts in a production monitoring
setup. The structured log fields enable these rules without custom parsing.

| Condition                             | Fields to watch                         | Suggested threshold |
|---------------------------------------|-----------------------------------------|---------------------|
| Repeated 5xx errors                   | `level:error`, `category:request`       | > 5 in 1 minute     |
| Health endpoint failures              | `category:health`, `level:error`        | Any failure         |
| OpenAI call failure spike             | `service:openai`, `level:error`         | > 3 in 5 minutes    |
| Supabase call failure spike           | `service:supabase`, `level:error`       | > 3 in 5 minutes    |
| External service latency breach       | `durationMs` on `category:service_call` | > 10 000 ms         |
| High request error rate               | `errorCount / requestCount` ratio       | > 10%               |

These conditions can be implemented as:
1. **Vercel log alerts** — filter on structured fields via log drain
2. **Supabase edge function** — periodic health check poller
3. **Future ZeroFlow platform monitor** — cross-app alert routing

---

## Architecture Boundaries

- **This module is app-level observability** — owned by this repository.
- Shared platform observability (cross-app dashboards, centralized alert
  routing, tenant-level SLOs) belongs to the ZeroFlow Layer 2 platform and
  will be implemented in a future story.
- Do not add Datadog, Sentry, or other third-party SDKs to this story.
  These can be added later via a single import in `logger.ts` without
  changing any call sites.
- All `process.env` access must continue to go through `@/config`, not
  raw `process.env`.
