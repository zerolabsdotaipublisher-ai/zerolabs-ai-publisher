import "server-only";

import { randomBytes } from "node:crypto";
import { logger } from "@/lib/observability";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type {
  SocialPublishHistoryDelivery,
  SocialPublishHistoryDeliveryRow,
  SocialPublishHistoryEvent,
  SocialPublishHistoryEventRow,
  SocialPublishHistoryJob,
  SocialPublishHistoryJobRow,
  SocialPublishHistoryJobWithDetails,
  SocialPublishHistoryListFilter,
  SocialPublishHistoryListResult,
  SocialPublishHistoryStatus,
} from "./types";

function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
}

export function createSocialPublishHistoryJobId(): string {
  return createId("sphj");
}

export function createSocialPublishHistoryDeliveryId(historyJobId: string): string {
  return createId(`sphd_${historyJobId.slice(0, 10)}`);
}

export function createSocialPublishHistoryEventId(historyJobId: string): string {
  return createId(`sphe_${historyJobId.slice(0, 10)}`);
}

function fromRow(row: SocialPublishHistoryJobRow): SocialPublishHistoryJob {
  return {
    id: row.id,
    userId: row.user_id,
    tenantId: row.tenant_id ?? undefined,
    structureId: row.structure_id ?? undefined,
    socialPostId: row.social_post_id ?? undefined,
    publishJobId: row.publish_job_id ?? undefined,
    source: row.source,
    sourceRefId: row.source_ref_id ?? undefined,
    status: row.status,
    platform: row.platform,
    contentSnapshot: (row.content_snapshot_json as SocialPublishHistoryJob["contentSnapshot"]) ?? {
      caption: "",
      media: [],
      metadata: {},
    },
    accountReference: (row.account_reference_json as SocialPublishHistoryJob["accountReference"]) ?? {},
    requestPayload: (row.request_payload_json as Record<string, unknown>) ?? {},
    responsePayload: (row.response_payload_json as Record<string, unknown>) ?? {},
    lifecycle: Array.isArray(row.lifecycle_json)
      ? (row.lifecycle_json as SocialPublishHistoryJob["lifecycle"])
      : [],
    error: (row.error_json as SocialPublishHistoryJob["error"]) ?? undefined,
    scheduledAt: row.scheduled_at ?? undefined,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    retryAt: row.retry_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(job: SocialPublishHistoryJob): SocialPublishHistoryJobRow {
  return {
    id: job.id,
    user_id: job.userId,
    tenant_id: job.tenantId ?? null,
    structure_id: job.structureId ?? null,
    social_post_id: job.socialPostId ?? null,
    publish_job_id: job.publishJobId ?? null,
    source: job.source,
    source_ref_id: job.sourceRefId ?? null,
    status: job.status,
    platform: job.platform,
    content_snapshot_json: job.contentSnapshot,
    account_reference_json: job.accountReference,
    request_payload_json: job.requestPayload,
    response_payload_json: job.responsePayload,
    lifecycle_json: job.lifecycle,
    error_json: job.error ?? null,
    scheduled_at: job.scheduledAt ?? null,
    started_at: job.startedAt ?? null,
    completed_at: job.completedAt ?? null,
    retry_at: job.retryAt ?? null,
    created_at: job.createdAt,
    updated_at: job.updatedAt,
  };
}

function fromDeliveryRow(row: SocialPublishHistoryDeliveryRow): SocialPublishHistoryDelivery {
  return {
    id: row.id,
    historyJobId: row.history_job_id,
    userId: row.user_id,
    tenantId: row.tenant_id ?? undefined,
    platform: row.platform,
    status: row.status,
    accountReference: (row.account_reference_json as SocialPublishHistoryDelivery["accountReference"]) ?? {},
    requestPayload: (row.request_payload_json as Record<string, unknown>) ?? {},
    responsePayload: (row.response_payload_json as Record<string, unknown>) ?? {},
    error: (row.error_json as SocialPublishHistoryDelivery["error"]) ?? undefined,
    requestedAt: row.requested_at ?? undefined,
    queuedAt: row.queued_at ?? undefined,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    retryAt: row.retry_at ?? undefined,
    canceledAt: row.canceled_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDeliveryRow(delivery: SocialPublishHistoryDelivery): SocialPublishHistoryDeliveryRow {
  return {
    id: delivery.id,
    history_job_id: delivery.historyJobId,
    user_id: delivery.userId,
    tenant_id: delivery.tenantId ?? null,
    platform: delivery.platform,
    status: delivery.status,
    account_reference_json: delivery.accountReference,
    request_payload_json: delivery.requestPayload,
    response_payload_json: delivery.responsePayload,
    error_json: delivery.error ?? null,
    requested_at: delivery.requestedAt ?? null,
    queued_at: delivery.queuedAt ?? null,
    started_at: delivery.startedAt ?? null,
    completed_at: delivery.completedAt ?? null,
    retry_at: delivery.retryAt ?? null,
    canceled_at: delivery.canceledAt ?? null,
    created_at: delivery.createdAt,
    updated_at: delivery.updatedAt,
  };
}

function fromEventRow(row: SocialPublishHistoryEventRow): SocialPublishHistoryEvent {
  return {
    id: row.id,
    historyJobId: row.history_job_id,
    deliveryId: row.delivery_id ?? undefined,
    userId: row.user_id,
    tenantId: row.tenant_id ?? undefined,
    eventType: row.event_type,
    severity: row.severity,
    message: row.message,
    payload: (row.payload_json as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
  };
}

function toEventRow(event: SocialPublishHistoryEvent): SocialPublishHistoryEventRow {
  return {
    id: event.id,
    history_job_id: event.historyJobId,
    delivery_id: event.deliveryId ?? null,
    user_id: event.userId,
    tenant_id: event.tenantId ?? null,
    event_type: event.eventType,
    severity: event.severity,
    message: event.message,
    payload_json: event.payload,
    created_at: event.createdAt,
  };
}

export async function saveSocialPublishHistoryJob(job: SocialPublishHistoryJob): Promise<SocialPublishHistoryJob> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("social_publish_history_jobs").upsert(toRow(job), {
    onConflict: "id",
  });

  if (error) {
    logger.error("Failed to save social publish history job", {
      category: "error",
      service: "supabase",
      historyJobId: job.id,
      error: { name: "SocialPublishHistoryJobSaveError", message: error.message },
    });
    throw error;
  }

  return job;
}

export async function updateSocialPublishHistoryJobStatus(
  historyJobId: string,
  userId: string,
  status: SocialPublishHistoryStatus,
  updates?: Partial<
    Pick<
      SocialPublishHistoryJob,
      "requestPayload" | "responsePayload" | "error" | "startedAt" | "completedAt" | "retryAt" | "scheduledAt"
    >
  >,
): Promise<SocialPublishHistoryJob | null> {
  const existing = await getOwnedSocialPublishHistoryJobById(historyJobId, userId);
  if (!existing) {
    return null;
  }

  const updated: SocialPublishHistoryJob = {
    ...existing,
    status,
    requestPayload: updates?.requestPayload ?? existing.requestPayload,
    responsePayload: updates?.responsePayload ?? existing.responsePayload,
    error: updates?.error,
    startedAt: updates?.startedAt ?? existing.startedAt,
    completedAt: updates?.completedAt ?? existing.completedAt,
    retryAt: updates?.retryAt,
    scheduledAt: updates?.scheduledAt ?? existing.scheduledAt,
    lifecycle: [
      ...existing.lifecycle,
      {
        status,
        at: new Date().toISOString(),
        message: `History status transitioned to ${status}.`,
      },
    ],
    updatedAt: new Date().toISOString(),
  };

  return saveSocialPublishHistoryJob(updated);
}

export async function getSocialPublishHistoryJobById(historyJobId: string): Promise<SocialPublishHistoryJob | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("social_publish_history_jobs")
    .select("*")
    .eq("id", historyJobId)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch social publish history job", {
      category: "error",
      service: "supabase",
      historyJobId,
      error: { name: "SocialPublishHistoryJobFetchError", message: error.message },
    });
    throw error;
  }

  return data ? fromRow(data as SocialPublishHistoryJobRow) : null;
}

