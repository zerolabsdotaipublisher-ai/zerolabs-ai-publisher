import type { WebsiteStructure } from "@/lib/ai/structure";
import { deriveTargetContentType, DEFAULT_SCHEDULE_RETRY_POLICY } from "./ids";
import { isValidTimeZone, parseLocalDateTime } from "./timezone";
import type { ContentScheduleUpsertInput, ScheduleRecurrence, ScheduleRetryPolicy } from "./types";

function hasValidLocalDateTime(value: string): boolean {
  return Boolean(parseLocalDateTime(value));
}

function validateRecurrence(recurrence: ScheduleRecurrence): string[] {
  const errors: string[] = [];

  if (!Number.isInteger(recurrence.interval) || recurrence.interval < 1) {
    errors.push("Recurrence interval must be a positive integer.");
  }

  if (recurrence.endAtLocal && !hasValidLocalDateTime(recurrence.endAtLocal)) {
    errors.push("Recurrence endAtLocal must use YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss format.");
  }

  if (recurrence.maxOccurrences !== undefined && (!Number.isInteger(recurrence.maxOccurrences) || recurrence.maxOccurrences < 1)) {
    errors.push("Recurrence maxOccurrences must be a positive integer.");
  }

  if (recurrence.frequency === "weekly" && recurrence.weekdays?.length) {
    const invalidWeekday = recurrence.weekdays.find((weekday) => weekday < 0 || weekday > 6);
    if (invalidWeekday !== undefined) {
      errors.push("Weekly schedules must use weekday values between 0 and 6.");
    }
  }

  if (recurrence.frequency === "monthly" && recurrence.monthDays?.length) {
    const invalidMonthDay = recurrence.monthDays.find((monthDay) => monthDay < 1 || monthDay > 31);
    if (invalidMonthDay !== undefined) {
      errors.push("Monthly schedules must use monthDays values between 1 and 31.");
    }
  }

  return errors;
}

export function normalizeRetryPolicy(input?: Partial<ScheduleRetryPolicy>): ScheduleRetryPolicy {
  return {
    maxAttempts: input?.maxAttempts ?? DEFAULT_SCHEDULE_RETRY_POLICY.maxAttempts,
    baseDelayMinutes: input?.baseDelayMinutes ?? DEFAULT_SCHEDULE_RETRY_POLICY.baseDelayMinutes,
    backoffMultiplier: input?.backoffMultiplier ?? DEFAULT_SCHEDULE_RETRY_POLICY.backoffMultiplier,
  };
}

export function validateContentScheduleInput(
  input: ContentScheduleUpsertInput,
  structure: WebsiteStructure,
): string[] {
  const errors: string[] = [];
  const targetContentType = deriveTargetContentType(structure.websiteType);
  const retryPolicy = normalizeRetryPolicy(input.retryPolicy);

  if (!input.structureId.trim()) {
    errors.push("structureId is required.");
  }

  if (!isValidTimeZone(input.timezone)) {
    errors.push("A valid IANA timezone is required.");
  }

  if (!hasValidLocalDateTime(input.startsAtLocal)) {
    errors.push("startsAtLocal must use YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss format.");
  }

  errors.push(...validateRecurrence(input.recurrence));

  if (input.executionMode === "generate_then_publish" && targetContentType === "website") {
    errors.push("Generate-before-publish is only supported for blog and article websites in MVP.");
  }

  if (!Number.isInteger(retryPolicy.maxAttempts) || retryPolicy.maxAttempts < 1 || retryPolicy.maxAttempts > 5) {
    errors.push("Retry maxAttempts must be between 1 and 5.");
  }

  if (!Number.isInteger(retryPolicy.baseDelayMinutes) || retryPolicy.baseDelayMinutes < 1 || retryPolicy.baseDelayMinutes > 120) {
    errors.push("Retry baseDelayMinutes must be between 1 and 120.");
  }

  if (!Number.isInteger(retryPolicy.backoffMultiplier) || retryPolicy.backoffMultiplier < 1 || retryPolicy.backoffMultiplier > 4) {
    errors.push("Retry backoffMultiplier must be between 1 and 4.");
  }

  if (structure.management?.deletedAt) {
    errors.push("Deleted websites cannot be scheduled.");
  }

  if (structure.status === "archived") {
    errors.push("Archived websites cannot be scheduled until they are reactivated.");
  }

  return errors;
}
