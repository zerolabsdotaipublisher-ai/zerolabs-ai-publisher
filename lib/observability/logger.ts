/**
 * Centralized logging module for Zero Labs AI Publisher.
 *
 * This is the ONLY place in the codebase that should use console.log /
 * console.error directly.  All other modules must call logger.* methods.
 *
 * Design:
 * - Emits structured JSON to stdout (info/debug) and stderr (error/warn)
 * - Compatible with Vercel runtime logs and any log drain
 * - Reads app name and environment from the centralized config layer
 *
 * Usage:
 *
 *   import { logger } from "@/lib/observability/logger";
 *
 *   logger.info("user signed in", { category: "security", service: "auth", requestId });
 *   logger.error("db query failed", { category: "error", service: "supabase", error: normalizeError(err) });
 *
 * See docs/observability/logging-monitoring.md for the full strategy.
 */

import { config } from "@/config";
import type { LogEntry, LogLevel } from "./schema";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Fields accepted as additional metadata on any log call. */
export interface LogMeta {
  service?: string;
  category?: LogEntry["category"];
  requestId?: string;
  durationMs?: number;
  error?: LogEntry["error"];
  [key: string]: unknown;
}

function buildEntry(
  level: LogLevel,
  message: string,
  meta?: LogMeta
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    app: config.app.name,
    environment: config.app.environment,
    ...meta,
  };
}

function write(level: LogLevel, entry: LogEntry): void {
  const line = JSON.stringify(entry);
  if (level === "error" || level === "warn") {
    console.error(line); // → stderr
  } else {
    console.log(line); // → stdout
  }
}

// ---------------------------------------------------------------------------
// Public logger API
// ---------------------------------------------------------------------------

function error(message: string, meta?: LogMeta): void {
  write("error", buildEntry("error", message, meta));
}

function warn(message: string, meta?: LogMeta): void {
  write("warn", buildEntry("warn", message, meta));
}

function info(message: string, meta?: LogMeta): void {
  write("info", buildEntry("info", message, meta));
}

function debug(message: string, meta?: LogMeta): void {
  write("debug", buildEntry("debug", message, meta));
}

/**
 * Centralized logger.
 *
 * All log output is structured JSON emitted to stdout/stderr — visible in
 * Vercel's deployment logs and any attached log drain.
 */
export const logger = { error, warn, info, debug };
