import type { SocialPlatform } from "@/lib/social/types";
import { SOCIAL_PUBLISH_HISTORY_STATUSES } from "./schema";
import type {
  SocialPublishHistoryJob,
  SocialPublishHistoryListFilter,
  SocialPublishHistoryStatus,
} from "./types";

const SUPPORTED_PLATFORMS = new Set<SocialPlatform>(["instagram", "facebook", "x", "linkedin"]);

export function isSocialPublishHistoryStatus(value: string): value is SocialPublishHistoryStatus {
  return SOCIAL_PUBLISH_HISTORY_STATUSES.includes(value as SocialPublishHistoryStatus);
}

function parseDate(value: string | undefined, fieldName: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} must be a valid ISO timestamp.`);
  }
  return parsed.toISOString();
}

export function normalizeSocialPublishHistoryFilter(input: {
  status?: string;
  platform?: string;
  accountId?: string;
  from?: string;
  to?: string;
  page?: string;
  perPage?: string;
}): SocialPublishHistoryListFilter {
  const page = Math.max(1, Number.parseInt(input.page ?? "1", 10) || 1);
  const perPage = Math.min(50, Math.max(1, Number.parseInt(input.perPage ?? "20", 10) || 20));

  let status: SocialPublishHistoryStatus | undefined;
  if (input.status) {
    if (!isSocialPublishHistoryStatus(input.status)) {
      throw new Error("status filter is invalid.");
    }
    status = input.status;
  }

  let platform: SocialPlatform | undefined;
  if (input.platform) {
    if (!SUPPORTED_PLATFORMS.has(input.platform as SocialPlatform)) {
      throw new Error("platform filter is invalid.");
    }
    platform = input.platform as SocialPlatform;
  }

  return {
    status,
    platform,
    accountId: input.accountId?.trim() || undefined,
    from: parseDate(input.from, "from"),
    to: parseDate(input.to, "to"),
    page,
    perPage,
  };
}

export function validateSocialPublishHistoryJob(job: SocialPublishHistoryJob): string[] {
  const errors: string[] = [];

  if (!job.userId.trim()) {
    errors.push("userId is required.");
  }
  if (!SUPPORTED_PLATFORMS.has(job.platform)) {
    errors.push("platform is invalid.");
  }
  if (!isSocialPublishHistoryStatus(job.status)) {
    errors.push("status is invalid.");
  }
  if (!job.contentSnapshot.caption.trim()) {
    errors.push("contentSnapshot.caption is required.");
  }

  if (job.lifecycle.length === 0) {
    errors.push("At least one lifecycle entry is required.");
  }

  for (const lifecycleEntry of job.lifecycle) {
    if (!isSocialPublishHistoryStatus(lifecycleEntry.status)) {
      errors.push("Lifecycle status contains an invalid state.");
      break;
    }
    const parsed = new Date(lifecycleEntry.at);
    if (Number.isNaN(parsed.getTime())) {
      errors.push("Lifecycle timestamps must be valid ISO timestamps.");
      break;
    }
  }

  return errors;
}