export async function getOwnedSocialPublishHistoryJobById(
  historyJobId: string,
  userId: string,
): Promise<SocialPublishHistoryJob | null> {
  const history = await getSocialPublishHistoryJobById(historyJobId);
  if (!history || history.userId !== userId) {
    return null;
  }

  return history;
}

export async function getSocialPublishHistoryByPublishJobId(
  publishJobId: string,
  userId: string,
): Promise<SocialPublishHistoryJob | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("social_publish_history_jobs")
    .select("*")
    .eq("publish_job_id", publishJobId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch social publish history by publish job", {
      category: "error",
      service: "supabase",
      publishJobId,
      userId,
      error: { name: "SocialPublishHistoryJobFetchByPublishJobError", message: error.message },
    });
    throw error;
  }

  return data ? fromRow(data as SocialPublishHistoryJobRow) : null;
}

export async function listOwnedSocialPublishHistoryJobs(
  userId: string,
  filter: SocialPublishHistoryListFilter,
): Promise<SocialPublishHistoryListResult> {
  const supabase = getSupabaseServiceClient();
  let query = supabase
    .from("social_publish_history_jobs")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (filter.status) {
    query = query.eq("status", filter.status);
  }
  if (filter.platform) {
    query = query.eq("platform", filter.platform);
  }
  if (filter.from) {
    query = query.gte("created_at", filter.from);
  }
  if (filter.to) {
    query = query.lte("created_at", filter.to);
  }
  if (filter.accountId) {
    query = query.eq("account_reference_json->>platformAccountId", filter.accountId);
  }

  const fromIndex = (filter.page - 1) * filter.perPage;
  const toIndex = fromIndex + filter.perPage - 1;
  const { data, error, count } = await query.range(fromIndex, toIndex);

  if (error) {
    logger.error("Failed to list social publish history jobs", {
      category: "error",
      service: "supabase",
      userId,
      error: { name: "SocialPublishHistoryJobListError", message: error.message },
    });
    throw error;
  }

  return {
    items: ((data ?? []) as SocialPublishHistoryJobRow[]).map(fromRow),
    page: filter.page,
    perPage: filter.perPage,
    total: count ?? 0,
  };
}

