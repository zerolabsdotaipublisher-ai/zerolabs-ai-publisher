/**
 * Next.js Instrumentation Hook — application startup logging.
 *
 * The register() function is called once when the Next.js server starts.
 * It emits a structured startup log entry so that every deployment surface
 * (Vercel preview, production, local dev) produces a consistent startup
 * signal visible in runtime logs.
 *
 * The NEXT_RUNTIME guard ensures Node.js-specific modules are only imported
 * in the Node.js runtime context (not Edge).
 *
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * See: docs/observability/logging-monitoring.md
 */

import { env } from "./config/env";

export async function register(): Promise<void> {
  if (env.app.nextRuntime === "nodejs") {
    // Dynamic imports ensure this code only executes in Node.js runtime.
    const { logger } = await import("@/lib/observability/logger");

    logger.info("application started", {
      category: "startup",
      service: "app",
    });
  }
}
