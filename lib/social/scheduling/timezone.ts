import {
  convertLocalDateTimeToUtc,
  convertUtcToLocalDateTime,
  formatLocalDateTime,
  isValidTimeZone,
  parseLocalDateTime,
} from "@/lib/scheduling/timezone";

export {
  convertLocalDateTimeToUtc,
  convertUtcToLocalDateTime,
  formatLocalDateTime,
  isValidTimeZone,
  parseLocalDateTime,
};

export function normalizeScheduleTimezone(timezone: string): string {
  const trimmed = timezone.trim();
  return trimmed || "UTC";
}

export function normalizeLocalDateTimeInput(value: string): string {
  const parsed = parseLocalDateTime(value.trim());
  if (!parsed) {
    throw new Error("Local date-time must use YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss format.");
  }

  return formatLocalDateTime(parsed);
}
