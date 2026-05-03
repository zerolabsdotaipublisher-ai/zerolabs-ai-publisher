import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { config } from "@/config";
import { logger } from "@/lib/observability";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { InstagramIntegrationError } from "./errors";
import type {
  InstagramConnection,
  InstagramConnectionRow,
  InstagramPublishAttempt,
  InstagramPublishAttemptRow,
  InstagramPublishJob,
  InstagramPublishJobRow,
  InstagramPublishStatus,
} from "./types";

function toConnection(row: InstagramConnectionRow): InstagramConnection {
  return {
    id: row.id,
    userId: row.user_id,
    platform: "instagram",
    connectionStatus: row.connection_status,
    instagramAccountId: row.instagram_account_id ?? undefined,
    instagramUsername: row.instagram_username ?? undefined,
    facebookPageId: row.facebook_page_id ?? undefined,
    scopes: row.scopes ?? [],
    tokenExpiresAt: row.token_expires_at ?? undefined,
    tokenLastRefreshedAt: row.token_last_refreshed_at ?? undefined,
    reauthorizationRequired: row.reauthorization_required,
    oauthState: row.oauth_state ?? undefined,
    oauthStateExpiresAt: row.oauth_state_expires_at ?? undefined,
    lastError: row.last_error ?? undefined,
    metadata: (row.metadata_json as Record<string, unknown>) ?? {},
    revokedAt: row.revoked_at ?? undefined,
    disconnectedAt: row.disconnected_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toJob(row: InstagramPublishJobRow): InstagramPublishJob {
  return {
    id: row.id,
    userId: row.user_id,
    platform: "instagram",
    socialPostId: row.social_post_id ?? undefined,
    status: row.status,
    caption: row.caption,
    mediaUrl: row.media_url,
    instagramAccountId: row.instagram_account_id,
    facebookPageId: row.facebook_page_id ?? undefined,
    scheduledFor: row.scheduled_for,
    publishedAt: row.published_at ?? undefined,
    providerCreationId: row.provider_creation_id ?? undefined,
    providerMediaId: row.provider_media_id ?? undefined,
    attemptCount: row.attempt_count,
    maxAttempts: row.max_attempts,
    nextAttemptAt: row.next_attempt_at ?? undefined,
    retryable: row.retryable,
    lastErrorCode: row.last_error_code ?? undefined,
    lastError: row.last_error ?? undefined,
    metadata: (row.metadata_json as Record<string, unknown>) ?? {},
    canceledAt: row.canceled_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toAttempt(row: InstagramPublishAttemptRow): InstagramPublishAttempt {
  return {
    id: row.id,
    jobId: row.job_id,
    userId: row.user_id,
    status: row.status,
    attempt: row.attempt,
    startedAt: row.started_at,
    completedAt: row.completed_at ?? undefined,
    retryable: row.retryable,
    errorCode: row.error_code ?? undefined,
    errorMessage: row.error_message ?? undefined,
    providerResponse: (row.provider_response_json as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function encryptionKey(): Buffer {
  if (!config.services.auth.jwtSecret) {
    throw new InstagramIntegrationError(
      "JWT_SECRET is required to encrypt Instagram access tokens in storage.",
      { code: "instagram_token_encryption_not_configured", retryable: false },
    );
  }
  return createHash("sha256").update(config.services.auth.jwtSecret).digest();
}

function encryptToken(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

function decryptToken(ciphertext: string): string {
  const parts = ciphertext.split(":");
  if (parts.length !== 4) {
    throw new InstagramIntegrationError("Invalid encrypted Instagram token format.", {
      code: "instagram_token_decrypt_invalid_format",
      retryable: false,
    });
  }

  const [version, ivB64, tagB64, dataB64] = parts;
  if (version !== "v1" || !ivB64 || !tagB64 || !dataB64) {
    throw new InstagramIntegrationError("Invalid encrypted Instagram token format.", {
      code: "instagram_token_decrypt_invalid_format",
      retryable: false,
    });
  }

  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
  return decrypted.toString("utf8");
}

export function createInstagramConnectionId(userId: string): string {
  return `sconn_instagram_${userId}`;
}

export function createInstagramPublishJobId(userId: string): string {
  const ts = Date.now().toString(36);
  const rnd = randomBytes(4).toString("hex");
  return `spjob_instagram_${userId.slice(0, 8)}_${ts}_${rnd}`;
}

export function createInstagramPublishAttemptId(jobId: string): string {
  const ts = Date.now().toString(36);
  const rnd = randomBytes(4).toString("hex");
  return `spatt_${jobId}_${ts}_${rnd}`;
}

export async function getInstagramConnection(userId: string): Promise<InstagramConnection | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("social_account_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", "instagram")
    .maybeSingle();

  if (error) {
    logger.error("Failed to load instagram connection", {
      category: "error",
      service: "supabase",
      userId,
      error: { name: "InstagramConnectionLoadError", message: error.message },
    });
    throw error;
  }

  return data ? toConnection(data as InstagramConnectionRow) : null;
}

export async function setInstagramConnectionConnecting(input: {
  userId: string;
  state: string;
  expiresAt: string;
  scopes: string[];
}): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("social_account_connections").upsert(
    {
      id: createInstagramConnectionId(input.userId),
      user_id: input.userId,
      platform: "instagram",
      connection_status: "connecting",
      scopes: input.scopes,
      oauth_state: input.state,
      oauth_state_expires_at: input.expiresAt,
      reauthorization_required: false,
      disconnected_at: null,
      revoked_at: null,
      last_error: null,
      updated_at: now,
    },
    { onConflict: "id" },
  );

  if (error) {
    logger.error("Failed to set instagram connection as connecting", {
      category: "error",
      service: "supabase",
      userId: input.userId,
      error: { name: "InstagramConnectionConnectingError", message: error.message },
    });
    throw error;
  }
}

export async function completeInstagramConnection(input: {
  userId: string;
  state: string;
  scopes: string[];
  accessToken: string;
  tokenExpiresAt?: string;
  instagramAccountId: string;
  instagramUsername?: string;
  facebookPageId: string;
}): Promise<InstagramConnection> {
  const existing = await getInstagramConnection(input.userId);
  if (!existing || existing.oauthState !== input.state) {
    throw new InstagramIntegrationError("Invalid Instagram OAuth state.", {
      code: "instagram_oauth_state_invalid",
      retryable: false,
    });
  }

  if (existing.oauthStateExpiresAt && new Date(existing.oauthStateExpiresAt).getTime() < Date.now()) {
    throw new InstagramIntegrationError("Instagram OAuth state has expired.", {
      code: "instagram_oauth_state_expired",
      retryable: false,
    });
  }

  const supabase = getSupabaseServiceClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("social_account_connections")
    .update({
      connection_status: "connected",
      instagram_account_id: input.instagramAccountId,
      instagram_username: input.instagramUsername ?? null,
      facebook_page_id: input.facebookPageId,
      scopes: input.scopes,
      encrypted_access_token: encryptToken(input.accessToken),
      token_expires_at: input.tokenExpiresAt ?? null,
      token_last_refreshed_at: now,
      reauthorization_required: false,
      oauth_state: null,
      oauth_state_expires_at: null,
      last_error: null,
      metadata_json: {
        connectedAt: now,
      },
      disconnected_at: null,
      revoked_at: null,
    })
    .eq("id", createInstagramConnectionId(input.userId))
    .eq("user_id", input.userId)
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to complete instagram connection", {
      category: "error",
      service: "supabase",
      userId: input.userId,
      error: { name: "InstagramConnectionCompleteError", message: error.message },
    });
    throw error;
  }

  return toConnection(data as InstagramConnectionRow);
}

export async function markInstagramConnectionError(userId: string, message: string): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("social_account_connections")
    .update({
      connection_status: "reauthorization_required",
      reauthorization_required: true,
      last_error: message,
    })
    .eq("id", createInstagramConnectionId(userId))
    .eq("user_id", userId);

  if (error) {
    logger.error("Failed to mark instagram connection error", {
      category: "error",
      service: "supabase",
      userId,
      error: { name: "InstagramConnectionErrorUpdate", message: error.message },
    });
    throw error;
  }
}

export async function disconnectInstagramConnection(userId: string): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("social_account_connections")
    .update({
      connection_status: "disconnected",
      encrypted_access_token: null,
      token_expires_at: null,
      token_last_refreshed_at: null,
      reauthorization_required: false,
      oauth_state: null,
      oauth_state_expires_at: null,
      disconnected_at: now,
      updated_at: now,
    })
    .eq("id", createInstagramConnectionId(userId))
    .eq("user_id", userId);

  if (error) {
    logger.error("Failed to disconnect instagram connection", {
      category: "error",
      service: "supabase",
      userId,
      error: { name: "InstagramConnectionDisconnectError", message: error.message },
    });
    throw error;
  }
}

export async function requireInstagramAccessToken(userId: string): Promise<{
  token: string;
  connection: InstagramConnection;
}> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("social_account_connections")
    .select("*")
    .eq("id", createInstagramConnectionId(userId))
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch instagram token payload", {
      category: "error",
      service: "supabase",
      userId,
      error: { name: "InstagramTokenLoadError", message: error.message },
    });
    throw error;
  }

  if (!data) {
    throw new InstagramIntegrationError("Instagram account is not connected.", {
      code: "instagram_connection_missing",
      retryable: false,
    });
  }

  const row = data as InstagramConnectionRow;
  const connection = toConnection(row);
  if (connection.connectionStatus !== "connected" || connection.reauthorizationRequired) {
    throw new InstagramIntegrationError("Instagram connection requires reauthorization.", {
      code: "instagram_connection_reauthorization_required",
      retryable: false,
    });
  }

  if (!row.encrypted_access_token) {
    throw new InstagramIntegrationError("Instagram access token is not available.", {
      code: "instagram_access_token_missing",
      retryable: false,
    });
  }

  return {
    token: decryptToken(row.encrypted_access_token),
    connection,
  };
}

