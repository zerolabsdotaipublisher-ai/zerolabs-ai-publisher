import "server-only";

import {
  collectArticleQualityNotes,
  createArticleMetadata,
  getArticleByStructureId,
  normalizeArticle,
  regenerateArticle,
  upsertArticle,
} from "@/lib/article";
import {
  collectBlogQualityNotes,
  createBlogMetadata,
  getBlogPostByStructureId,
  normalizeBlogPost,
  regenerateBlogPost,
  upsertBlogPost,
} from "@/lib/blog";
import type { WebsiteStructure } from "@/lib/ai/structure";
import { saveEditorStructureDraft } from "@/lib/editor/storage";
import { logger } from "@/lib/observability";
import { metrics } from "@/lib/observability/metrics";
import { detectPublicationState, type PublishAction } from "@/lib/publish";
import { runPublishWorkflow } from "@/lib/publish/workflow";
import {
  createContentScheduleRunId,
} from "./ids";
import { computeNextRunAt } from "./recurrence";
import {
  claimContentScheduleForExecution,
  claimDueContentSchedules,
  getContentScheduleById,
  getOwnedStructureForSchedule,
  saveContentSchedule,
  saveContentScheduleRun,
  saveScheduleExecutionState,
} from "./storage";
import type {
  ContentSchedule,
  ContentScheduleExecutionBatchResult,
  ContentScheduleExecutionResult,
  ContentScheduleRunRecord,
  ScheduleRunLogEntry,
  ScheduleRunStatus,
  ScheduleTriggerSource,
} from "./types";

function appendLog(
  logs: ScheduleRunLogEntry[],
  entry: ScheduleRunLogEntry,
): ScheduleRunLogEntry[] {
  return [...logs, entry].slice(-50);
}

function createLog(
  phase: ScheduleRunLogEntry["phase"],
  message: string,
  params?: {
    at?: string;
    level?: ScheduleRunLogEntry["level"];
    details?: Record<string, unknown>;
  },
): ScheduleRunLogEntry {
  return {
    at: params?.at ?? new Date().toISOString(),
    phase,
    level: params?.level ?? "info",
    message,
    details: params?.details,
  };
}

