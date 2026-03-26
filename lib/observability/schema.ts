/**
 * Structured log schema for Zero Labs AI Publisher.
 *
 * All log entries emitted by the centralized logger conform to this schema.
 * Fields must be machine-readable JSON so logs are queryable in Vercel's
 * log drain and any downstream aggregation layer.
 *
 * See docs/observability/logging-monitoring.md for the full logging strategy.
 */

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

/** Severity level — maps to standard syslog-style levels. */
export type LogLevel = "error" | "warn" | "info" | "debug";

/**
 * High-level event category — used to slice and filter logs by concern.
 *
 * | Category      | When to use                                        |
 * |---------------|----------------------------------------------------|
 * | startup       | App or service initialisation                      |
 * | request       | Inbound HTTP request lifecycle                     |
 * | config        | Configuration load, validation, or change          |
 * | health        | Health-check endpoint access                       |
 * | service_call  | Outbound call to an external service               |
 * | security      | Auth failure, permission check, secret-related     |
 * | error         | Unhandled exception or unexpected error condition  |
 */
export type EventCategory =
  | "startup"
  | "request"
  | "config"
  | "health"
  | "service_call"
  | "security"
  | "error";

// ---------------------------------------------------------------------------
// Error field
// ---------------------------------------------------------------------------

/**
 * Normalised error representation embedded in a log entry.
 * Avoids exposing raw stack traces outside server logs.
 */
export interface NormalizedErrorField {
  /** Error class name (e.g. "TypeError", "Error"). */
  name: string;
  /** Human-readable error message — never include secrets. */
  message: string;
  /** Stack trace — only included in non-production environments. */
  stack?: string;
}

// ---------------------------------------------------------------------------
// Log entry
// ---------------------------------------------------------------------------

/**
 * Standard structured log entry.
 *
 * Required fields are always present.  Optional fields are populated where
 * applicable.  Additional context can be appended via the index signature.
 *
 * Redaction rules:
 * - Never log API keys, tokens, or passwords.
 * - Never log personally-identifiable information (email, name, IP).
 * - Truncate payloads larger than ~4 KB before logging.
 */
export interface LogEntry {
  // --- Required fields ---
  /** ISO 8601 UTC timestamp. */
  timestamp: string;
  /** Severity level. */
  level: LogLevel;
  /** Human-readable description of the event. */
  message: string;
  /** Application name from NEXT_PUBLIC_APP_NAME. */
  app: string;
  /** Runtime environment: production | preview | development. */
  environment: string;

  // --- Common optional fields ---
  /** Module or service that emitted this log (e.g. "api", "supabase"). */
  service?: string;
  /** High-level event category for structured filtering. */
  category?: EventCategory;
  /** Correlation ID for the inbound HTTP request. */
  requestId?: string;
  /** Elapsed time in milliseconds. */
  durationMs?: number;
  /** Normalised error details. */
  error?: NormalizedErrorField;

  // --- Arbitrary additional context ---
  /** Any additional structured metadata; never include secrets. */
  [key: string]: unknown;
}