export async function createInstagramPublishJob(input: {
  userId: string;
  socialPostId?: string;
  caption: string;
  mediaUrl: string;
  instagramAccountId: string;
  facebookPageId?: string;
  scheduledFor: string;
  maxAttempts?: number;
  metadata?: Record<string, unknown>;
}): Promise<InstagramPublishJob> {
  const supabase = getSupabaseServiceClient();
  const id = createInstagramPublishJobId(input.userId);
  const row: Partial<InstagramPublishJobRow> = {
    id,
    user_id: input.userId,
    platform: "instagram",
    social_post_id: input.socialPostId ?? null,
    status: "pending",
    caption: input.caption,
    media_url: input.mediaUrl,
    instagram_account_id: input.instagramAccountId,
    facebook_page_id: input.facebookPageId ?? null,
    scheduled_for: input.scheduledFor,
    max_attempts: Math.max(1, input.maxAttempts ?? 3),
    metadata_json: input.metadata ?? {},
  };

  const { data, error } = await supabase.from("social_publish_jobs").insert(row).select("*").single();
  if (error) {
    logger.error("Failed to create instagram publish job", {
      category: "error",
      service: "supabase",
      userId: input.userId,
      error: { name: "InstagramPublishJobCreateError", message: error.message },
    });
    throw error;
  }

  return toJob(data as InstagramPublishJobRow);
}

