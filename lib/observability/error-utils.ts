/**
 * Error normalisation utilities.
 *
 * Converts any thrown value into a consistent NormalizedErrorField shape
 * suitable for embedding in a structured log entry.
 *
 * Redaction note: never pass objects that contain API keys, tokens, or
 * personally-identifiable information directly into these helpers.
 *
 * Usage:
 *
 *   import { normalizeError, logError } from "@/lib/observability/error-utils";
 *
 *   try { ... } catch (err) {
 *     logger.error("operation failed", { error: normalizeError(err) });
 *     // or shorthand:
 *     logError(logger, "operation failed", err, { category: "error" });
 *   }
 */

import type { NormalizedErrorField } from "./schema";
import type { LogMeta } from "./logger";
import { config } from "@/config";

// ---------------------------------------------------------------------------
// normalizeError
// ---------------------------------------------------------------------------

/**
 * Converts any thrown value into a safe NormalizedErrorField.
 *
 * - In production: stack trace is omitted to avoid leaking internal paths.
 * - In preview/development: stack trace is included to aid debugging.
 */
export function normalizeError(err: unknown): NormalizedErrorField {
  const includeStack = config.app.environment !== "production";

  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      ...(includeStack && err.stack ? { stack: err.stack } : {}),
    };
  }

  if (typeof err === "string") {
    return { name: "StringError", message: err };
  }

  if (err !== null && typeof err === "object") {
    const obj = err as Record<string, unknown>;
    return {
      name: typeof obj["name"] === "string" ? obj["name"] : "UnknownError",
      message:
        typeof obj["message"] === "string"
          ? obj["message"]
          : JSON.stringify(err),
    };
  }

  return { name: "UnknownError", message: String(err) };
}

// ---------------------------------------------------------------------------
// logError — shorthand helper
// ---------------------------------------------------------------------------

/** Minimal interface that matches the logger.error signature. */
interface ErrorLogger {
  error(message: string, meta?: LogMeta): void;
}

/**
 * Convenience wrapper that normalises the thrown value and calls
 * logger.error() with the result.
 *
 * @param log     - The logger instance (typically the shared `logger`)
 * @param message - Human-readable description of what failed
 * @param err     - The caught value (Error, string, or unknown)
 * @param meta    - Additional structured metadata to include
 */
export function logError(
  log: ErrorLogger,
  message: string,
  err: unknown,
  meta?: LogMeta
): void {
  log.error(message, { ...meta, error: normalizeError(err) });
}
