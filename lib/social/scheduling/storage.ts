import "server-only";

import { logger } from "@/lib/observability";
import { getSocialPostById, upsertSocialPost } from "@/lib/social/storage";
import type { GeneratedSocialPost, SocialPlatform } from "@/lib/social/types";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { computeNextSocialScheduleRunAt } from "./recurrence";
import { normalizeSocialScheduleInput, validateSocialScheduleInput } from "./validation";
import type {
  SocialSchedule,
  SocialScheduleEvent,
  SocialScheduleEventRow,
  SocialScheduleRow,
  SocialScheduleRunRecord,
  SocialScheduleRunRow,
  SocialScheduleStatus,
  SocialScheduleUpsertInput,
} from "./types";

function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createSocialScheduleId(userId: string, socialPostId: string): string {
  return `ssched_${userId.slice(0, 8)}_${socialPostId.slice(0, 12)}`;
}

export function createSocialScheduleRunId(scheduleId: string): string {
  return createId(`ssrun_${scheduleId.slice(0, 16)}`);
}

export function createSocialScheduleEventId(scheduleId: string): string {
  return createId(`ssevt_${scheduleId.slice(0, 16)}`);
}

function defaultLifecycle(): SocialSchedule["lifecycle"] {
  return {
    consecutiveFailures: 0,
    totalRuns: 0,
    successCount: 0,
    failureCount: 0,
    completedOccurrences: 0,
  };
}

