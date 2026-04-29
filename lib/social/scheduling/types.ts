import type { SocialPlatform } from "@/lib/social/types";

export type SocialScheduleStatus =
  | "draft"
  | "scheduled"
  | "queued"
  | "publishing"
  | "published"
  | "failed"
  | "canceled"
  | "retry_pending";

export type SocialScheduleFrequency = "once" | "daily" | "weekly" | "monthly";

export type SocialScheduleRunStatus =
  | "queued"
  | "publishing"
  | "published"
  | "failed"
  | "retry_pending"
  | "canceled";

export type SocialScheduleTriggerSource = "scheduled" | "manual" | "retry";

export type SocialScheduleEventType =
  | "scheduled"
  | "queued"
  | "published"
  | "failed"
  | "attention_required"
  | "retry_pending"
  | "canceled";

export interface SocialScheduleTarget {
  platform: SocialPlatform;
  enabled: boolean;
}

export interface SocialScheduleRecurrence {
  frequency: SocialScheduleFrequency;
  interval: number;
  weekdays?: number[];
  monthDays?: number[];
  endAtLocal?: string;
  maxOccurrences?: number;
}

export interface SocialScheduleRetryPolicy {
  maxAttempts: number;
  baseDelayMinutes: number;
  backoffMultiplier: number;
}

export interface SocialScheduleLifecycle {
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

export interface SocialScheduleLogEntry {
  at: string;
  phase: "queue" | "publish" | "completion" | "retry" | "throttle";
  level: "info" | "warn" | "error";
  message: string;
  details?: Record<string, unknown>;
}

export interface SocialScheduleRunRecord {
  id: string;
  scheduleId: string;
  userId: string;
  socialPostId: string;
  status: SocialScheduleRunStatus;
  attempt: number;
  scheduledFor: string;
  startedAt?: string;
  completedAt?: string;
  triggerSource: SocialScheduleTriggerSource;
  targetPlatforms: SocialPlatform[];
  publishedPlatforms: SocialPlatform[];
  failedPlatforms: SocialPlatform[];
  queuedJobs: Array<{ platform: SocialPlatform; jobId: string; status: string }>;
  retryable: boolean;
  error?: string;
  logs: SocialScheduleLogEntry[];
  nextRetryAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialScheduleEvent {
  id: string;
  scheduleId: string;
  userId: string;
  runId?: string;
  eventType: SocialScheduleEventType;
  severity: "info" | "warning" | "error";
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface SocialSchedule {
  id: string;
  userId: string;
  structureId?: string;
  socialPostId: string;
  title: string;
  description?: string;
  timezone: string;
  startsAtLocal: string;
  recurrence: SocialScheduleRecurrence;
  targets: SocialScheduleTarget[];
  retryPolicy: SocialScheduleRetryPolicy;
  lifecycle: SocialScheduleLifecycle;
  status: SocialScheduleStatus;
  scheduledFor?: string;
  lastRunId?: string;
  lastRun?: SocialScheduleRunRecord;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SocialScheduleUpsertInput {
  socialPostId: string;
  title?: string;
  description?: string;
  timezone: string;
  startsAtLocal: string;
  recurrence?: Partial<SocialScheduleRecurrence>;
  targets: SocialScheduleTarget[];
  retryPolicy?: Partial<SocialScheduleRetryPolicy>;
  status?: Extract<SocialScheduleStatus, "draft" | "scheduled">;
}

export interface SocialScheduleExecutionResult {
  schedule: SocialSchedule;
  run: SocialScheduleRunRecord;
}

export interface SocialScheduleExecutionBatchResult {
  claimedCount: number;
  processedCount: number;
  schedules: SocialScheduleExecutionResult[];
}

export interface SocialScheduleRow {
  id: string;
  user_id: string;
  structure_id?: string | null;
  social_post_id: string;
  title: string;
  description?: string | null;
  timezone: string;
  starts_at_local: string;
  recurrence_json: unknown;
  targets_json: unknown;
  retry_policy_json: unknown;
  lifecycle_json: unknown;
  status: SocialScheduleStatus;
  scheduled_for?: string | null;
  last_run_id?: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface SocialScheduleRunRow {
  id: string;
  schedule_id: string;
  user_id: string;
  social_post_id: string;
  status: SocialScheduleRunStatus;
  attempt: number;
  scheduled_for: string;
  started_at?: string | null;
  completed_at?: string | null;
  trigger_source: SocialScheduleTriggerSource;
  target_platforms: string[];
  published_platforms: string[];
  failed_platforms: string[];
  queued_jobs_json: unknown;
  retryable: boolean;
  error?: string | null;
  logs_json: unknown;
  next_retry_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialScheduleEventRow {
  id: string;
  schedule_id: string;
  user_id: string;
  run_id?: string | null;
  event_type: SocialScheduleEventType;
  severity: "info" | "warning" | "error";
  message: string;
  metadata_json: unknown;
  created_at: string;
}
