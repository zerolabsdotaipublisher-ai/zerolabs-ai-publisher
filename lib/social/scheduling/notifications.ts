import "server-only";

import { logger } from "@/lib/observability";
import { createSocialScheduleEventId, saveSocialScheduleEvent } from "./storage";
import type { SocialSchedule, SocialScheduleEventType, SocialScheduleRunRecord } from "./types";

export async function recordSocialScheduleEvent(input: {
  schedule: Pick<SocialSchedule, "id" | "userId">;
  run?: Pick<SocialScheduleRunRecord, "id">;
  eventType: SocialScheduleEventType;
  severity: "info" | "warning" | "error";
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await saveSocialScheduleEvent({
    id: createSocialScheduleEventId(input.schedule.id),
    scheduleId: input.schedule.id,
    userId: input.schedule.userId,
    runId: input.run?.id,
    eventType: input.eventType,
    severity: input.severity,
    message: input.message,
    metadata: input.metadata ?? {},
    createdAt: new Date().toISOString(),
  });
}

export async function notifySocialSchedulePublished(
  schedule: Pick<SocialSchedule, "id" | "userId">,
  run: Pick<SocialScheduleRunRecord, "id" | "publishedPlatforms">,
): Promise<void> {
  await recordSocialScheduleEvent({
    schedule,
    run,
    eventType: "published",
    severity: "info",
    message: "Scheduled social publish completed.",
    metadata: {
      publishedPlatforms: run.publishedPlatforms,
    },
  });
}

export async function notifySocialScheduleFailure(
  schedule: Pick<SocialSchedule, "id" | "userId">,
  run: Pick<SocialScheduleRunRecord, "id" | "failedPlatforms" | "error" | "nextRetryAt">,
): Promise<void> {
  await recordSocialScheduleEvent({
    schedule,
    run,
    eventType: run.nextRetryAt ? "retry_pending" : "failed",
    severity: run.nextRetryAt ? "warning" : "error",
    message: run.error || "Scheduled social publish failed.",
    metadata: {
      failedPlatforms: run.failedPlatforms,
      nextRetryAt: run.nextRetryAt,
    },
  });
}

export async function notifySocialScheduleAttentionRequired(
  schedule: Pick<SocialSchedule, "id" | "userId">,
  run: Pick<SocialScheduleRunRecord, "id">,
  details: Record<string, unknown>,
): Promise<void> {
  await recordSocialScheduleEvent({
    schedule,
    run,
    eventType: "attention_required",
    severity: "warning",
    message: "Scheduled social publish requires attention.",
    metadata: details,
  });
}

export function logSocialScheduleNotificationError(error: unknown, scheduleId: string): void {
  logger.error("Social scheduling notification event failed", {
    category: "error",
    service: "social_scheduling",
    scheduleId,
    error: {
      name: "SocialScheduleNotificationError",
      message: error instanceof Error ? error.message : "Unknown error",
    },
  });
}