function fromRunRow(row: SocialScheduleRunRow): SocialScheduleRunRecord {
  return {
    id: row.id,
    scheduleId: row.schedule_id,
    userId: row.user_id,
    socialPostId: row.social_post_id,
    status: row.status,
    attempt: row.attempt,
    scheduledFor: row.scheduled_for,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    triggerSource: row.trigger_source,
    targetPlatforms: (row.target_platforms ?? []) as SocialPlatform[],
    publishedPlatforms: (row.published_platforms ?? []) as SocialPlatform[],
    failedPlatforms: (row.failed_platforms ?? []) as SocialPlatform[],
    queuedJobs: Array.isArray(row.queued_jobs_json)
      ? (row.queued_jobs_json as SocialScheduleRunRecord["queuedJobs"])
      : [],
    retryable: row.retryable,
    error: row.error ?? undefined,
    logs: Array.isArray(row.logs_json) ? (row.logs_json as SocialScheduleRunRecord["logs"]) : [],
    nextRetryAt: row.next_retry_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRunRow(run: SocialScheduleRunRecord): SocialScheduleRunRow {
  return {
    id: run.id,
    schedule_id: run.scheduleId,
    user_id: run.userId,
    social_post_id: run.socialPostId,
    status: run.status,
    attempt: run.attempt,
    scheduled_for: run.scheduledFor,
    started_at: run.startedAt ?? null,
    completed_at: run.completedAt ?? null,
    trigger_source: run.triggerSource,
    target_platforms: run.targetPlatforms,
    published_platforms: run.publishedPlatforms,
    failed_platforms: run.failedPlatforms,
    queued_jobs_json: run.queuedJobs,
    retryable: run.retryable,
    error: run.error ?? null,
    logs_json: run.logs,
    next_retry_at: run.nextRetryAt ?? null,
    created_at: run.createdAt,
    updated_at: run.updatedAt,
  };
}

function fromEventRow(row: SocialScheduleEventRow): SocialScheduleEvent {
  return {
    id: row.id,
    scheduleId: row.schedule_id,
    userId: row.user_id,
    runId: row.run_id ?? undefined,
    eventType: row.event_type,
    severity: row.severity,
    message: row.message,
    metadata: (row.metadata_json as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
  };
}

function toEventRow(event: SocialScheduleEvent): SocialScheduleEventRow {
  return {
    id: event.id,
    schedule_id: event.scheduleId,
    user_id: event.userId,
    run_id: event.runId ?? null,
    event_type: event.eventType,
    severity: event.severity,
    message: event.message,
    metadata_json: event.metadata,
    created_at: event.createdAt,
  };
}

function fromRow(row: SocialScheduleRow, lastRun?: SocialScheduleRunRecord): SocialSchedule {
  return {
    id: row.id,
    userId: row.user_id,
    structureId: row.structure_id ?? undefined,
    socialPostId: row.social_post_id,
    title: row.title,
    description: row.description ?? undefined,
    timezone: row.timezone,
    startsAtLocal: row.starts_at_local,
    recurrence: row.recurrence_json as SocialSchedule["recurrence"],
    targets: row.targets_json as SocialSchedule["targets"],
    retryPolicy: row.retry_policy_json as SocialSchedule["retryPolicy"],
    lifecycle: {
      ...defaultLifecycle(),
      ...(row.lifecycle_json as Partial<SocialSchedule["lifecycle"]>),
    },
    status: row.status,
    scheduledFor: row.scheduled_for ?? undefined,
    lastRunId: row.last_run_id ?? undefined,
    lastRun,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(schedule: SocialSchedule): SocialScheduleRow {
  return {
    id: schedule.id,
    user_id: schedule.userId,
    structure_id: schedule.structureId ?? null,
    social_post_id: schedule.socialPostId,
    title: schedule.title,
    description: schedule.description ?? null,
    timezone: schedule.timezone,
    starts_at_local: schedule.startsAtLocal,
    recurrence_json: schedule.recurrence,
    targets_json: schedule.targets,
    retry_policy_json: schedule.retryPolicy,
    lifecycle_json: schedule.lifecycle,
    status: schedule.status,
    scheduled_for: schedule.scheduledFor ?? null,
    last_run_id: schedule.lastRunId ?? null,
    version: schedule.version,
    created_at: schedule.createdAt,
    updated_at: schedule.updatedAt,
  };
}

async function setSocialPostScheduleMetadata(
  post: GeneratedSocialPost,
  userId: string,
  updates: { scheduledPublishAt?: string | null; publishedAt?: string | null },
): Promise<void> {
  await upsertSocialPost(
    {
      ...post,
      scheduledPublishAt: updates.scheduledPublishAt === undefined ? post.scheduledPublishAt : updates.scheduledPublishAt ?? undefined,
      publishedAt: updates.publishedAt === undefined ? post.publishedAt : updates.publishedAt ?? undefined,
      updatedAt: new Date().toISOString(),
      version: post.version + 1,
    },
    userId,
  );
}

export async function saveSocialSchedule(schedule: SocialSchedule): Promise<SocialSchedule> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("social_schedules").upsert(toRow(schedule), {
    onConflict: "id",
  });

  if (error) {
    logger.error("Failed to save social schedule", {
      category: "error",
      service: "supabase",
      scheduleId: schedule.id,
      error: { name: "SocialScheduleSaveError", message: error.message },
    });
    throw error;
  }

  return schedule;
}

export async function saveSocialScheduleRun(run: SocialScheduleRunRecord): Promise<SocialScheduleRunRecord> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("social_schedule_runs").upsert(toRunRow(run), {
    onConflict: "id",
  });

  if (error) {
    logger.error("Failed to save social schedule run", {
      category: "error",
      service: "supabase",
      scheduleId: run.scheduleId,
      runId: run.id,
      error: { name: "SocialScheduleRunSaveError", message: error.message },
    });
    throw error;
  }

  return run;
}

export async function saveSocialScheduleEvent(event: SocialScheduleEvent): Promise<SocialScheduleEvent> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("social_schedule_events").insert(toEventRow(event));

  if (error) {
    logger.error("Failed to save social schedule event", {
      category: "error",
      service: "supabase",
      scheduleId: event.scheduleId,
      eventType: event.eventType,
      error: { name: "SocialScheduleEventSaveError", message: error.message },
    });
    throw error;
  }

  return event;
}

export async function getSocialScheduleById(scheduleId: string): Promise<SocialSchedule | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("social_schedules")
    .select("*")
    .eq("id", scheduleId)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch social schedule", {
      category: "error",
      service: "supabase",
      scheduleId,
      error: { name: "SocialScheduleFetchError", message: error.message },
    });
    throw error;
  }

  if (!data) {
    return null;
  }

  const row = data as SocialScheduleRow;
  const lastRun = row.last_run_id ? await getSocialScheduleRunById(row.last_run_id) : null;
  return fromRow(row, lastRun ?? undefined);
}

export async function getOwnedSocialScheduleById(
  scheduleId: string,
  userId: string,
): Promise<SocialSchedule | null> {
  const schedule = await getSocialScheduleById(scheduleId);
  if (!schedule || schedule.userId !== userId) {
    return null;
  }

  return schedule;
}

export async function getOwnedSocialScheduleByPostId(
  socialPostId: string,
  userId: string,
): Promise<SocialSchedule | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("social_schedules")
    .select("*")
    .eq("user_id", userId)
    .eq("social_post_id", socialPostId)
    .neq("status", "canceled")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch social schedule by social post", {
      category: "error",
      service: "supabase",
      userId,
      socialPostId,
      error: { name: "SocialScheduleFetchError", message: error.message },
    });
    throw error;
  }

  if (!data) {
    return null;
  }

  const row = data as SocialScheduleRow;
  const lastRun = row.last_run_id ? await getSocialScheduleRunById(row.last_run_id) : null;
  return fromRow(row, lastRun ?? undefined);
}

