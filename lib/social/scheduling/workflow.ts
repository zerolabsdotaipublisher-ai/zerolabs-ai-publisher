import "server-only";

import { logger, metrics } from "@/lib/observability";
import { getSocialPostById } from "@/lib/social/storage";
import { executeInstagramPublishJob, getInstagramConnection, prepareInstagramPublishPayload, createInstagramPublishJob } from "@/lib/social/instagram";
import type { SocialPlatform } from "@/lib/social/types";
import {
  assertSocialQueueCapacity,
  enforcePlatformExecutionBound,
  SocialSchedulingThrottleError,
} from "./queue";
import { computeNextSocialScheduleRunAt } from "./recurrence";
import {
  claimDueSocialSchedules,
  claimSocialScheduleForExecution,
  createSocialScheduleRunId,
  getOwnedSocialScheduleById,
  getSocialScheduleById,
  saveSocialSchedule,
  saveSocialScheduleExecutionState,
} from "./storage";
import {
  logSocialScheduleNotificationError,
  notifySocialScheduleAttentionRequired,
  notifySocialScheduleFailure,
  notifySocialSchedulePublished,
  recordSocialScheduleEvent,
} from "./notifications";
import type {
  SocialSchedule,
  SocialScheduleExecutionBatchResult,
  SocialScheduleExecutionResult,
  SocialScheduleLogEntry,
  SocialScheduleRunRecord,
  SocialScheduleRunStatus,
  SocialScheduleTriggerSource,
} from "./types";

function createLog(
  phase: SocialScheduleLogEntry["phase"],
  message: string,
  params?: {
    at?: string;
    level?: SocialScheduleLogEntry["level"];
    details?: Record<string, unknown>;
  },
): SocialScheduleLogEntry {
  return {
    at: params?.at ?? new Date().toISOString(),
    phase,
    level: params?.level ?? "info",
    message,
    details: params?.details,
  };
}

function appendLog(logs: SocialScheduleLogEntry[], entry: SocialScheduleLogEntry): SocialScheduleLogEntry[] {
  return [...logs, entry].slice(-60);
}

function shouldRetryExecution(error: unknown): boolean {
  if (error instanceof SocialSchedulingThrottleError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("not found") || message.includes("unauthorized") || message.includes("requires reauthorization")) {
      return false;
    }
  }

  return true;
}

function createRetryAt(nowIso: string, attempt: number, baseDelayMinutes: number, backoffMultiplier: number): string {
  const exponent = Math.max(0, attempt - 1);
  const delayMinutes = baseDelayMinutes * Math.max(1, backoffMultiplier ** exponent);
  return new Date(new Date(nowIso).getTime() + delayMinutes * 60_000).toISOString();
}

function createInitialRun(
  schedule: SocialSchedule,
  triggerSource: SocialScheduleTriggerSource,
  scheduledFor: string,
): SocialScheduleRunRecord {
  const startedAt = new Date().toISOString();
  return {
    id: createSocialScheduleRunId(schedule.id),
    scheduleId: schedule.id,
    userId: schedule.userId,
    socialPostId: schedule.socialPostId,
    status: "queued",
    attempt: schedule.lifecycle.nextRetryAt ? schedule.lifecycle.consecutiveFailures + 1 : 1,
    scheduledFor,
    startedAt,
    triggerSource,
    targetPlatforms: schedule.targets.map((target) => target.platform),
    publishedPlatforms: [],
    failedPlatforms: [],
    queuedJobs: [],
    retryable: false,
    logs: [
      createLog("queue", "Social schedule claimed for execution.", {
        at: startedAt,
        details: {
          triggerSource,
          scheduledFor,
        },
      }),
    ],
    createdAt: startedAt,
    updatedAt: startedAt,
  };
}

async function executeInstagramTarget(args: {
  schedule: SocialSchedule;
  run: SocialScheduleRunRecord;
  platform: SocialPlatform;
  scheduledFor: string;
}): Promise<{ jobId: string; status: string }> {
  const { schedule, platform, scheduledFor } = args;
  const post = await getSocialPostById(schedule.socialPostId, schedule.userId);
  if (!post) {
    throw new Error("Scheduled social post was not found.");
  }

  const variant = post.variants.find((entry) => entry.platform === platform);
  if (!variant) {
    throw new Error(`No ${platform} variant is available for scheduled publishing.`);
  }

  const connection = await getInstagramConnection(schedule.userId);
  if (!connection || connection.connectionStatus !== "connected" || !connection.instagramAccountId) {
    throw new Error("Instagram account is not connected for this user.");
  }

  const payload = prepareInstagramPublishPayload(variant);
  const job = await createInstagramPublishJob({
    userId: schedule.userId,
    socialPostId: schedule.socialPostId,
    caption: payload.caption,
    mediaUrl: payload.mediaUrl,
    instagramAccountId: connection.instagramAccountId,
    facebookPageId: connection.facebookPageId,
    scheduledFor,
    maxAttempts: schedule.retryPolicy.maxAttempts,
    metadata: {
      source: "social_schedule",
      socialScheduleId: schedule.id,
      socialPlatform: platform,
    },
  });

  const executed = await executeInstagramPublishJob(job.id, schedule.userId);
  return {
    jobId: executed.id,
    status: executed.status,
  };
}