export async function saveSocialPublishHistoryDelivery(
  delivery: SocialPublishHistoryDelivery,
): Promise<SocialPublishHistoryDelivery> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("social_publish_history_deliveries").upsert(toDeliveryRow(delivery), {
    onConflict: "id",
  });

  if (error) {
    logger.error("Failed to save social publish history delivery", {
      category: "error",
      service: "supabase",
      historyJobId: delivery.historyJobId,
      deliveryId: delivery.id,
      error: { name: "SocialPublishHistoryDeliverySaveError", message: error.message },
    });
    throw error;
  }

  return delivery;
}

export async function listOwnedSocialPublishHistoryDeliveries(
  historyJobId: string,
  userId: string,
): Promise<SocialPublishHistoryDelivery[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("social_publish_history_deliveries")
    .select("*")
    .eq("history_job_id", historyJobId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    logger.error("Failed to list social publish history deliveries", {
      category: "error",
      service: "supabase",
      historyJobId,
      userId,
      error: { name: "SocialPublishHistoryDeliveryListError", message: error.message },
    });
    throw error;
  }

  return ((data ?? []) as SocialPublishHistoryDeliveryRow[]).map(fromDeliveryRow);
}

export async function saveSocialPublishHistoryEvent(event: SocialPublishHistoryEvent): Promise<SocialPublishHistoryEvent> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("social_publish_history_events").insert(toEventRow(event));

  if (error) {
    logger.error("Failed to save social publish history event", {
      category: "error",
      service: "supabase",
      historyJobId: event.historyJobId,
      eventType: event.eventType,
      error: { name: "SocialPublishHistoryEventSaveError", message: error.message },
    });
    throw error;
  }

  return event;
}

export async function listOwnedSocialPublishHistoryEvents(
  historyJobId: string,
  userId: string,
): Promise<SocialPublishHistoryEvent[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("social_publish_history_events")
    .select("*")
    .eq("history_job_id", historyJobId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Failed to list social publish history events", {
      category: "error",
      service: "supabase",
      historyJobId,
      userId,
      error: { name: "SocialPublishHistoryEventListError", message: error.message },
    });
    throw error;
  }

  return ((data ?? []) as SocialPublishHistoryEventRow[]).map(fromEventRow);
}

export async function getOwnedSocialPublishHistoryDetail(
  historyJobId: string,
  userId: string,
): Promise<SocialPublishHistoryJobWithDetails | null> {
  const job = await getOwnedSocialPublishHistoryJobById(historyJobId, userId);
  if (!job) return null;

  const [deliveries, events] = await Promise.all([
    listOwnedSocialPublishHistoryDeliveries(historyJobId, userId),
    listOwnedSocialPublishHistoryEvents(historyJobId, userId),
  ]);

  return {
    ...job,
    deliveries,
    events,
  };
}
