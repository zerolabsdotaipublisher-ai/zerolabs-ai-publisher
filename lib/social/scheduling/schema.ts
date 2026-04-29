import type { SocialSchedule, SocialScheduleRecurrence, SocialScheduleRetryPolicy, SocialScheduleTarget } from "./types";

export const SOCIAL_SCHEDULE_STATUSES = [
  "draft",
  "scheduled",
  "queued",
  "publishing",
  "published",
  "failed",
  "canceled",
  "retry_pending",
] as const;

export const SOCIAL_SCHEDULE_EVENT_TYPES = [
  "scheduled",
  "queued",
  "published",
  "failed",
  "attention_required",
  "retry_pending",
  "canceled",
] as const;

export const SOCIAL_SCHEDULE_DEFAULT_RECURRENCE: SocialScheduleRecurrence = {
  frequency: "once",
  interval: 1,
};

export const SOCIAL_SCHEDULE_DEFAULT_RETRY_POLICY: SocialScheduleRetryPolicy = {
  maxAttempts: 3,
  baseDelayMinutes: 5,
  backoffMultiplier: 2,
};

export const SOCIAL_SCHEDULE_DEFAULT_TARGETS: SocialScheduleTarget[] = [
  { platform: "instagram", enabled: true },
];

export const SOCIAL_SCHEDULE_REQUIREMENTS = {
  mvpPlatforms: ["instagram"] as const,
  futurePlatforms: ["facebook", "linkedin", "x"] as const,
  supportedFrequencies: ["once", "daily", "weekly", "monthly"] as const,
};

export const SOCIAL_SCHEDULE_OUTPUT_EXAMPLE: Omit<SocialSchedule, "id" | "userId" | "createdAt" | "updatedAt"> = {
  structureId: "ws_abc123",
  socialPostId: "social_abc123",
  title: "Launch campaign schedule",
  description: "First publish window",
  timezone: "America/New_York",
  startsAtLocal: "2026-05-01T09:00:00",
  recurrence: {
    frequency: "once",
    interval: 1,
  },
  targets: [
    { platform: "instagram", enabled: true },
    { platform: "linkedin", enabled: true },
  ],
  retryPolicy: {
    maxAttempts: 3,
    baseDelayMinutes: 5,
    backoffMultiplier: 2,
  },
  lifecycle: {
    consecutiveFailures: 0,
    totalRuns: 0,
    successCount: 0,
    failureCount: 0,
    completedOccurrences: 0,
  },
  status: "scheduled",
  scheduledFor: "2026-05-01T13:00:00.000Z",
  lastRunId: undefined,
  lastRun: undefined,
  version: 1,
};