async function finalizeSuccess(
  schedule: SocialSchedule,
  run: SocialScheduleRunRecord,
): Promise<SocialScheduleExecutionResult> {
  const completedAt = new Date().toISOString();
  const lifecycle = {
    ...schedule.lifecycle,
    lastQueuedAt: schedule.scheduledFor ?? run.scheduledFor,
    lastStartedAt: run.startedAt,
    lastCompletedAt: completedAt,
    lastSucceededAt: completedAt,
    lastError: undefined,
    nextRetryAt: undefined,
    consecutiveFailures: 0,
    totalRuns: schedule.lifecycle.totalRuns + 1,
    successCount: schedule.lifecycle.successCount + 1,
    completedOccurrences: schedule.lifecycle.completedOccurrences + 1,
  };

  const nextReference = completedAt;
  const nextScheduledFor = computeNextSocialScheduleRunAt(
    {
      ...schedule,
      lifecycle,
    },
    nextReference,
    { occurrenceCompleted: true },
  );

  const nextSchedule: SocialSchedule = {
    ...schedule,
    status: nextScheduledFor ? "scheduled" : "published",
    scheduledFor: nextScheduledFor,
    lifecycle,
    updatedAt: completedAt,
    version: schedule.version + 1,
  };

  const nextRun: SocialScheduleRunRecord = {
    ...run,
    status: "published",
    completedAt,
    retryable: false,
    nextRetryAt: undefined,
    logs: appendLog(
      run.logs,
      createLog("completion", "Scheduled social publish completed.", {
        at: completedAt,
        details: {
          nextScheduledFor,
          publishedPlatforms: run.publishedPlatforms,
        },
      }),
    ),
    updatedAt: completedAt,
  };

  await saveSocialScheduleExecutionState(
    {
      ...nextSchedule,
      lastRunId: nextRun.id,
    },
    nextRun,
  );

  try {
    await notifySocialSchedulePublished(nextSchedule, nextRun);
    if (nextRun.failedPlatforms.length > 0) {
      await notifySocialScheduleAttentionRequired(nextSchedule, nextRun, {
        failedPlatforms: nextRun.failedPlatforms,
      });
    }
  } catch (error) {
    logSocialScheduleNotificationError(error, schedule.id);
  }

  return {
    schedule: {
      ...nextSchedule,
      lastRunId: nextRun.id,
      lastRun: nextRun,
    },
    run: nextRun,
  };
}

async function finalizeFailure(
  schedule: SocialSchedule,
  run: SocialScheduleRunRecord,
  error: unknown,
): Promise<SocialScheduleExecutionResult> {
  const completedAt = new Date().toISOString();
  const message = error instanceof Error ? error.message : "Unknown social scheduling error";
  const retryable = shouldRetryExecution(error);

  const lifecycle = {
    ...schedule.lifecycle,
    lastQueuedAt: schedule.scheduledFor ?? run.scheduledFor,
    lastStartedAt: run.startedAt,
    lastCompletedAt: completedAt,
    lastFailedAt: completedAt,
    lastError: message,
    consecutiveFailures: schedule.lifecycle.consecutiveFailures + 1,
    totalRuns: schedule.lifecycle.totalRuns + 1,
    failureCount: schedule.lifecycle.failureCount + 1,
  };

  let nextStatus: SocialSchedule["status"] = "failed";
  let nextRunStatus: SocialScheduleRunStatus = "failed";
  let nextRetryAt: string | undefined;
  if (retryable && run.attempt < schedule.retryPolicy.maxAttempts) {
    nextRetryAt = createRetryAt(
      completedAt,
      run.attempt,
      schedule.retryPolicy.baseDelayMinutes,
      schedule.retryPolicy.backoffMultiplier,
    );
    nextStatus = "retry_pending";
    nextRunStatus = "retry_pending";
  }

  const nextSchedule: SocialSchedule = {
    ...schedule,
    status: nextStatus,
    scheduledFor: nextRetryAt,
    lifecycle: {
      ...lifecycle,
      nextRetryAt,
    },
    updatedAt: completedAt,
    version: schedule.version + 1,
  };

  const nextRun: SocialScheduleRunRecord = {
    ...run,
    status: nextRunStatus,
    completedAt,
    retryable,
    error: message,
    nextRetryAt,
    logs: appendLog(
      run.logs,
      createLog(nextRetryAt ? "retry" : "completion", message, {
        at: completedAt,
        level: "error",
        details: {
          retryable,
          nextRetryAt,
        },
      }),
    ),
    updatedAt: completedAt,
  };

  await saveSocialScheduleExecutionState(
    {
      ...nextSchedule,
      lastRunId: nextRun.id,
    },
    nextRun,
  );

  try {
    await notifySocialScheduleFailure(nextSchedule, nextRun);
  } catch (notificationError) {
    logSocialScheduleNotificationError(notificationError, schedule.id);
  }

  return {
    schedule: {
      ...nextSchedule,
      lastRunId: nextRun.id,
      lastRun: nextRun,
    },
    run: nextRun,
  };
}

