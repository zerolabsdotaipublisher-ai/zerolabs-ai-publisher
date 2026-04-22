export interface LocalDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const weekdayMap: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const utcFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    hour12: false,
  });
}

function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((part) => part.type === type)?.value ?? "";
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    getFormatter(timeZone).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function parseLocalDateTime(value: string): LocalDateTimeParts | null {
  const match = value.trim().match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match;
  const parsed: LocalDateTimeParts = {
    year: Number.parseInt(year, 10),
    month: Number.parseInt(month, 10),
    day: Number.parseInt(day, 10),
    hour: Number.parseInt(hour, 10),
    minute: Number.parseInt(minute, 10),
    second: Number.parseInt(second ?? "0", 10),
  };

  if (
    parsed.month < 1 ||
    parsed.month > 12 ||
    parsed.day < 1 ||
    parsed.day > 31 ||
    parsed.hour < 0 ||
    parsed.hour > 23 ||
    parsed.minute < 0 ||
    parsed.minute > 59 ||
    parsed.second < 0 ||
    parsed.second > 59
  ) {
    return null;
  }

  return parsed;
}

export function formatLocalDateTime(parts: LocalDateTimeParts): string {
  const year = parts.year.toString().padStart(4, "0");
  const month = parts.month.toString().padStart(2, "0");
  const day = parts.day.toString().padStart(2, "0");
  const hour = parts.hour.toString().padStart(2, "0");
  const minute = parts.minute.toString().padStart(2, "0");
  const second = parts.second.toString().padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

export function toComparableTimestamp(parts: LocalDateTimeParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

export function toComparableDate(parts: Pick<LocalDateTimeParts, "year" | "month" | "day">): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day);
}

export function getLocalWeekday(parts: Pick<LocalDateTimeParts, "year" | "month" | "day">): number {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function addDays(parts: LocalDateTimeParts, days: number): LocalDateTimeParts {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days, parts.hour, parts.minute, parts.second));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
  };
}

export function addMonths(parts: LocalDateTimeParts, months: number, dayOverride?: number): LocalDateTimeParts {
  const date = new Date(Date.UTC(parts.year, parts.month - 1 + months, 1, parts.hour, parts.minute, parts.second));
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = Math.min(dayOverride ?? parts.day, daysInMonth(year, month));

  return {
    year,
    month,
    day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

export function daysBetween(
  start: Pick<LocalDateTimeParts, "year" | "month" | "day">,
  end: Pick<LocalDateTimeParts, "year" | "month" | "day">,
): number {
  return Math.round((toComparableDate(end) - toComparableDate(start)) / 86_400_000);
}

export function getTimeZoneParts(date: Date, timeZone: string): LocalDateTimeParts & { weekday: number } {
  const parts = getFormatter(timeZone).formatToParts(date);
  return {
    year: Number.parseInt(getPart(parts, "year"), 10),
    month: Number.parseInt(getPart(parts, "month"), 10),
    day: Number.parseInt(getPart(parts, "day"), 10),
    hour: Number.parseInt(getPart(parts, "hour"), 10),
    minute: Number.parseInt(getPart(parts, "minute"), 10),
    second: Number.parseInt(getPart(parts, "second"), 10),
    weekday: weekdayMap[getPart(parts, "weekday")] ?? 0,
  };
}

export function convertUtcToLocalDateTime(value: string | Date, timeZone: string): LocalDateTimeParts {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = getTimeZoneParts(date, timeZone);

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

function convertUtcToUtcParts(date: Date): LocalDateTimeParts {
  const parts = utcFormatter.formatToParts(date);
  return {
    year: Number.parseInt(getPart(parts, "year"), 10),
    month: Number.parseInt(getPart(parts, "month"), 10),
    day: Number.parseInt(getPart(parts, "day"), 10),
    hour: Number.parseInt(getPart(parts, "hour"), 10),
    minute: Number.parseInt(getPart(parts, "minute"), 10),
    second: Number.parseInt(getPart(parts, "second"), 10),
  };
}

export function convertLocalDateTimeToUtc(parts: LocalDateTimeParts, timeZone: string): Date {
  let guess = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second),
  );

  for (let index = 0; index < 4; index += 1) {
    const zoned = convertUtcToLocalDateTime(guess, timeZone);
    const diff = toComparableTimestamp(parts) - toComparableTimestamp(zoned);
    if (diff === 0) {
      break;
    }
    guess = new Date(guess.getTime() + diff);
  }

  const normalized = convertUtcToUtcParts(guess);
  return new Date(
    Date.UTC(
      normalized.year,
      normalized.month - 1,
      normalized.day,
      normalized.hour,
      normalized.minute,
      normalized.second,
    ),
  );
}
