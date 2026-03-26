/**
 * Health check endpoint — GET /api/health
 *
 * Returns a machine-readable JSON payload indicating the application is
 * running.  Suitable for Vercel uptime checks, load-balancer probes, and
 * monitoring dashboards.
 *
 * Response shape:
 * {
 *   "status":      "ok",
 *   "app":         "Zero Labs AI Publisher",
 *   "environment": "production" | "preview" | "development",
 *   "timestamp":   "2026-03-26T08:00:00.000Z"
 * }
 *
 * HTTP status codes:
 *   200 — application is healthy
 *
 * This route intentionally stays lightweight — it does NOT probe external
 * services such as Supabase or OpenAI.  Deep health checks with dependency
 * probing belong in a separate /api/health/deep route and can be added in a
 * future story once service clients are implemented.
 */

import { NextResponse } from "next/server";
import { config } from "@/config";
import { logger } from "@/lib/observability/logger";

export async function GET(): Promise<NextResponse> {
  logger.info("health check", { category: "health", service: "health" });

  return NextResponse.json({
    status: "ok",
    app: config.app.name,
    environment: config.app.environment,
    timestamp: new Date().toISOString(),
  });
}
