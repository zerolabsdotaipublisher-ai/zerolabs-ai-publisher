import "server-only";

import { getWebsiteStructure } from "@/lib/ai/structure";
import type { WebsiteStructure } from "@/lib/ai/structure";
import { updateArticlePublicationMetadata } from "@/lib/article";
import { updateBlogPublicationMetadata } from "@/lib/blog";
import { logger } from "@/lib/observability";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import {
  createContentScheduleId,
  deriveTargetContentType,
} from "./ids";
import { computeNextRunAt } from "./recurrence";
import {
  normalizeScheduleInput,
  normalizeScheduleLifecycle,
} from "./model";
import { validateContentScheduleInput } from "./validation";
import type {
  ContentSchedule,
  ContentScheduleRow,
  ContentScheduleRunRecord,
  ContentScheduleRunRow,
  ContentScheduleUpsertInput,
  ScheduleExecutionMode,
  ScheduleStatus,
} from "./types";

function fromRunRow(row: ContentScheduleRunRow): ContentScheduleRunRecord {
  return {
    id: row.id,
    scheduleId: row.schedule_id,
    structureId: row.structure_id,
    userId: row.user_id,
    status: row.status,
    attempt: row.attempt,
    scheduledFor: row.scheduled_for,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    executionMode: row.execution_mode,
    publishAction: row.publish_action ?? undefined,
    triggerSource: row.trigger_source,
    retryable: row.retryable,
    error: row.error ?? undefined,
    logs: Array.isArray(row.logs_json) ? (row.logs_json as ContentScheduleRunRecord["logs"]) : [],
    metrics: (row.metrics_json as ContentScheduleRunRecord["metrics"]) ?? {},
    nextRetryAt: row.next_retry_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRunRow(run: ContentScheduleRunRecord): ContentScheduleRunRow {
  return {
    id: run.id,
    schedule_id: run.scheduleId,
    structure_id: run.structureId,
    user_id: run.userId,
    status: run.status,
    attempt: run.attempt,
    scheduled_for: run.scheduledFor,
    started_at: run.startedAt ?? null,
    completed_at: run.completedAt ?? null,
    execution_mode: run.executionMode,
    publish_action: run.publishAction ?? null,
    trigger_source: run.triggerSource,
    retryable: run.retryable,
    error: run.error ?? null,
    logs_json: run.logs,
    metrics_json: run.metrics,
    next_retry_at: run.nextRetryAt ?? null,
    created_at: run.createdAt,
    updated_at: run.updatedAt,
  };
}

function fromRow(row: ContentScheduleRow, lastRun?: ContentScheduleRunRecord): ContentSchedule {
  return {
    id: row.id,
    structureId: row.structure_id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    websiteType: row.website_type,
    targetContentType: row.target_content_type,
    executionMode: row.execution_mode,
    timezone: row.timezone,
    startsAtLocal: row.starts_at_local,
    recurrence: row.recurrence_json as ContentSchedule["recurrence"],
    retryPolicy: row.retry_policy_json as ContentSchedule["retryPolicy"],
    lifecycle: normalizeScheduleLifecycle(row.lifecycle_json as Partial<ContentSchedule["lifecycle"]>),
    status: row.status,
    nextRunAt: row.next_run_at ?? undefined,
    lastRunId: row.last_run_id ?? undefined,
    lastRun,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(schedule: ContentSchedule): ContentScheduleRow {
  return {
    id: schedule.id,
    structure_id: schedule.structureId,
    user_id: schedule.userId,
    title: schedule.title,
    description: schedule.description ?? null,
    website_type: schedule.websiteType,
    target_content_type: schedule.targetContentType,
    execution_mode: schedule.executionMode,
    timezone: schedule.timezone,
    starts_at_local: schedule.startsAtLocal,
    recurrence_json: schedule.recurrence,
    retry_policy_json: schedule.retryPolicy,
    lifecycle_json: schedule.lifecycle,
    status: schedule.status,
    next_run_at: schedule.nextRunAt ?? null,
    last_run_id: schedule.lastRunId ?? null,
    version: schedule.version,
    created_at: schedule.createdAt,
    updated_at: schedule.updatedAt,
  };
}

async function getRunById(runId: string): Promise<ContentScheduleRunRecord | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("content_schedule_runs")
    .select("*")
    .eq("id", runId)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch content schedule run", {
      category: "error",
      service: "supabase",
      runId,
      error: {
        name: "ContentScheduleRunError",
        message: error.message,
      },
    });
    throw error;
  }

  return data ? fromRunRow(data as ContentScheduleRunRow) : null;
}

async function syncStructuredContentState(
  schedule: Pick<ContentSchedule, "structureId" | "userId" | "targetContentType" | "nextRunAt">,
  updates?: { publishedAt?: string | null },
): Promise<void> {
  switch (schedule.targetContentType) {
    case "blog":
      await updateBlogPublicationMetadata(schedule.structureId, schedule.userId, {
        scheduledPublishAt: schedule.nextRunAt ?? null,
        publishedAt: updates?.publishedAt,
      });
      return;
    case "article":
      await updateArticlePublicationMetadata(schedule.structureId, schedule.userId, {
        scheduledPublishAt: schedule.nextRunAt ?? null,
        publishedAt: updates?.publishedAt,
      });
      return;
    default:
      return;
  }
}

