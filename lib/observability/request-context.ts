/**
 * Request-level logging helpers for Next.js App Router API routes.
 *
 * Provides a higher-order function (withRequestLogging) that wraps a route
 * handler and automatically emits a structured log entry — including method,
 * path, requestId, status code, duration, and user-agent — on every request.
 *
 * Usage:
 *
 *   // app/api/example/route.ts
 *   import { withRequestLogging } from "@/lib/observability/request-context";
 *
 *   export const GET = withRequestLogging(async (req, requestId) => {
 *     // handler receives the correlation requestId
 *     return NextResponse.json({ ok: true });
 *   });
 *
 * The requestId is sourced from the inbound `x-request-id` header when
 * present (e.g. set by Vercel's edge layer), otherwise a fresh UUID is
 * generated per request.
 */

import { type NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";
import { normalizeError } from "./error-utils";
import { metrics } from "./metrics";

// ---------------------------------------------------------------------------
// Request ID
// ---------------------------------------------------------------------------

/**
 * Returns the x-request-id header value from the request, or generates a
 * new UUID if the header is absent.
 */
export function createRequestId(req?: NextRequest): string {
  const fromHeader = req?.headers.get("x-request-id");
  return fromHeader ?? crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// withRequestLogging
// ---------------------------------------------------------------------------

/**
 * Higher-order function that wraps an API route handler with structured
 * request logging and metrics tracking.
 *
 * @param handler - Async route handler; receives (req, requestId)
 * @param service - Optional service label included in the log entry (default: "api")
 */
export function withRequestLogging<T>(
  handler: (
    req: NextRequest,
    requestId: string
  ) => Promise<NextResponse<T>>,
  service = "api"
): (req: NextRequest) => Promise<NextResponse<T>> {
  return async (req: NextRequest): Promise<NextResponse<T>> => {
    const requestId = createRequestId(req);
    const start = Date.now();
    const { pathname } = new URL(req.url);

    metrics.increment("requestCount");

    try {
      const response = await handler(req, requestId);
      const durationMs = Date.now() - start;

      metrics.recordDuration("responseDurationMs", durationMs);

      logger.info("request completed", {
        category: "request",
        service,
        requestId,
        method: req.method,
        path: pathname,
        status: response.status,
        durationMs,
        userAgent: req.headers.get("user-agent") ?? undefined,
      });

      return response;
    } catch (err) {
      const durationMs = Date.now() - start;

      metrics.increment("errorCount");

      logger.error("request failed", {
        category: "request",
        service,
        requestId,
        method: req.method,
        path: pathname,
        durationMs,
        error: normalizeError(err),
      });

      throw err;
    }
  };
}
