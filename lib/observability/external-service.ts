/**
 * External service call logging helpers.
 *
 * Provides a consistent pattern for logging outbound calls to every external
 * service used by Zero Labs AI Publisher:
 *
 *   Supabase · OpenAI · Wasabi · Qdrant · ZeroFlow
 *
 * Usage — wrapping an async call:
 *
 *   import { withServiceLogging } from "@/lib/observability/external-service";
 *
 *   const result = await withServiceLogging(
 *     "openai",
 *     "chat.completions.create",
 *     () => openai.chat.completions.create({ ... }),
 *     { model: "gpt-4o" }          // optional additional context
 *   );
 *
 * Usage — manual logging:
 *
 *   logServiceCall("supabase", "auth.signInWithPassword");
 *   // ... perform call ...
 *   logServiceSuccess("supabase", "auth.signInWithPassword", durationMs);
 *   // or on failure:
 *   logServiceError("supabase", "auth.signInWithPassword", err, durationMs);
 */

import { logger } from "./logger";
import { normalizeError } from "./error-utils";
import { metrics } from "./metrics";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Identifiers for the external services integrated with this application.
 * Extend this union when new services are added.
 */
export type ExternalService =
  | "supabase"
  | "openai"
  | "wasabi"
  | "qdrant"
  | "zeroflow";

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------

/**
 * Emits a debug-level log when an external service call is initiated.
 * Call this immediately before making the outbound request.
 */
export function logServiceCall(
  service: ExternalService,
  operation: string,
  meta?: Record<string, unknown>
): void {
  logger.debug(`${service}: ${operation} started`, {
    category: "service_call",
    service,
    operation,
    ...meta,
  });
}

/**
 * Emits an info-level log when an external service call completes
 * successfully.
 */
export function logServiceSuccess(
  service: ExternalService,
  operation: string,
  durationMs: number,
  meta?: Record<string, unknown>
): void {
  logger.info(`${service}: ${operation} succeeded`, {
    category: "service_call",
    service,
    operation,
    durationMs,
    ...meta,
  });
}

/**
 * Emits an error-level log when an external service call fails.
 * Also increments the externalServiceFailureCount metric.
 */
export function logServiceError(
  service: ExternalService,
  operation: string,
  err: unknown,
  durationMs: number,
  meta?: Record<string, unknown>
): void {
  metrics.increment("externalServiceFailureCount");
  logger.error(`${service}: ${operation} failed`, {
    category: "service_call",
    service,
    operation,
    durationMs,
    error: normalizeError(err),
    ...meta,
  });
}

// ---------------------------------------------------------------------------
// withServiceLogging
// ---------------------------------------------------------------------------

/**
 * Wraps an async external service call with structured logging and metrics.
 *
 * - Emits a debug log when the call starts.
 * - Emits an info log on success with durationMs.
 * - Emits an error log on failure with the normalised error and durationMs.
 * - Increments externalServiceCallCount before the call.
 * - Increments externalServiceFailureCount on failure.
 * - Re-throws the original error so callers can handle it.
 *
 * @param service   - Service identifier (e.g. "openai")
 * @param operation - Operation label (e.g. "chat.completions.create")
 * @param fn        - Async function that performs the service call
 * @param meta      - Optional additional metadata to include in all log entries
 */
export async function withServiceLogging<T>(
  service: ExternalService,
  operation: string,
  fn: () => Promise<T>,
  meta?: Record<string, unknown>
): Promise<T> {
  const start = Date.now();
  metrics.increment("externalServiceCallCount");
  logServiceCall(service, operation, meta);

  try {
    const result = await fn();
    logServiceSuccess(service, operation, Date.now() - start, meta);
    return result;
  } catch (err) {
    logServiceError(service, operation, err, Date.now() - start, meta);
    throw err;
  }
}