export async function updateInstagramPublishJob(
  jobId: string,
  userId: string,
  updates: Partial<
    Pick<
      InstagramPublishJobRow,
      | "status"
      | "attempt_count"
      | "next_attempt_at"
      | "retryable"
      | "last_error_code"
      | "last_error"
      | "provider_creation_id"
      | "provider_media_id"
      | "published_at"
      | "metadata_json"
      | "canceled_at"
    >
  >,
): Promise<InstagramPublishJob> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("social_publish_jobs")
    .update(updates)
    .eq("id", jobId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to update instagram publish job", {
      category: "error",
      service: "supabase",
      jobId,
      userId,
      error: { name: "InstagramPublishJobUpdateError", message: error.message },
    });
    throw error;
  }

  return toJob(data as InstagramPublishJobRow);
}

export async function getInstagramPublishJob(jobId: string, userId: string): Promise<InstagramPublishJob | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("social_publish_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    logger.error("Failed to get instagram publish job", {
      category: "error",
      service: "supabase",
      jobId,
      userId,
      error: { name: "InstagramPublishJobGetError", message: error.message },
    });
    throw error;
  }

  return data ? toJob(data as InstagramPublishJobRow) : null;
}

export async function listInstagramPublishJobs(userId: string, limit = 20): Promise<InstagramPublishJob[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("social_publish_jobs")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", "instagram")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.error("Failed to list instagram publish jobs", {
      category: "error",
      service: "supabase",
      userId,
      error: { name: "InstagramPublishJobListError", message: error.message },
    });
    throw error;
  }

  return ((data ?? []) as InstagramPublishJobRow[]).map(toJob);
}

export async function claimDueInstagramPublishJobs(limit: number, nowIso: string): Promise<InstagramPublishJob[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.rpc("claim_due_social_publish_jobs", {
    p_now: nowIso,
    p_limit: limit,
  });

  if (error) {
    logger.error("Failed to claim due instagram publish jobs", {
      category: "error",
      service: "supabase",
      error: { name: "InstagramPublishJobClaimError", message: error.message },
    });
    throw error;
  }

  return ((data ?? []) as InstagramPublishJobRow[]).map(toJob);
}

export async function saveInstagramPublishAttempt(
  input: Omit<InstagramPublishAttempt, "id" | "createdAt" | "updatedAt"> & { id?: string },
): Promise<InstagramPublishAttempt> {
  const id = input.id ?? createInstagramPublishAttemptId(input.jobId);
  const row: InstagramPublishAttemptRow = {
    id,
    job_id: input.jobId,
    user_id: input.userId,
    status: input.status,
    attempt: input.attempt,
    started_at: input.startedAt,
    completed_at: input.completedAt ?? null,
    retryable: input.retryable,
    error_code: input.errorCode ?? null,
    error_message: input.errorMessage ?? null,
    provider_response_json: input.providerResponse,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("social_publish_attempts")
    .upsert(row, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    logger.error("Failed to save instagram publish attempt", {
      category: "error",
      service: "supabase",
      jobId: input.jobId,
      userId: input.userId,
      error: { name: "InstagramPublishAttemptSaveError", message: error.message },
    });
    throw error;
  }

  return toAttempt(data as InstagramPublishAttemptRow);
}

export async function cancelInstagramPublishJob(jobId: string, userId: string): Promise<InstagramPublishJob | null> {
  const existing = await getInstagramPublishJob(jobId, userId);
  if (!existing) return null;

  const cancellableStatuses: InstagramPublishStatus[] = ["draft", "pending", "retry_pending"];
  if (!cancellableStatuses.includes(existing.status)) {
    return existing;
  }

  return updateInstagramPublishJob(jobId, userId, {
    status: "canceled",
    canceled_at: new Date().toISOString(),
  });
}
