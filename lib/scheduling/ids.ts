import type { WebsiteType } from "@/lib/ai/structure";
import type {
  ScheduleRetryPolicy,
  ScheduleTargetContentType,
  ScheduleLifecycle,
} from "./types";

export const DEFAULT_SCHEDULE_RETRY_POLICY: ScheduleRetryPolicy = {
  maxAttempts: 3,
  baseDelayMinutes: 5,
  backoffMultiplier: 2,
};

export function createContentScheduleId(structureId: string): string {
  return `csched_${structureId}`;
}

export function createContentScheduleRunId(scheduleId: string, at: string): string {
  const normalizedTimestamp = at.replace(/[^0-9]/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `csrun_${scheduleId}_${normalizedTimestamp}_${suffix}`;
}

export function createDefaultScheduleLifecycle(): ScheduleLifecycle {
  return {
    consecutiveFailures: 0,
    totalRuns: 0,
    successCount: 0,
    failureCount: 0,
    completedOccurrences: 0,
  };
}

export function deriveTargetContentType(websiteType: WebsiteType): ScheduleTargetContentType {
  switch (websiteType) {
    case "blog":
      return "blog";
    case "article":
      return "article";
    default:
      return "website";
  }
}

export function createDefaultScheduleTitle(websiteType: WebsiteType, targetContentType: ScheduleTargetContentType): string {
  if (targetContentType === "blog") {
    return websiteType === "blog" ? "Scheduled blog publishing" : "Scheduled content publishing";
  }

  if (targetContentType === "article") {
    return websiteType === "article" ? "Scheduled article publishing" : "Scheduled content publishing";
  }

  return "Scheduled website publishing";
}
