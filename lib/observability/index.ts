/**
 * Public API for the observability module.
 *
 * Import from "@/lib/observability" for all logging, error handling,
 * request context, metrics, and external service logging needs.
 *
 * See docs/observability/logging-monitoring.md for usage guidance.
 */

export { logger } from "./logger";
export type { LogMeta } from "./logger";

export { normalizeError, logError } from "./error-utils";

export { createRequestId, withRequestLogging } from "./request-context";

export { metrics } from "./metrics";
export type {
  MetricCounters,
  DurationSummary,
  MetricsSnapshot,
} from "./metrics";

export {
  logServiceCall,
  logServiceSuccess,
  logServiceError,
  withServiceLogging,
} from "./external-service";
export type { ExternalService } from "./external-service";

export type {
  LogLevel,
  LogEntry,
  EventCategory,
  NormalizedErrorField,
} from "./schema";
