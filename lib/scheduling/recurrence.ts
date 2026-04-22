import { convertLocalDateTimeToUtc, convertUtcToLocalDateTime, daysBetween, formatLocalDateTime, getLocalWeekday, parseLocalDateTime, toComparableTimestamp, addDays, addMonths, daysInMonth } from "./timezone";
import type { ContentSchedule, ScheduleRecurrence } from "./types";

const MAX_DAILY_SEARCH_DAYS = 365 * 3;
const MAX_WEEKLY_SEARCH_DAYS = 365 * 3;
const MAX_MONTHLY_SEARCH_MONTHS = 12 * 5;

function appliesEndLimit(candidateLocal: string, recurrence: ScheduleRecurrence): boolean {
  if (!recurrence.endAtLocal) {
    return true;
  }

  const end = parseLocalDateTime(recurrence.endAtLocal);
  const candidate = parseLocalDateTime(candidateLocal);
  if (!end || !candidate) {
    return false;
  }

  return toComparableTimestamp(candidate) <= toComparableTimestamp(end);
}

function findDailyOccurrence(
  startsAtLocal: string,
  recurrence: ScheduleRecurrence,
  referenceLocal: number,
): string | undefined {
  const start = parseLocalDateTime(startsAtLocal);
  if (!start) {
    return undefined;
  }

  for (let offset = 0; offset <= MAX_DAILY_SEARCH_DAYS; offset += 1) {
    const candidate = addDays(start, offset);
    const dayGap = daysBetween(start, candidate);
    if (dayGap % recurrence.interval !== 0) {
      continue;
    }

    const candidateLocal = formatLocalDateTime(candidate);
    if (toComparableTimestamp(candidate) < referenceLocal) {
      continue;
    }

    if (!appliesEndLimit(candidateLocal, recurrence)) {
      return undefined;
    }

    return candidateLocal;
  }

  return undefined;
}

function findWeeklyOccurrence(
  startsAtLocal: string,
  recurrence: ScheduleRecurrence,
  referenceLocal: number,
): string | undefined {
  const start = parseLocalDateTime(startsAtLocal);
  if (!start) {
    return undefined;
  }

  const weekdays = recurrence.weekdays?.length
    ? Array.from(new Set(recurrence.weekdays)).sort((left, right) => left - right)
    : [getLocalWeekday(start)];

  for (let offset = 0; offset <= MAX_WEEKLY_SEARCH_DAYS; offset += 1) {
    const candidate = addDays(start, offset);
    const weekday = getLocalWeekday(candidate);
    if (!weekdays.includes(weekday)) {
      continue;
    }

    const dayGap = daysBetween(start, candidate);
    const weekGap = Math.floor(dayGap / 7);
    if (weekGap % recurrence.interval !== 0) {
      continue;
    }

    const candidateLocal = formatLocalDateTime(candidate);
    if (toComparableTimestamp(candidate) < referenceLocal) {
      continue;
    }

    if (!appliesEndLimit(candidateLocal, recurrence)) {
      return undefined;
    }

    return candidateLocal;
  }

  return undefined;
}

function findMonthlyOccurrence(
  startsAtLocal: string,
  recurrence: ScheduleRecurrence,
  referenceLocal: number,
): string | undefined {
  const start = parseLocalDateTime(startsAtLocal);
  if (!start) {
    return undefined;
  }

  const monthDays = recurrence.monthDays?.length
    ? Array.from(new Set(recurrence.monthDays)).sort((left, right) => left - right)
    : [start.day];

  for (let monthOffset = 0; monthOffset <= MAX_MONTHLY_SEARCH_MONTHS; monthOffset += 1) {
    if (monthOffset % recurrence.interval !== 0) {
      continue;
    }

    const monthSeed = addMonths(start, monthOffset, 1);
    const maxDay = daysInMonth(monthSeed.year, monthSeed.month);
    for (const monthDay of monthDays) {
      if (monthDay < 1 || monthDay > maxDay) {
        continue;
      }

      const candidate = {
        ...monthSeed,
        day: monthDay,
        hour: start.hour,
        minute: start.minute,
        second: start.second,
      };
      const candidateLocal = formatLocalDateTime(candidate);
      if (toComparableTimestamp(candidate) < toComparableTimestamp(start)) {
        continue;
      }

      if (toComparableTimestamp(candidate) < referenceLocal) {
        continue;
      }

      if (!appliesEndLimit(candidateLocal, recurrence)) {
        return undefined;
      }

      return candidateLocal;
    }
  }

  return undefined;
}

export function getNextOccurrenceLocal(
  startsAtLocal: string,
  recurrence: ScheduleRecurrence,
  timeZone: string,
  referenceAt: string,
): string | undefined {
  const referenceLocal = toComparableTimestamp(convertUtcToLocalDateTime(referenceAt, timeZone));
  switch (recurrence.frequency) {
    case "once": {
      const start = parseLocalDateTime(startsAtLocal);
      if (!start) {
        return undefined;
      }
      return toComparableTimestamp(start) >= referenceLocal ? formatLocalDateTime(start) : undefined;
    }
    case "daily":
      return findDailyOccurrence(startsAtLocal, recurrence, referenceLocal);
    case "weekly":
      return findWeeklyOccurrence(startsAtLocal, recurrence, referenceLocal);
    case "monthly":
      return findMonthlyOccurrence(startsAtLocal, recurrence, referenceLocal);
    default:
      return undefined;
  }
}

export function getNextOccurrenceUtc(
  startsAtLocal: string,
  recurrence: ScheduleRecurrence,
  timeZone: string,
  referenceAt: string,
): string | undefined {
  const nextLocal = getNextOccurrenceLocal(startsAtLocal, recurrence, timeZone, referenceAt);
  if (!nextLocal) {
    return undefined;
  }

  const nextParts = parseLocalDateTime(nextLocal);
  if (!nextParts) {
    return undefined;
  }

  return convertLocalDateTimeToUtc(nextParts, timeZone).toISOString();
}

export function computeNextRunAt(
  schedule: Pick<ContentSchedule, "startsAtLocal" | "recurrence" | "timezone" | "lifecycle">,
  referenceAt: string,
  options?: { occurrenceCompleted?: boolean },
): string | undefined {
  const maxOccurrences = schedule.recurrence.maxOccurrences;
  if (
    maxOccurrences &&
    options?.occurrenceCompleted &&
    schedule.lifecycle.completedOccurrences >= maxOccurrences
  ) {
    return undefined;
  }

  return getNextOccurrenceUtc(
    schedule.startsAtLocal,
    schedule.recurrence,
    schedule.timezone,
    referenceAt,
  );
}
