import type { GeneratedSocialPost, SocialPlatform } from "@/lib/social/types";
import {
  SOCIAL_SCHEDULE_DEFAULT_RECURRENCE,
  SOCIAL_SCHEDULE_DEFAULT_RETRY_POLICY,
  SOCIAL_SCHEDULE_REQUIREMENTS,
} from "./schema";
import { isValidTimeZone, normalizeLocalDateTimeInput, parseLocalDateTime } from "./timezone";
import type {
  SocialScheduleRecurrence,
  SocialScheduleRetryPolicy,
  SocialScheduleTarget,
  SocialScheduleUpsertInput,
} from "./types";

function dedupeTargets(targets: SocialScheduleTarget[]): SocialScheduleTarget[] {
  const map = new Map<SocialPlatform, SocialScheduleTarget>();
  for (const target of targets) {
    map.set(target.platform, { platform: target.platform, enabled: target.enabled !== false });
  }

  return [...map.values()];
}

function normalizeRecurrence(input?: Partial<SocialScheduleRecurrence>): SocialScheduleRecurrence {
  return {
    frequency: input?.frequency ?? SOCIAL_SCHEDULE_DEFAULT_RECURRENCE.frequency,
    interval: input?.interval ?? SOCIAL_SCHEDULE_DEFAULT_RECURRENCE.interval,
    weekdays: input?.weekdays,
    monthDays: input?.monthDays,
    endAtLocal: input?.endAtLocal,
    maxOccurrences: input?.maxOccurrences,
  };
}

function normalizeRetryPolicy(input?: Partial<SocialScheduleRetryPolicy>): SocialScheduleRetryPolicy {
  return {
    maxAttempts: input?.maxAttempts ?? SOCIAL_SCHEDULE_DEFAULT_RETRY_POLICY.maxAttempts,
    baseDelayMinutes: input?.baseDelayMinutes ?? SOCIAL_SCHEDULE_DEFAULT_RETRY_POLICY.baseDelayMinutes,
    backoffMultiplier: input?.backoffMultiplier ?? SOCIAL_SCHEDULE_DEFAULT_RETRY_POLICY.backoffMultiplier,
  };
}

function validateRecurrence(recurrence: SocialScheduleRecurrence): string[] {
  const errors: string[] = [];

  if (!Number.isInteger(recurrence.interval) || recurrence.interval < 1) {
    errors.push("Recurrence interval must be a positive integer.");
  }

  if (recurrence.endAtLocal && !parseLocalDateTime(recurrence.endAtLocal)) {
    errors.push("Recurrence endAtLocal must use local date-time format.");
  }

  if (
    recurrence.maxOccurrences !== undefined &&
    (!Number.isInteger(recurrence.maxOccurrences) || recurrence.maxOccurrences < 1)
  ) {
    errors.push("Recurrence maxOccurrences must be a positive integer.");
  }

  if (recurrence.frequency === "weekly" && recurrence.weekdays?.length) {
    const invalidWeekday = recurrence.weekdays.find((weekday) => weekday < 0 || weekday > 6);
    if (invalidWeekday !== undefined) {
      errors.push("Weekly recurrence weekdays must be between 0 and 6.");
    }
  }

  if (recurrence.frequency === "monthly" && recurrence.monthDays?.length) {
    const invalidMonthDay = recurrence.monthDays.find((value) => value < 1 || value > 31);
    if (invalidMonthDay !== undefined) {
      errors.push("Monthly recurrence monthDays must be between 1 and 31.");
    }
  }

  return errors;
}

export function normalizeSocialScheduleInput(input: SocialScheduleUpsertInput): {
  title: string;
  description?: string;
  timezone: string;
  startsAtLocal: string;
  recurrence: SocialScheduleRecurrence;
  retryPolicy: SocialScheduleRetryPolicy;
  targets: SocialScheduleTarget[];
  status: "draft" | "scheduled";
} {
  return {
    title: input.title?.trim() || "Scheduled social publish",
    description: input.description?.trim() || undefined,
    timezone: input.timezone.trim() || "UTC",
    startsAtLocal: normalizeLocalDateTimeInput(input.startsAtLocal),
    recurrence: normalizeRecurrence(input.recurrence),
    retryPolicy: normalizeRetryPolicy(input.retryPolicy),
    targets: dedupeTargets(input.targets).filter((target) => target.enabled),
    status: input.status === "draft" ? "draft" : "scheduled",
  };
}

export function validateSocialScheduleInput(
  input: SocialScheduleUpsertInput,
  post: GeneratedSocialPost,
): string[] {
  const errors: string[] = [];
  if (!input.socialPostId.trim()) {
    errors.push("socialPostId is required.");
  }

  if (!isValidTimeZone(input.timezone)) {
    errors.push("A valid IANA timezone is required.");
  }

  if (!parseLocalDateTime(input.startsAtLocal.trim())) {
    errors.push("startsAtLocal must use local date-time format.");
  }

  const recurrence = normalizeRecurrence(input.recurrence);
  errors.push(...validateRecurrence(recurrence));

  const retryPolicy = normalizeRetryPolicy(input.retryPolicy);
  if (!Number.isInteger(retryPolicy.maxAttempts) || retryPolicy.maxAttempts < 1 || retryPolicy.maxAttempts > 5) {
    errors.push("Retry maxAttempts must be between 1 and 5.");
  }
  if (
    !Number.isInteger(retryPolicy.baseDelayMinutes) ||
    retryPolicy.baseDelayMinutes < 1 ||
    retryPolicy.baseDelayMinutes > 120
  ) {
    errors.push("Retry baseDelayMinutes must be between 1 and 120.");
  }
  if (
    !Number.isInteger(retryPolicy.backoffMultiplier) ||
    retryPolicy.backoffMultiplier < 1 ||
    retryPolicy.backoffMultiplier > 4
  ) {
    errors.push("Retry backoffMultiplier must be between 1 and 4.");
  }

  const enabledTargets = dedupeTargets(input.targets).filter((target) => target.enabled !== false);
  if (enabledTargets.length === 0) {
    errors.push("At least one enabled target platform is required.");
  }

  const postPlatforms = new Set(post.variants.map((variant) => variant.platform));
  for (const target of enabledTargets) {
    if (!postPlatforms.has(target.platform)) {
      errors.push(`Selected platform ${target.platform} is not present in the generated social post variants.`);
    }
  }

  if (post.validation && !post.validation.isValid) {
    errors.push("Social post must be valid before scheduling.");
  }

  const unsupported = enabledTargets.filter(
    (target) => !SOCIAL_SCHEDULE_REQUIREMENTS.mvpPlatforms.includes(target.platform),
  );
  if (unsupported.length > 0) {
    // Future-ready support is allowed, but operators should know only instagram is active delivery for MVP.
  }

  return errors;
}
