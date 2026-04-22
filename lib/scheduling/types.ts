import type { WebsiteType } from "@/lib/ai/structure";
import type { PublishAction } from "@/lib/publish";

export type ScheduleStatus =
  | "active"
  | "paused"
  | "running"
  | "failed"
  | "completed"
  | "cancelled";

export type ScheduleFrequency = "once" | "daily" | "weekly" | "monthly";

export type ScheduleExecutionMode = "publish_existing" | "generate_then_publish";

export type ScheduleTargetContentType = "website" | "blog" | "article";

export type ScheduleRunStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "retry_scheduled"
  | "skipped";

export type ScheduleTriggerSource = "scheduled" | "manual" | "retry";

export interface ScheduleRecurrence {
  frequency: ScheduleFrequency;
  interval: number;
  weekdays?: number[];
  monthDays?: number[];
  endAtLocal?: string;
  maxOccurrences?: number;
}

export interface ScheduleRetryPolicy {
  maxAttempts: number;
  baseDelayMinutes: number;
  backoffMultiplier: number;
}

export interface ScheduleLifecycle {
  lastQueuedAt?: string;
  lastStartedAt?: string;
  lastCompletedAt?: string;
  lastSucceededAt?: string;
  lastFailedAt?: string;
  lastError?: string;
  nextRetryAt?: string;
  consecutiveFailures: number;
  totalRuns: number;
  successCount: number;
  failureCount: number;
  completedOccurrences: number;
}

export interface ScheduleRunLogEntry {
  at: string;
  phase: "queue" | "generation" | "publish" | "deployment" | "completion" | "retry";
  level: "info" | "warn" | "error";
  message: string;
  details?: Record<string, unknown>;
}

export interface ScheduleRunMetrics {
  durationMs?: number;
  generationDurationMs?: number;
  publishDurationMs?: number;
  batchPosition?: number;
}

export interface ContentScheduleRunRecord {
  id: string;
  scheduleId: string;
  structureId: string;
  userId: string;
  status: ScheduleRunStatus;
  attempt: number;
  scheduledFor: string;
  startedAt?: string;
  completedAt?: string;
  executionMode: ScheduleExecutionMode;
  publishAction?: PublishAction;
  triggerSource: ScheduleTriggerSource;
  retryable: boolean;
  error?: string;
  logs: ScheduleRunLogEntry[];
  metrics: ScheduleRunMetrics;
  nextRetryAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentScheduleSummary {
  id: string;
  status: ScheduleStatus;
  executionMode: ScheduleExecutionMode;
  targetContentType: ScheduleTargetContentType;
  timezone: string;
  nextRunAt?: string;
  lastRunAt?: string;
  recurrenceFrequency: ScheduleFrequency;
}

export interface ContentSchedule {
  id: string;
  structureId: string;
  userId: string;
  title: string;
  description?: string;
  websiteType: WebsiteType;
  targetContentType: ScheduleTargetContentType;
  executionMode: ScheduleExecutionMode;
  timezone: string;
  startsAtLocal: string;
  recurrence: ScheduleRecurrence;
  retryPolicy: ScheduleRetryPolicy;
  lifecycle: ScheduleLifecycle;
  status: ScheduleStatus;
  nextRunAt?: string;
  lastRunId?: string;
  lastRun?: ContentScheduleRunRecord;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContentScheduleUpsertInput {
  structureId: string;
  title?: string;
  description?: string;
  executionMode: ScheduleExecutionMode;
  timezone: string;
  startsAtLocal: string;
  recurrence: ScheduleRecurrence;
  retryPolicy?: Partial<ScheduleRetryPolicy>;
}

export interface ContentScheduleExecutionResult {
  schedule: ContentSchedule;
  run: ContentScheduleRunRecord;
}

export interface ContentScheduleExecutionBatchResult {
  claimedCount: number;
  processedCount: number;
  schedules: ContentScheduleExecutionResult[];
}

export interface ContentScheduleRow {
  id: string;
  structure_id: string;
  user_id: string;
  title: string;
  description?: string | null;
  website_type: WebsiteType;
  target_content_type: ScheduleTargetContentType;
  execution_mode: ScheduleExecutionMode;
  timezone: string;
  starts_at_local: string;
  recurrence_json: unknown;
  retry_policy_json: unknown;
  lifecycle_json: unknown;
  status: ScheduleStatus;
  next_run_at?: string | null;
  last_run_id?: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ContentScheduleRunRow {
  id: string;
  schedule_id: string;
  structure_id: string;
  user_id: string;
  status: ScheduleRunStatus;
  attempt: number;
  scheduled_for: string;
  started_at?: string | null;
  completed_at?: string | null;
  execution_mode: ScheduleExecutionMode;
  publish_action?: PublishAction | null;
  trigger_source: ScheduleTriggerSource;
  retryable: boolean;
  error?: string | null;
  logs_json: unknown;
  metrics_json: unknown;
  next_retry_at?: string | null;
  created_at: string;
  updated_at: string;
}