export async function saveContentSchedule(schedule: ContentSchedule): Promise<ContentSchedule> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("content_schedules").upsert(toRow(schedule), {
    onConflict: "id",
  });

  if (error) {
    logger.error("Failed to save content schedule", {
      category: "error",
      service: "supabase",
      scheduleId: schedule.id,
      structureId: schedule.structureId,
      error: {
        name: "ContentScheduleError",
        message: error.message,
      },
    });
    throw error;
  }

  return schedule;
}

export async function saveContentScheduleRun(run: ContentScheduleRunRecord): Promise<ContentScheduleRunRecord> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("content_schedule_runs").upsert(toRunRow(run), {
    onConflict: "id",
  });

  if (error) {
    logger.error("Failed to save content schedule run", {
      category: "error",
      service: "supabase",
      scheduleId: run.scheduleId,
      runId: run.id,
      error: {
        name: "ContentScheduleRunError",
        message: error.message,
      },
    });
    throw error;
  }

  return run;
}

export async function listOwnedContentScheduleRuns(
  scheduleId: string,
  userId: string,
  limit = 10,
): Promise<ContentScheduleRunRecord[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("content_schedule_runs")
    .select("*")
    .eq("schedule_id", scheduleId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.error("Failed to list content schedule runs", {
      category: "error",
      service: "supabase",
      scheduleId,
      userId,
      error: {
        name: "ContentScheduleRunError",
        message: error.message,
      },
    });
    throw error;
  }

  return ((data ?? []) as ContentScheduleRunRow[]).map(fromRunRow);
}

export async function getContentScheduleById(scheduleId: string): Promise<ContentSchedule | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("content_schedules")
    .select("*")
    .eq("id", scheduleId)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch content schedule", {
      category: "error",
      service: "supabase",
      scheduleId,
      error: {
        name: "ContentScheduleError",
        message: error.message,
      },
    });
    throw error;
  }

  if (!data) {
    return null;
  }

  const row = data as ContentScheduleRow;
  const lastRun = row.last_run_id ? await getRunById(row.last_run_id) : null;
  return fromRow(row, lastRun ?? undefined);
}

export async function getOwnedContentScheduleById(
  scheduleId: string,
  userId: string,
): Promise<ContentSchedule | null> {
  const schedule = await getContentScheduleById(scheduleId);
  if (!schedule || schedule.userId !== userId) {
    return null;
  }

  return schedule;
}

export async function getOwnedContentScheduleByStructureId(
  structureId: string,
  userId: string,
): Promise<ContentSchedule | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("content_schedules")
    .select("*")
    .eq("structure_id", structureId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch content schedule by structure", {
      category: "error",
      service: "supabase",
      structureId,
      userId,
      error: {
        name: "ContentScheduleError",
        message: error.message,
      },
    });
    throw error;
  }

  if (!data) {
    return null;
  }

  const row = data as ContentScheduleRow;
  const lastRun = row.last_run_id ? await getRunById(row.last_run_id) : null;
  return fromRow(row, lastRun ?? undefined);
}

export async function listOwnedContentSchedules(
  userId: string,
  options?: { structureId?: string },
): Promise<ContentSchedule[]> {
  const supabase = getSupabaseServiceClient();
  let query = supabase
    .from("content_schedules")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (options?.structureId) {
    query = query.eq("structure_id", options.structureId);
  }

  const { data, error } = await query;

  if (error) {
    logger.error("Failed to list content schedules", {
      category: "error",
      service: "supabase",
      userId,
      structureId: options?.structureId,
      error: {
        name: "ContentScheduleError",
        message: error.message,
      },
    });
    throw error;
  }

  return ((data ?? []) as ContentScheduleRow[]).map((row) => fromRow(row));
}

