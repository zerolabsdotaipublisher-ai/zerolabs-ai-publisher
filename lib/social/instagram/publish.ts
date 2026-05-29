import "server-only";

import {
  ensureSocialPublishHistoryForInstagramJob,
  transitionSocialPublishHistory,
} from "@/lib/social/history";
import { logger } from "@/lib/observability";
import { metrics } from "@/lib/observability/metrics";
import type { SocialPostVariant } from "@/lib/social/types";
import { DEFAULT_INSTAGRAM_RETRY_POLICY } from "./config";
import { toInstagramIntegrationError } from "./errors";
import { createInstagramMediaContainer, publishInstagramMediaContainer } from "./media";
import {
  claimDueInstagramPublishJobs,
  getInstagramPublishJob,
  markInstagramConnectionError,
  requireInstagramAccessToken,
  saveInstagramPublishAttempt,
  updateInstagramPublishJob,
} from "./storage";
import { formatInstagramCaption, validateInstagramVariantForPublish } from "./validation";
import type {
  InstagramCanonicalPublishPayload,
  InstagramPublishJob,
  PlatformPublishAdapter,
} from "./types";

const INSTAGRAM_RETRY_JITTER_MAX_SECONDS = 15;
const INSTAGRAM_RETRY_DELAY_MAX_SECONDS = 3600;

export const instagramImagePublishAdapter: PlatformPublishAdapter<
  InstagramCanonicalPublishPayload,
  { caption: string; mediaUrl: string; instagramAccountId: string },
  { creationId: string; mediaId: string }
> = {
  platform: "instagram",
  validate(payload) {
    return validateInstagramVariantForPublish(payload.variant);
  },
  map(payload) {
    const validation = validateInstagramVariantForPublish(payload.variant);
    if (!validation.isValid || !validation.caption || !validation.mediaUrl) {
      throw new Error(validation.errors.join(" "));
    }
    return {
      caption: validation.caption,
      mediaUrl: validation.mediaUrl,
      instagramAccountId: "",
    };
  },
  async publish(payload, token) {
    const container = await createInstagramMediaContainer({
      instagramAccountId: payload.instagramAccountId,
      imageUrl: payload.mediaUrl,
      caption: payload.caption,
      accessToken: token,
    });
    const published = await publishInstagramMediaContainer({
      instagramAccountId: payload.instagramAccountId,
      creationId: container.id,
      accessToken: token,
    });
    return {
      creationId: container.id,
      mediaId: published.id,
    };
  },
  normalizeError(error) {
    return toInstagramIntegrationError(error);
  },
};

function computeRetryDelaySeconds(attempt: number): number {
  const exponent = Math.max(0, attempt - 1);
  const base = DEFAULT_INSTAGRAM_RETRY_POLICY.baseDelaySeconds;
  const delay = base * DEFAULT_INSTAGRAM_RETRY_POLICY.backoffMultiplier ** exponent;
  const jitter = Math.floor(Math.random() * INSTAGRAM_RETRY_JITTER_MAX_SECONDS);
  return Math.min(INSTAGRAM_RETRY_DELAY_MAX_SECONDS, Math.max(15, delay + jitter));
}

function shouldReauthorize(providerCode?: number): boolean {
  // Meta Graph common auth/permission errors:
  // 190 -> invalid or expired access token
  // 10  -> permission denied
  // 200 -> missing permission or scope restriction
  return providerCode === 10 || providerCode === 190 || providerCode === 200;
}

async function finalizeRetryOrFailure(
  job: InstagramPublishJob,
  error: ReturnType<typeof toInstagramIntegrationError>,
  options: {
    attemptStarted: boolean;
    attemptCount: number;
    attemptStartedAt: string;
    attemptId?: string;
  },
) {
  const nextAttemptCount = options.attemptStarted ? options.attemptCount : job.attemptCount;
  const exhausted = nextAttemptCount >= job.maxAttempts;
  const retryable = error.retryable && !exhausted;

  const nextAttemptAt = retryable
    ? new Date(Date.now() + computeRetryDelaySeconds(nextAttemptCount) * 1000).toISOString()
    : undefined;

  const nextStatus = retryable ? "retry_pending" : "failed";
  const updated = await updateInstagramPublishJob(job.id, job.userId, {
    status: nextStatus,
    attempt_count: nextAttemptCount,
    retryable,
    next_attempt_at: nextAttemptAt ?? null,
    last_error_code: error.code,
    last_error: error.message,
  });

  if (options.attemptStarted) {
    await saveInstagramPublishAttempt({
      id: options.attemptId,
      jobId: job.id,
      userId: job.userId,
      status: retryable ? "retry_pending" : "failed",
      attempt: nextAttemptCount,
      startedAt: options.attemptStartedAt,
      completedAt: new Date().toISOString(),
      retryable,
      errorCode: error.code,
      errorMessage: error.message,
      providerResponse: error.metadata ?? {},
    });
  }

  if (shouldReauthorize(Number(error.metadata?.providerCode))) {
    await markInstagramConnectionError(job.userId, error.message);
  }

  return updated;
}

