import type { WebsiteType } from "@/lib/ai/structure";
import {
  createDefaultScheduleLifecycle,
  createDefaultScheduleTitle,
  deriveTargetContentType,
} from "./ids";
import { getLocalWeekday, parseLocalDateTime } from "./timezone";
import type {
  ContentSchedule,
  ContentScheduleSummary,
  ContentScheduleUpsertInput,
  ScheduleLifecycle,
  ScheduleRecurrence,
  ScheduleRetryPolicy,
} from "./types";
import { normalizeRetryPolicy } from "./validation";

export interface NormalizedContentScheduleInput
  extends Omit<ContentScheduleUpsertInput, "title" | "description" | "recurrence" | "retryPolicy"> {
  title: string;
  description?: string;
  recurrence: ScheduleRecurrence;
  retryPolicy: ScheduleRetryPolicy;
}

export function normalizeScheduleLifecycle(
  lifecycle: Partial<ScheduleLifecycle> | undefined,
): ScheduleLifecycle {
  return {
    ...createDefaultScheduleLifecycle(),
    ...(lifecycle ?? {}),
  };
}

export function normalizeScheduleRecurrence(
  recurrence: ScheduleRecurrence,
  startsAtLocal: string,
): ScheduleRecurrence {
  const parsed = parseLocalDateTime(startsAtLocal);
  const normalized: ScheduleRecurrence = {
    frequency: recurrence.frequency,
    interval: recurrence.interval,
    endAtLocal: recurrence.endAtLocal,
    maxOccurrences: recurrence.maxOccurrences,
  };

  if (recurrence.frequency === "weekly") {
    normalized.weekdays =
      recurrence.weekdays?.length && recurrence.weekdays.length > 0
        ? Array.from(new Set(recurrence.weekdays)).sort((left, right) => left - right)
        : parsed
          ? [getLocalWeekday(parsed)]
          : [0];
  }

  if (recurrence.frequency === "monthly") {
    normalized.monthDays =
      recurrence.monthDays?.length && recurrence.monthDays.length > 0
        ? Array.from(new Set(recurrence.monthDays)).sort((left, right) => left - right)
        : parsed
          ? [parsed.day]
          : [1];
  }

  return normalized;
}

export function normalizeScheduleInput(
  input: ContentScheduleUpsertInput,
  websiteType: WebsiteType,
  currentRetryPolicy?: ScheduleRetryPolicy,
): NormalizedContentScheduleInput {
  const targetContentType = deriveTargetContentType(websiteType);

  return {
    ...input,
    title:
      input.title?.trim() ||
      createDefaultScheduleTitle(websiteType, targetContentType),
    description: input.description?.trim() || undefined,
    recurrence: normalizeScheduleRecurrence(input.recurrence, input.startsAtLocal),
    retryPolicy: normalizeRetryPolicy(input.retryPolicy ?? currentRetryPolicy),
  };
}

export function toContentScheduleSummary(schedule: ContentSchedule): ContentScheduleSummary {
  return {
    id: schedule.id,
    status: schedule.status,
    executionMode: schedule.executionMode,
    targetContentType: schedule.targetContentType,
    timezone: schedule.timezone,
    nextRunAt: schedule.nextRunAt,
    lastRunAt: schedule.lifecycle.lastCompletedAt,
    recurrenceFrequency: schedule.recurrence.frequency,
  };
}
