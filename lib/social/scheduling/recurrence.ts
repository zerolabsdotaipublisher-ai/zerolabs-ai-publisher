import { getNextOccurrenceUtc } from "@/lib/scheduling/recurrence";
import type { SocialSchedule, SocialScheduleRecurrence } from "./types";

export function computeNextSocialScheduleRunAt(
  schedule: Pick<SocialSchedule, "startsAtLocal" | "recurrence" | "timezone" | "lifecycle">,
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
    schedule.recurrence as SocialScheduleRecurrence,
    schedule.timezone,
    referenceAt,
  );
}