export async function executeInstagramPublishJob(jobId: string, userId: string): Promise<InstagramPublishJob> {
  const startedAt = Date.now();
  const job = await getInstagramPublishJob(jobId, userId);
  if (!job) {
    throw new Error("Instagram publish job not found.");
  }

  if (job.status === "published" || job.status === "canceled") {
    return job;
  }

  const history = await ensureSocialPublishHistoryForInstagramJob({
    job,
    fallbackSource: "manual",
    fallbackSourceRefId: "instagram_publish_execute",
  });

  metrics.increment("requestCount");
  const nextAttemptCount = job.attemptCount + 1;
  const attemptStartedAt = new Date().toISOString();
  let attemptId: string | undefined;
  let attemptStarted = false;

  try {
    await transitionSocialPublishHistory({
      historyJobId: history.id,
      userId,
      status: "queued",
      message: "Instagram publish job queued for execution.",
    });

    const { token } = await requireInstagramAccessToken(userId);

    await updateInstagramPublishJob(job.id, job.userId, {
      status: "uploading",
      attempt_count: nextAttemptCount,
      retryable: false,
      next_attempt_at: null,
      last_error: null,
      last_error_code: null,
    });

    const attempt = await saveInstagramPublishAttempt({
      jobId: job.id,
      userId: job.userId,
      status: "uploading",
      attempt: nextAttemptCount,
      startedAt: attemptStartedAt,
      retryable: false,
      providerResponse: {},
    });
    attemptId = attempt.id;
    attemptStarted = true;

    await transitionSocialPublishHistory({
      historyJobId: history.id,
      userId,
      status: "publishing",
      message: "Instagram API request started.",
      requestPayload: {
        caption: job.caption,
        mediaUrl: job.mediaUrl,
        instagramAccountId: job.instagramAccountId,
      },
    });

    const container = await createInstagramMediaContainer({
      instagramAccountId: job.instagramAccountId,
      imageUrl: job.mediaUrl,
      caption: job.caption,
      accessToken: token,
    });

    await updateInstagramPublishJob(job.id, job.userId, {
      status: "publishing",
      provider_creation_id: container.id,
    });

    const publishResult = await publishInstagramMediaContainer({
      instagramAccountId: job.instagramAccountId,
      creationId: container.id,
      accessToken: token,
    });

    const now = new Date().toISOString();
    const published = await updateInstagramPublishJob(job.id, job.userId, {
      status: "published",
      published_at: now,
      provider_media_id: publishResult.id,
      retryable: false,
      next_attempt_at: null,
      last_error: null,
      last_error_code: null,
    });

    await saveInstagramPublishAttempt({
      id: attemptId,
      jobId: job.id,
      userId: job.userId,
      status: "published",
      attempt: nextAttemptCount,
      startedAt: attemptStartedAt,
      completedAt: now,
      retryable: false,
      providerResponse: {
        creationId: container.id,
        mediaId: publishResult.id,
      },
    });

    await transitionSocialPublishHistory({
      historyJobId: history.id,
      userId,
      status: "published",
      message: "Instagram API publish completed.",
      responsePayload: {
        creationId: container.id,
        mediaId: publishResult.id,
      },
    });

    metrics.recordDuration("instagramPublishExecutionMs", Date.now() - startedAt);
    return published;
  } catch (error) {
    metrics.increment("errorCount");
    const normalizedError = toInstagramIntegrationError(error);
    logger.error("Instagram publish execution failed", {
      category: "error",
      service: "instagram",
      jobId: job.id,
      userId: job.userId,
      error: {
        name: "InstagramPublishExecutionError",
        message: normalizedError.message,
      },
      metadata: {
        code: normalizedError.code,
        retryable: normalizedError.retryable,
        statusCode: normalizedError.statusCode,
        ...normalizedError.metadata,
      },
    });

    const failedOrRetry = await finalizeRetryOrFailure(job, normalizedError, {
      attemptStarted,
      attemptCount: nextAttemptCount,
      attemptStartedAt,
      attemptId,
    });

    await transitionSocialPublishHistory({
      historyJobId: history.id,
      userId,
      status: failedOrRetry.status === "retry_pending" ? "retry" : "failed",
      message:
        failedOrRetry.status === "retry_pending"
          ? "Instagram publish failed and moved to retry."
          : "Instagram publish failed.",
      error: {
        code: normalizedError.code,
        message: normalizedError.message,
        retryable: normalizedError.retryable,
        details: normalizedError.metadata,
      },
      retryAt: failedOrRetry.nextAttemptAt,
      responsePayload: normalizedError.metadata ?? {},
    });

    return failedOrRetry;
  }
}

export async function executeDueInstagramPublishJobs(limit = 5): Promise<{
  claimedCount: number;
  processedCount: number;
  jobs: InstagramPublishJob[];
}> {
  const claimedAt = new Date().toISOString();
  const claimed = await claimDueInstagramPublishJobs(limit, claimedAt);
  const jobs: InstagramPublishJob[] = [];

  for (const job of claimed) {
    jobs.push(await executeInstagramPublishJob(job.id, job.userId));
  }

  return {
    claimedCount: claimed.length,
    processedCount: jobs.length,
    jobs,
  };
}

export function prepareInstagramPublishPayload(variant: SocialPostVariant): {
  caption: string;
  mediaUrl: string;
} {
  const validation = instagramImagePublishAdapter.validate({ variant });
  if (!validation.isValid || !validation.mediaUrl || !validation.caption) {
    throw new Error(validation.errors.join(" "));
  }

  return {
    caption: formatInstagramCaption(variant),
    mediaUrl: validation.mediaUrl,
  };
}
