/**
 * In-process metrics foundation for Zero Labs AI Publisher.
 *
 * Provides lightweight counters and duration summaries that accumulate
 * in memory during the lifetime of a Vercel serverless function invocation.
 * These metrics serve as a baseline for monitoring readiness:
 *
 * - Request and error counters feed into alert-readiness thresholds.
 * - Duration summaries provide latency visibility per deployment.
 * - The snapshot() method can be included in health-check responses or
 *   exported to an external store in a future story.
 *
 * ⚠️  Serverless note: Vercel spawns isolated function instances per
 * invocation. In-memory counters do NOT aggregate across instances.
 * For cross-instance metrics, a future story should extend this module
 * to flush to an external store (e.g. Supabase counters, Redis, or a
 * platform-level metrics endpoint). This module is intentionally kept
 * simple and vendor-neutral.
 *
 * Usage:
 *
 *   import { metrics } from "@/lib/observability/metrics";
 *
 *   metrics.increment("requestCount");
 *   metrics.recordDuration("responseDurationMs", 120);
 *   const snap = metrics.snapshot();
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Named counters tracked by this module. */
export interface MetricCounters {
  /** Total inbound requests processed. */
  requestCount: number;
  /** Total requests that resulted in an unhandled error. */
  errorCount: number;
  /** Total outbound external service calls attempted. */
  externalServiceCallCount: number;
  /** Total outbound external service calls that failed. */
  externalServiceFailureCount: number;
}

/** Statistical summary of recorded durations for a given label. */
export interface DurationSummary {
  /** Number of samples recorded. */
  count: number;
  /** Sum of all samples in milliseconds. */
  totalMs: number;
  /** Minimum observed value in milliseconds. */
  minMs: number;
  /** Maximum observed value in milliseconds. */
  maxMs: number;
  /** Mean duration in milliseconds (totalMs / count). */
  avgMs: number;
}

/** Full metrics snapshot — can be serialised to JSON. */
export interface MetricsSnapshot {
  counters: MetricCounters;
  durations: Record<string, DurationSummary>;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const counters: MetricCounters = {
  requestCount: 0,
  errorCount: 0,
  externalServiceCallCount: 0,
  externalServiceFailureCount: 0,
};

const durationState: Record<
  string,
  { count: number; totalMs: number; minMs: number; maxMs: number }
> = {};

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/** Increments a named counter by `amount` (default: 1). */
function increment(key: keyof MetricCounters, amount = 1): void {
  counters[key] += amount;
}

/** Returns the current value of a named counter. */
function getCounter(key: keyof MetricCounters): number {
  return counters[key];
}

/** Records a duration sample (in milliseconds) under the given label. */
function recordDuration(label: string, ms: number): void {
  const existing = durationState[label];
  if (!existing) {
    durationState[label] = { count: 1, totalMs: ms, minMs: ms, maxMs: ms };
    return;
  }
  existing.count += 1;
  existing.totalMs += ms;
  if (ms < existing.minMs) existing.minMs = ms;
  if (ms > existing.maxMs) existing.maxMs = ms;
}

/** Returns the duration summary for the given label, or undefined. */
function getDuration(label: string): DurationSummary | undefined {
  const d = durationState[label];
  if (!d) return undefined;
  return { ...d, avgMs: d.totalMs / d.count };
}

/** Returns a point-in-time snapshot of all counters and durations. */
function snapshot(): MetricsSnapshot {
  const durations: Record<string, DurationSummary> = {};
  for (const [label, d] of Object.entries(durationState)) {
    durations[label] = { ...d, avgMs: d.totalMs / d.count };
  }
  return { counters: { ...counters }, durations };
}

/**
 * Resets all counters and duration records to zero.
 * Useful in tests to isolate metric state between cases.
 */
function reset(): void {
  counters.requestCount = 0;
  counters.errorCount = 0;
  counters.externalServiceCallCount = 0;
  counters.externalServiceFailureCount = 0;
  for (const key of Object.keys(durationState)) {
    delete durationState[key];
  }
}

/** In-process metrics instance. */
export const metrics = {
  increment,
  getCounter,
  recordDuration,
  getDuration,
  snapshot,
  reset,
};
