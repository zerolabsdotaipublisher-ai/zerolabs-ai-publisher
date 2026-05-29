import type { SocialPlatform } from "@/lib/social/types";

export type SocialPublishHistoryStatus =
  | "requested"
  | "queued"
  | "publishing"
  | "published"
  | "failed"
  | "retry"
  | "canceled";

export type SocialPublishHistorySource = "manual" | "schedule" | "retry";

export interface SocialPublishHistoryAccountReference {
  platformAccountId?: string;
  platformUsername?: string;
  facebookPageId?: string;
}

export interface SocialPublishHistoryContentSnapshot {
  caption: string;
  media: string[];
  metadata: Record<string, unknown>;
}

export interface SocialPublishHistoryLifecycleEntry {
  status: SocialPublishHistoryStatus;
  at: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface SocialPublishHistoryError {
  code?: string;
  message: string;
  retryable?: boolean;
  details?: Record<string, unknown>;
}

export interface SocialPublishHistoryDelivery {
  id: string;
  historyJobId: string;
  userId: string;
  tenantId?: string;
  platform: SocialPlatform;
  status: SocialPublishHistoryStatus;
  accountReference: SocialPublishHistoryAccountReference;
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
  error?: SocialPublishHistoryError;
  requestedAt?: string;
  queuedAt?: string;
  startedAt?: string;
  completedAt?: string;
  retryAt?: string;
  canceledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPublishHistoryEvent {
  id: string;
  historyJobId: string;
  deliveryId?: string;
  userId: string;
  tenantId?: string;
  eventType:
    | "requested"
    | "queued"
    | "publishing"
    | "published"
    | "failed"
    | "retry"
    | "canceled"
    | "delivery_request"
    | "delivery_response"
    | "audit";
  severity: "info" | "warning" | "error";
  message: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface SocialPublishHistoryJob {
  id: string;
  userId: string;
  tenantId?: string;
  structureId?: string;
  socialPostId?: string;
  publishJobId?: string;
  source: SocialPublishHistorySource;
  sourceRefId?: string;
  status: SocialPublishHistoryStatus;
  platform: SocialPlatform;
  contentSnapshot: SocialPublishHistoryContentSnapshot;
  accountReference: SocialPublishHistoryAccountReference;
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
  lifecycle: SocialPublishHistoryLifecycleEntry[];
  error?: SocialPublishHistoryError;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  retryAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPublishHistoryJobWithDetails extends SocialPublishHistoryJob {
  deliveries: SocialPublishHistoryDelivery[];
  events: SocialPublishHistoryEvent[];
}

export interface SocialPublishHistoryJobRow {
  id: string;
  user_id: string;
  tenant_id?: string | null;
  structure_id?: string | null;
  social_post_id?: string | null;
  publish_job_id?: string | null;
  source: SocialPublishHistorySource;
  source_ref_id?: string | null;
  status: SocialPublishHistoryStatus;
  platform: SocialPlatform;
  content_snapshot_json: unknown;
  account_reference_json: unknown;
  request_payload_json: unknown;
  response_payload_json: unknown;
  lifecycle_json: unknown;
  error_json?: unknown;
  scheduled_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  retry_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialPublishHistoryDeliveryRow {
  id: string;
  history_job_id: string;
  user_id: string;
  tenant_id?: string | null;
  platform: SocialPlatform;
  status: SocialPublishHistoryStatus;
  account_reference_json: unknown;
  request_payload_json: unknown;
  response_payload_json: unknown;
  error_json?: unknown;
  requested_at?: string | null;
  queued_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  retry_at?: string | null;
  canceled_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialPublishHistoryEventRow {
  id: string;
  history_job_id: string;
  delivery_id?: string | null;
  user_id: string;
  tenant_id?: string | null;
  event_type: SocialPublishHistoryEvent["eventType"];
  severity: SocialPublishHistoryEvent["severity"];
  message: string;
  payload_json: unknown;
  created_at: string;
}

export interface SocialPublishHistoryListFilter {
  status?: SocialPublishHistoryStatus;
  platform?: SocialPlatform;
  accountId?: string;
  from?: string;
  to?: string;
  page: number;
  perPage: number;
}

export interface SocialPublishHistoryListResult {
  items: SocialPublishHistoryJob[];
  page: number;
  perPage: number;
  total: number;
}