export async function listOwnedSocialSchedules(
  userId: string,
  options?: { structureId?: string; socialPostId?: string },
): Promise<SocialSchedule[]> {
  const supabase = getSupabaseServiceClient();
  let query = supabase
    .from("social_schedules")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (options?.structureId) {
    query = query.eq("structure_id", options.structureId);
  }
  if (options?.socialPostId) {
    query = query.eq("social_post_id", options.socialPostId);
  }

  const { data, error } = await query;
  if (error) {
    logger.error("Failed to list social schedules", {
      category: "error",
      service: "supabase",
      userId,
      structureId: options?.structureId,
      socialPostId: options?.socialPostId,
      error: { name: "SocialScheduleListError", message: error.message },
    });
    throw error;
  }

  return ((data ?? []) as SocialScheduleRow[]).map((row) => fromRow(row));
}

export async function listOwnedSocialScheduleRuns(
  scheduleId: string,
  userId: string,
  limit = 20,
): Promise<SocialScheduleRunRecord[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("social_schedule_runs")
    .select("*")
    .eq("schedule_id", scheduleId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.error("Failed to list social schedule runs", {
      category: "error",
      service: "supabase",
      scheduleId,
      userId,
      error: { name: "SocialScheduleRunListError", message: error.message },
    });
    throw error;
  }

  return ((data ?? []) as SocialScheduleRunRow[]).map(fromRunRow);
}

export async function listOwnedSocialScheduleEvents(
  scheduleId: string,
  userId: string,
  limit = 20,
): Promise<SocialScheduleEvent[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("social_schedule_events")
    .select("*")
    .eq("schedule_id", scheduleId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.error("Failed to list social schedule events", {
      category: "error",
      service: "supabase",
      scheduleId,
      userId,
      error: { name: "SocialScheduleEventListError", message: error.message },
    });
    throw error;
  }

  return ((data ?? []) as SocialScheduleEventRow[]).map(fromEventRow);
}

export async function getSocialScheduleRunById(runId: string): Promise<SocialScheduleRunRecord | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("social_schedule_runs")
    .select("*")
    .eq("id", runId)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch social schedule run", {
      category: "error",
      service: "supabase",
      runId,
      error: { name: "SocialScheduleRunFetchError", message: error.message },
    });
    throw error;
  }

  return data ? fromRunRow(data as SocialScheduleRunRow) : null;
}

export async function claimDueSocialSchedules(limit: number, claimedAt: string): Promise<SocialSchedule[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.rpc("claim_due_social_schedules", {
    p_now: claimedAt,
    p_limit: limit,
  });

  if (error) {
    logger.error("Failed to claim due social schedules", {
      category: "error",
      service: "supabase",
      error: { name: "SocialScheduleClaimError", message: error.message },
    });
    throw error;
  }

  return ((data ?? []) as SocialScheduleRow[]).map((row) => fromRow(row));
}

export async function claimSocialScheduleForExecution(scheduleId: string): Promise<SocialSchedule | null> {
  const schedule = await getSocialScheduleById(scheduleId);
  if (!schedule) {
    return null;
  }

  if (["queued", "publishing", "canceled"].includes(schedule.status)) {
    return null;
  }

  const nextSchedule: SocialSchedule = {
    ...schedule,
    status: "queued",
    updatedAt: new Date().toISOString(),
    version: schedule.version + 1,
  };

  return saveSocialSchedule(nextSchedule);
}