export async function upsertOwnedContentSchedule(
  structure: WebsiteStructure,
  input: ContentScheduleUpsertInput,
): Promise<ContentSchedule> {
  const errors = validateContentScheduleInput(input, structure);
  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  const now = new Date().toISOString();
  const existing = await getOwnedContentScheduleByStructureId(structure.id, structure.userId);
  const normalizedInput = normalizeScheduleInput(
    input,
    structure.websiteType,
    existing?.retryPolicy,
  );
  const lifecycle = normalizeScheduleLifecycle({
    ...existing?.lifecycle,
    lastError: undefined,
    nextRetryAt: undefined,
  });
  const targetContentType = deriveTargetContentType(structure.websiteType);

  const schedule: ContentSchedule = {
    id: existing?.id ?? createContentScheduleId(structure.id),
    structureId: structure.id,
    userId: structure.userId,
    title: normalizedInput.title,
    description: normalizedInput.description,
    websiteType: structure.websiteType,
    targetContentType,
    executionMode: normalizedInput.executionMode,
    timezone: normalizedInput.timezone,
    startsAtLocal: normalizedInput.startsAtLocal,
    recurrence: normalizedInput.recurrence,
    retryPolicy: normalizedInput.retryPolicy,
    lifecycle,
    status: "active",
    nextRunAt: undefined,
    lastRunId: existing?.lastRunId,
    lastRun: existing?.lastRun,
    version: existing ? existing.version + 1 : 1,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  schedule.nextRunAt = computeNextRunAt(schedule, now);
  if (!schedule.nextRunAt) {
    throw new Error("The provided schedule does not resolve to a future run.");
  }

  const savedSchedule = await saveContentSchedule(schedule);
  await syncStructuredContentState(savedSchedule);
  return savedSchedule;
}

export async function updateContentScheduleStatus(
  schedule: ContentSchedule,
  status: ScheduleStatus,
  options?: { nextRunAt?: string; clearContentSchedule?: boolean },
): Promise<ContentSchedule> {
  const nextSchedule: ContentSchedule = {
    ...schedule,
    status,
    nextRunAt: options?.nextRunAt,
    updatedAt: new Date().toISOString(),
  };

  await saveContentSchedule(nextSchedule);

  if (options?.clearContentSchedule) {
    await syncStructuredContentState(
      {
        structureId: nextSchedule.structureId,
        userId: nextSchedule.userId,
        targetContentType: nextSchedule.targetContentType,
        nextRunAt: undefined,
      },
      { publishedAt: undefined },
    );
  } else {
    await syncStructuredContentState(nextSchedule);
  }

  return nextSchedule;
}

export async function pauseOwnedContentSchedule(
  scheduleId: string,
  userId: string,
): Promise<ContentSchedule | null> {
  const schedule = await getOwnedContentScheduleById(scheduleId, userId);
  if (!schedule) {
    return null;
  }

  return updateContentScheduleStatus(schedule, "paused", {
    nextRunAt: undefined,
    clearContentSchedule: true,
  });
}

export async function resumeOwnedContentSchedule(
  scheduleId: string,
  userId: string,
): Promise<ContentSchedule | null> {
  const schedule = await getOwnedContentScheduleById(scheduleId, userId);
  if (!schedule) {
    return null;
  }

  const nextRunAt = computeNextRunAt(schedule, new Date().toISOString());
  if (!nextRunAt) {
    throw new Error("The current schedule cannot be resumed because it has no future run.");
  }

  const savedSchedule = await saveContentSchedule({
    ...schedule,
    status: "active",
    nextRunAt,
    updatedAt: new Date().toISOString(),
    version: schedule.version + 1,
    lifecycle: {
      ...schedule.lifecycle,
      lastError: undefined,
      nextRetryAt: undefined,
    },
  });
  await syncStructuredContentState(savedSchedule);
  return savedSchedule;
}

export async function cancelOwnedContentSchedule(
  scheduleId: string,
  userId: string,
): Promise<ContentSchedule | null> {
  const schedule = await getOwnedContentScheduleById(scheduleId, userId);
  if (!schedule) {
    return null;
  }

  return updateContentScheduleStatus(schedule, "cancelled", {
    nextRunAt: undefined,
    clearContentSchedule: true,
  });
}

export async function getOwnedStructureForSchedule(
  structureId: string,
  userId: string,
): Promise<WebsiteStructure | null> {
  return getWebsiteStructure(structureId, userId);
}

export async function claimDueContentSchedules(limit: number, claimedAt: string): Promise<ContentSchedule[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.rpc("claim_due_content_schedules", {
    p_now: claimedAt,
    p_limit: limit,
  });

  if (error) {
    logger.error("Failed to claim due content schedules", {
      category: "error",
      service: "supabase",
      error: {
        name: "ContentScheduleClaimError",
        message: error.message,
      },
    });
    throw error;
  }

  return ((data ?? []) as ContentScheduleRow[]).map((row) => fromRow(row));
}

export async function claimContentScheduleForExecution(
  scheduleId: string,
  executionMode?: ScheduleExecutionMode,
): Promise<ContentSchedule | null> {
  const schedule = await getContentScheduleById(scheduleId);
  if (!schedule) {
    return null;
  }

  if (schedule.status === "running" || schedule.status === "cancelled") {
    return null;
  }

  const nextSchedule: ContentSchedule = {
    ...schedule,
    status: "running",
    executionMode: executionMode ?? schedule.executionMode,
    updatedAt: new Date().toISOString(),
    version: schedule.version + 1,
  };

  return saveContentSchedule(nextSchedule);
}

export async function saveScheduleExecutionState(
  schedule: ContentSchedule,
  run: ContentScheduleRunRecord,
  options?: { publishedAt?: string | null },
): Promise<void> {
  await saveContentScheduleRun(run);
  await saveContentSchedule({
    ...schedule,
    lastRunId: run.id,
  });
  await syncStructuredContentState(schedule, { publishedAt: options?.publishedAt });
}