async function executeClaimedSchedule(
  claimedSchedule: SocialSchedule,
  triggerSource: SocialScheduleTriggerSource,
): Promise<SocialScheduleExecutionResult> {
  const executionStartedAt = Date.now();
  metrics.increment("requestCount");

  const scheduledFor = claimedSchedule.scheduledFor ?? new Date().toISOString();
  const run = createInitialRun(claimedSchedule, triggerSource, scheduledFor);

  try {
    enforcePlatformExecutionBound(run.targetPlatforms.length);
    await assertSocialQueueCapacity(claimedSchedule.userId);

    const schedulePublishing: SocialSchedule = {
      ...claimedSchedule,
      status: "publishing",
      lifecycle: {
        ...claimedSchedule.lifecycle,
        lastQueuedAt: scheduledFor,
        lastStartedAt: run.startedAt,
      },
      updatedAt: new Date().toISOString(),
      version: claimedSchedule.version + 1,
    };

    await saveSocialSchedule(schedulePublishing);
    await recordSocialScheduleEvent({
      schedule: schedulePublishing,
      run,
      eventType: "queued",
      severity: "info",
      message: "Social schedule queued for publishing.",
      metadata: {
        triggerSource,
      },
    });

    let nextRun = {
      ...run,
      status: "publishing" as const,
      logs: appendLog(run.logs, createLog("publish", "Starting social publish execution.")),
    };

    for (const platform of run.targetPlatforms) {
      if (platform !== "instagram") {
        nextRun = {
          ...nextRun,
          failedPlatforms: [...nextRun.failedPlatforms, platform],
          logs: appendLog(
            nextRun.logs,
            createLog("publish", `Platform ${platform} is not currently supported for live publishing.`, {
              level: "warn",
            }),
          ),
        };
        continue;
      }

      const job = await executeInstagramTarget({
        schedule: schedulePublishing,
        run: nextRun,
        platform,
        scheduledFor,
      });

      const published = job.status === "published";
      nextRun = {
        ...nextRun,
        queuedJobs: [...nextRun.queuedJobs, { platform, jobId: job.jobId, status: job.status }],
        publishedPlatforms: published ? [...nextRun.publishedPlatforms, platform] : nextRun.publishedPlatforms,
        failedPlatforms: published ? nextRun.failedPlatforms : [...nextRun.failedPlatforms, platform],
        logs: appendLog(
          nextRun.logs,
          createLog("publish", `Platform ${platform} publish ${published ? "succeeded" : "did not complete"}.`, {
            level: published ? "info" : "warn",
            details: {
              jobId: job.jobId,
              status: job.status,
            },
          }),
        ),
      };
    }

    if (nextRun.publishedPlatforms.length > 0) {
      return finalizeSuccess(schedulePublishing, nextRun);
    }

    throw new Error(
      nextRun.failedPlatforms.length > 0
        ? `No target platforms published successfully: ${nextRun.failedPlatforms.join(", ")}`
        : "No target platforms were available for publishing.",
    );
  } catch (error) {
    metrics.increment("errorCount");
    logger.error("Scheduled social execution failed", {
      category: "error",
      service: "social_scheduling",
      scheduleId: claimedSchedule.id,
      socialPostId: claimedSchedule.socialPostId,
      error: {
        name: "SocialScheduleExecutionError",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return finalizeFailure(claimedSchedule, run, error);
  } finally {
    metrics.recordDuration("socialScheduleExecutionMs", Date.now() - executionStartedAt);
  }
}

export async function executeDueSocialSchedules(limit = 5): Promise<SocialScheduleExecutionBatchResult> {
  const claimedAt = new Date().toISOString();
  const claimedSchedules = await claimDueSocialSchedules(limit, claimedAt);
  const results: SocialScheduleExecutionResult[] = [];

  for (const schedule of claimedSchedules) {
    results.push(await executeClaimedSchedule(schedule, schedule.status === "retry_pending" ? "retry" : "scheduled"));
  }

  return {
    claimedCount: claimedSchedules.length,
    processedCount: results.length,
    schedules: results,
  };
}

export async function executeSocialScheduleNow(
  scheduleId: string,
  userId?: string,
): Promise<SocialScheduleExecutionResult> {
  const owned = userId ? await getOwnedSocialScheduleById(scheduleId, userId) : await getSocialScheduleById(scheduleId);
  if (!owned) {
    throw new Error("Social schedule not found.");
  }

  if (owned.status === "canceled") {
    throw new Error("Canceled social schedules cannot be executed.");
  }

  if (owned.status === "draft") {
    throw new Error("Schedule must be configured before manual execution.");
  }

  const claimed = await claimSocialScheduleForExecution(owned.id);
  if (!claimed) {
    throw new Error("This schedule is already running or unavailable.");
  }

  return executeClaimedSchedule(
    {
      ...claimed,
      scheduledFor: new Date().toISOString(),
    },
    "manual",
  );
}