function shouldRetryExecution(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("not found") ||
      message.includes("unauthorized") ||
      message.includes("cannot be scheduled") ||
      message.includes("validation failed")
    ) {
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

async function regenerateBlogForSchedule(
  schedule: ContentSchedule,
  scheduledFor: string,
): Promise<WebsiteStructure> {
  const existingBlog = await getBlogPostByStructureId(schedule.structureId, schedule.userId);
  if (!existingBlog) {
    throw new Error("Blog content not found for the scheduled website.");
  }

  const regenerated = await regenerateBlogPost(existingBlog, schedule.userId, {
    scope: "full",
    updatedInput: {
      publishAt: scheduledFor,
    },
  });

  const draftSave = await saveEditorStructureDraft(schedule.userId, regenerated.structure);
  if (!draftSave.structure || draftSave.error) {
    throw new Error(draftSave.error || "Unable to persist regenerated blog content.");
  }

  const normalizedBlog = normalizeBlogPost({
    ...regenerated.blog,
    structureId: draftSave.structure.id,
    version: draftSave.structure.version,
    updatedAt: draftSave.structure.updatedAt,
    scheduledPublishAt: scheduledFor,
  });
  const qualityNotes = collectBlogQualityNotes(normalizedBlog);

  await upsertBlogPost(
    {
      ...normalizedBlog,
      metadata: createBlogMetadata({
        input: normalizedBlog.sourceInput,
        generatedAt: normalizedBlog.generatedAt,
        updatedAt: normalizedBlog.updatedAt,
        sections: normalizedBlog.sections,
        introduction: normalizedBlog.introduction,
        conclusion: normalizedBlog.conclusion,
        callToAction: normalizedBlog.callToAction,
        qualityNotes,
        versionId: draftSave.versionId ?? normalizedBlog.metadata.versionId,
      }),
    },
    schedule.userId,
  );

  return draftSave.structure;
}

async function regenerateArticleForSchedule(
  schedule: ContentSchedule,
  scheduledFor: string,
): Promise<WebsiteStructure> {
  const existingArticle = await getArticleByStructureId(schedule.structureId, schedule.userId);
  if (!existingArticle) {
    throw new Error("Article content not found for the scheduled website.");
  }

  const regenerated = await regenerateArticle(existingArticle, schedule.userId, {
    scope: "full",
    updatedInput: {
      publishAt: scheduledFor,
    },
  });

  const draftSave = await saveEditorStructureDraft(schedule.userId, regenerated.structure);
  if (!draftSave.structure || draftSave.error) {
    throw new Error(draftSave.error || "Unable to persist regenerated article content.");
  }

  const normalizedArticle = normalizeArticle({
    ...regenerated.article,
    structureId: draftSave.structure.id,
    version: draftSave.structure.version,
    updatedAt: draftSave.structure.updatedAt,
    scheduledPublishAt: scheduledFor,
  });
  const qualityNotes = collectArticleQualityNotes(normalizedArticle);

  await upsertArticle(
    {
      ...normalizedArticle,
      metadata: createArticleMetadata({
        input: normalizedArticle.sourceInput,
        generatedAt: normalizedArticle.generatedAt,
        updatedAt: normalizedArticle.updatedAt,
        title: normalizedArticle.title,
        subtitle: normalizedArticle.subtitle,
        sections: normalizedArticle.sections,
        introduction: normalizedArticle.introduction,
        conclusion: normalizedArticle.conclusion,
        callToAction: normalizedArticle.callToAction,
        references: normalizedArticle.references,
        qualityNotes,
        versionId: draftSave.versionId ?? normalizedArticle.metadata.versionId,
      }),
    },
    schedule.userId,
  );

  return draftSave.structure;
}

async function prepareStructureForExecution(
  schedule: ContentSchedule,
  structure: WebsiteStructure,
  scheduledFor: string,
  logs: ScheduleRunLogEntry[],
): Promise<{ structure: WebsiteStructure; logs: ScheduleRunLogEntry[]; generationDurationMs?: number }> {
  if (schedule.executionMode !== "generate_then_publish") {
    return { structure, logs };
  }

  const generationStartedAt = Date.now();
  let nextLogs = appendLog(
    logs,
    createLog("generation", "Generating fresh content before publish.", {
      details: {
        targetContentType: schedule.targetContentType,
      },
    }),
  );

  let preparedStructure: WebsiteStructure;
  switch (schedule.targetContentType) {
    case "blog":
      preparedStructure = await regenerateBlogForSchedule(schedule, scheduledFor);
      break;
    case "article":
      preparedStructure = await regenerateArticleForSchedule(schedule, scheduledFor);
      break;
    default:
      throw new Error("Generate-before-publish is not supported for this website type.");
  }

  nextLogs = appendLog(
    nextLogs,
    createLog("generation", "Fresh content generation completed.", {
      details: {
        structureVersion: preparedStructure.version,
      },
    }),
  );

  return {
    structure: preparedStructure,
    logs: nextLogs,
    generationDurationMs: Date.now() - generationStartedAt,
  };
}

async function finalizeSuccess(
  schedule: ContentSchedule,
  run: ContentScheduleRunRecord,
  publishedAt: string,
  logs: ScheduleRunLogEntry[],
  options?: { generationDurationMs?: number; publishDurationMs?: number },
): Promise<ContentScheduleExecutionResult> {
  const completedAt = new Date().toISOString();
  const lifecycle = {
    ...schedule.lifecycle,
    lastQueuedAt: schedule.nextRunAt ?? run.scheduledFor,
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
  const nextReference = new Date(new Date(run.scheduledFor).getTime() + 1_000).toISOString();
  const nextRunAt = computeNextRunAt(
    {
      ...schedule,
      lifecycle,
    },
    nextReference,
    { occurrenceCompleted: true },
  );
  const nextStatus = nextRunAt ? "active" : "completed";
  const nextSchedule: ContentSchedule = {
    ...schedule,
    status: nextStatus,
    nextRunAt,
    lifecycle,
    updatedAt: completedAt,
    version: schedule.version + 1,
  };
  const nextRun: ContentScheduleRunRecord = {
    ...run,
    status: "succeeded",
    completedAt,
    retryable: false,
    error: undefined,
    logs: appendLog(
      logs,
      createLog("completion", "Scheduled publish completed successfully.", {
        at: completedAt,
        details: {
          nextRunAt,
          publishedAt,
        },
      }),
    ),
    metrics: {
      ...run.metrics,
      durationMs: new Date(completedAt).getTime() - new Date(run.startedAt ?? run.createdAt).getTime(),
      generationDurationMs: options?.generationDurationMs,
      publishDurationMs: options?.publishDurationMs,
    },
    nextRetryAt: undefined,
    updatedAt: completedAt,
  };

  await saveScheduleExecutionState(
    {
      ...nextSchedule,
      lastRunId: nextRun.id,
    },
    nextRun,
    { publishedAt },
  );

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
  schedule: ContentSchedule,
  run: ContentScheduleRunRecord,
  error: unknown,
  logs: ScheduleRunLogEntry[],
): Promise<ContentScheduleExecutionResult> {
  const message = error instanceof Error ? error.message : "Unknown scheduling error";
  const completedAt = new Date().toISOString();
  const retryable = shouldRetryExecution(error);
  const lifecycle = {
    ...schedule.lifecycle,
    lastQueuedAt: schedule.nextRunAt ?? run.scheduledFor,
    lastStartedAt: run.startedAt,
    lastCompletedAt: completedAt,
    lastFailedAt: completedAt,
    lastError: message,
    consecutiveFailures: schedule.lifecycle.consecutiveFailures + 1,
    totalRuns: schedule.lifecycle.totalRuns + 1,
    failureCount: schedule.lifecycle.failureCount + 1,
  };

  let nextStatus: ContentSchedule["status"] = "failed";
  let nextRunAt: string | undefined;
  let nextRetryAt: string | undefined;
  let nextRunStatus: ScheduleRunStatus = "failed";
  if (retryable && run.attempt < schedule.retryPolicy.maxAttempts) {
    nextRetryAt = createRetryAt(
      completedAt,
      run.attempt,
      schedule.retryPolicy.baseDelayMinutes,
      schedule.retryPolicy.backoffMultiplier,
    );
    nextRunAt = nextRetryAt;
    nextStatus = "active";
    nextRunStatus = "retry_scheduled";
  }

  const nextSchedule: ContentSchedule = {
    ...schedule,
    status: nextStatus,
    nextRunAt,
    lifecycle: {
      ...lifecycle,
      nextRetryAt,
    },
    updatedAt: completedAt,
    version: schedule.version + 1,
  };
  const nextRun: ContentScheduleRunRecord = {
    ...run,
    status: nextRunStatus,
    completedAt,
    retryable,
    error: message,
    logs: appendLog(
      logs,
      createLog(nextRetryAt ? "retry" : "completion", message, {
        at: completedAt,
        level: "error",
        details: {
          retryable,
          nextRetryAt,
        },
      }),
    ),
    metrics: {
      ...run.metrics,
      durationMs: new Date(completedAt).getTime() - new Date(run.startedAt ?? run.createdAt).getTime(),
    },
    nextRetryAt,
    updatedAt: completedAt,
  };

  await saveScheduleExecutionState(
    {
      ...nextSchedule,
      lastRunId: nextRun.id,
    },
    nextRun,
  );

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
  claimedSchedule: ContentSchedule,
  triggerSource: ScheduleTriggerSource,
  batchPosition?: number,
): Promise<ContentScheduleExecutionResult> {
  const startedAt = new Date().toISOString();
  const scheduledFor = claimedSchedule.nextRunAt ?? startedAt;
  const executionStartedAt = Date.now();
  metrics.increment("requestCount");

  let logs: ScheduleRunLogEntry[] = [
    createLog("queue", "Schedule claimed for execution.", {
      at: startedAt,
      details: {
        triggerSource,
        scheduledFor,
      },
    }),
  ];
  const initialRun: ContentScheduleRunRecord = {
    id: createContentScheduleRunId(claimedSchedule.id, startedAt),
    scheduleId: claimedSchedule.id,
    structureId: claimedSchedule.structureId,
    userId: claimedSchedule.userId,
    status: "running",
    attempt: claimedSchedule.lifecycle.nextRetryAt ? claimedSchedule.lifecycle.consecutiveFailures + 1 : 1,
    scheduledFor,
    startedAt,
    executionMode: claimedSchedule.executionMode,
    publishAction: undefined,
    triggerSource,
    retryable: false,
    logs,
    metrics: {
      batchPosition,
    },
    createdAt: startedAt,
    updatedAt: startedAt,
  };

  const runningSchedule: ContentSchedule = {
    ...claimedSchedule,
    status: "running",
    lifecycle: {
      ...claimedSchedule.lifecycle,
      lastQueuedAt: scheduledFor,
      lastStartedAt: startedAt,
    },
    updatedAt: startedAt,
    version: claimedSchedule.version + 1,
  };
  await saveContentSchedule(runningSchedule);
  await saveContentScheduleRun(initialRun);

  try {
    const structure = await getOwnedStructureForSchedule(claimedSchedule.structureId, claimedSchedule.userId);
    if (!structure) {
      throw new Error("Website structure not found for the scheduled execution.");
    }

    const prepared = await prepareStructureForExecution(claimedSchedule, structure, scheduledFor, logs);
    logs = prepared.logs;
    const publication = detectPublicationState(prepared.structure);
    const publishAction: PublishAction = publication.neverPublished ? "publish" : "update";
    const publishStartedAt = Date.now();

    logs = appendLog(
      logs,
      createLog("publish", "Invoking the existing publish workflow.", {
        details: {
          publishAction,
          publicationState: publication.state,
        },
      }),
    );

    const publishResult = await runPublishWorkflow({
      structure: prepared.structure,
      userId: claimedSchedule.userId,
      action: publishAction,
    });

    if (!publishResult.ok || !publishResult.structure || !publishResult.detection) {
      const publishError =
        publishResult.error ||
        "Scheduled publish failed before the publish workflow returned a structure.";
      throw new Error(publishError);
    }

    metrics.recordDuration("contentScheduleExecutionMs", Date.now() - executionStartedAt);
    return finalizeSuccess(
      runningSchedule,
      {
        ...initialRun,
        publishAction,
        logs,
      },
      publishResult.structure.publication?.lastPublishedAt ?? startedAt,
      logs,
      {
        generationDurationMs: prepared.generationDurationMs,
        publishDurationMs: Date.now() - publishStartedAt,
      },
    );
  } catch (error) {
    metrics.increment("errorCount");
    logger.error("Scheduled content execution failed", {
      category: "error",
      service: "scheduling",
      scheduleId: claimedSchedule.id,
      structureId: claimedSchedule.structureId,
      error: {
        name: "ContentScheduleExecutionError",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return finalizeFailure(runningSchedule, initialRun, error, logs);
  }
}

export async function executeDueContentSchedules(limit = 5): Promise<ContentScheduleExecutionBatchResult> {
  const claimedAt = new Date().toISOString();
  const claimedSchedules = await claimDueContentSchedules(limit, claimedAt);
  const results: ContentScheduleExecutionResult[] = [];

  for (const [index, schedule] of claimedSchedules.entries()) {
    results.push(await executeClaimedSchedule(schedule, "scheduled", index + 1));
  }

  return {
    claimedCount: claimedSchedules.length,
    processedCount: results.length,
    schedules: results,
  };
}

export async function executeContentScheduleNow(
  scheduleId: string,
): Promise<ContentScheduleExecutionResult> {
  const schedule = await getContentScheduleById(scheduleId);
  if (!schedule) {
    throw new Error("Content schedule not found.");
  }

  if (schedule.status === "paused") {
    throw new Error("Resume the schedule before running it manually.");
  }

  if (schedule.status === "cancelled") {
    throw new Error("Cancelled schedules cannot be executed.");
  }

  const claimed = await claimContentScheduleForExecution(scheduleId);
  if (!claimed) {
    throw new Error("This schedule is already running or unavailable.");
  }

  claimed.nextRunAt = new Date().toISOString();
  return executeClaimedSchedule(claimed, "manual", 1);
}