export async function upsertOwnedSocialSchedule(
  input: SocialScheduleUpsertInput,
  userId: string,
): Promise<SocialSchedule> {
  const socialPost = await getSocialPostById(input.socialPostId, userId);
  if (!socialPost) {
    throw new Error("Social post not found.");
  }

  const errors = validateSocialScheduleInput(input, socialPost);
  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  const normalized = normalizeSocialScheduleInput(input);
  const now = new Date().toISOString();
  const existing = await getOwnedSocialScheduleByPostId(input.socialPostId, userId);

  const schedule: SocialSchedule = {
    id: existing?.id ?? createSocialScheduleId(userId, input.socialPostId),
    userId,
    structureId: socialPost.structureId,
    socialPostId: input.socialPostId,
    title: normalized.title,
    description: normalized.description,
    timezone: normalized.timezone,
    startsAtLocal: normalized.startsAtLocal,
    recurrence: normalized.recurrence,
    targets: normalized.targets,
    retryPolicy: normalized.retryPolicy,
    lifecycle: {
      ...defaultLifecycle(),
      ...(existing?.lifecycle ?? {}),
      lastError: undefined,
      nextRetryAt: undefined,
    },
    status: normalized.status,
    scheduledFor: undefined,
    lastRunId: existing?.lastRunId,
    lastRun: existing?.lastRun,
    version: existing ? existing.version + 1 : 1,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  if (normalized.status === "scheduled") {
    schedule.scheduledFor = computeNextSocialScheduleRunAt(schedule, now);
    if (!schedule.scheduledFor) {
      throw new Error("The provided social schedule does not resolve to a future run.");
    }
  }

  const saved = await saveSocialSchedule(schedule);
  await setSocialPostScheduleMetadata(socialPost, userId, {
    scheduledPublishAt: saved.scheduledFor ?? null,
  });
  return saved;
}

export async function updateOwnedSocialSchedule(
  scheduleId: string,
  userId: string,
  input: Partial<SocialScheduleUpsertInput>,
): Promise<SocialSchedule | null> {
  const existing = await getOwnedSocialScheduleById(scheduleId, userId);
  if (!existing) {
    return null;
  }

  const mergedInput: SocialScheduleUpsertInput = {
    socialPostId: input.socialPostId ?? existing.socialPostId,
    title: input.title ?? existing.title,
    description: input.description ?? existing.description,
    timezone: input.timezone ?? existing.timezone,
    startsAtLocal: input.startsAtLocal ?? existing.startsAtLocal,
    recurrence: {
      ...existing.recurrence,
      ...(input.recurrence ?? {}),
    },
    targets: input.targets ?? existing.targets,
    retryPolicy: {
      ...existing.retryPolicy,
      ...(input.retryPolicy ?? {}),
    },
    status: input.status,
  };

  const next = await upsertOwnedSocialSchedule(mergedInput, userId);
  if (next.id !== scheduleId) {
    return saveSocialSchedule({
      ...next,
      id: scheduleId,
      version: existing.version + 1,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    });
  }

  return next;
}

export async function setOwnedSocialScheduleStatus(
  scheduleId: string,
  userId: string,
  status: SocialScheduleStatus,
  options?: { scheduledFor?: string; clearScheduledPublishAt?: boolean },
): Promise<SocialSchedule | null> {
  const schedule = await getOwnedSocialScheduleById(scheduleId, userId);
  if (!schedule) {
    return null;
  }

  const nextSchedule: SocialSchedule = {
    ...schedule,
    status,
    scheduledFor: options?.scheduledFor,
    updatedAt: new Date().toISOString(),
    version: schedule.version + 1,
  };

  await saveSocialSchedule(nextSchedule);

  const post = await getSocialPostById(nextSchedule.socialPostId, userId);
  if (post) {
    await setSocialPostScheduleMetadata(post, userId, {
      scheduledPublishAt: options?.clearScheduledPublishAt ? null : nextSchedule.scheduledFor ?? null,
    });
  }

  return nextSchedule;
}

export async function cancelOwnedSocialSchedule(
  scheduleId: string,
  userId: string,
): Promise<SocialSchedule | null> {
  return setOwnedSocialScheduleStatus(scheduleId, userId, "canceled", {
    scheduledFor: undefined,
    clearScheduledPublishAt: true,
  });
}

export async function saveSocialScheduleExecutionState(
  schedule: SocialSchedule,
  run: SocialScheduleRunRecord,
): Promise<void> {
  await saveSocialScheduleRun(run);
  await saveSocialSchedule({
    ...schedule,
    lastRunId: run.id,
  });

  const post = await getSocialPostById(schedule.socialPostId, schedule.userId);
  if (!post) {
    return;
  }

  await setSocialPostScheduleMetadata(post, schedule.userId, {
    scheduledPublishAt: schedule.scheduledFor ?? null,
    publishedAt: run.status === "published" ? run.completedAt ?? new Date().toISOString() : undefined,
  });
}

export async function countInFlightInstagramJobs(userId: string): Promise<number> {
  const supabase = getSupabaseServiceClient();
  const { count, error } = await supabase
    .from("social_publish_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("platform", "instagram")
    .in("status", ["pending", "retry_pending", "uploading", "publishing"]);

  if (error) {
    logger.error("Failed to count in-flight instagram jobs", {
      category: "error",
      service: "supabase",
      userId,
      error: { name: "SocialScheduleRateLimitCountError", message: error.message },
    });
    throw error;
  }

  return count ?? 0;
}
