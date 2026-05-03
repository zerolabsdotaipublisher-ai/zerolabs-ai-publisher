import "server-only";

import { logger } from "@/lib/observability";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { decryptSocialAccessToken, encryptSocialAccessToken } from "./tokens";
import type {
  SocialAccountConnection,
  SocialAccountConnectionRow,
  SocialAccountPlatform,
} from "./types";
import { normalizeConnectionStatus, SocialAccountError } from "./validation";

export function createSocialAccountConnectionId(userId: string, platform: SocialAccountPlatform): string {
  return `sconn_${platform}_${userId}`;
}

function toConnection(row: SocialAccountConnectionRow): SocialAccountConnection {
  const status = normalizeConnectionStatus(row.connection_status, row.reauthorization_required);
  // Backward compatibility for rows created before generalized account columns existed.
  const fallbackFromInstagram = <T>(primary: T | null | undefined, legacy: T | null | undefined): T | undefined =>
    primary ?? legacy ?? undefined;

  return {
    id: row.id,
    userId: row.user_id,
    platform: row.platform,
    status,
    platformAccountId: fallbackFromInstagram(row.platform_account_id, row.instagram_account_id),
    displayName: fallbackFromInstagram(row.account_display_name, row.instagram_username),
    username: fallbackFromInstagram(row.account_username, row.instagram_username),
    profileUrl: row.profile_url ?? undefined,
    profilePictureUrl: row.profile_picture_url ?? undefined,
    scopes: row.scopes ?? [],
    tokenExpiresAt: row.token_expires_at ?? undefined,
    tokenLastRefreshedAt: row.token_last_refreshed_at ?? undefined,
    tokenReference: row.token_reference ?? undefined,
    reauthorizationRequired: row.reauthorization_required,
    oauthState: row.oauth_state ?? undefined,
    oauthStateExpiresAt: row.oauth_state_expires_at ?? undefined,
    lastError: row.last_error ?? undefined,
    metadata: (row.metadata_json as Record<string, unknown>) ?? {},
    connectedAt: row.last_connected_at ?? undefined,
    disconnectedAt: row.disconnected_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    instagramAccountId: row.instagram_account_id ?? undefined,
    instagramUsername: row.instagram_username ?? undefined,
    facebookPageId: row.facebook_page_id ?? undefined,
  };
}

function toStorageStatus(status: SocialAccountConnection["status"]):
  | "disconnected"
  | "connecting"
  | "connected"
  | "expired"
  | "invalid"
  | "reauthorization_required" {
  return status;
}

function logSupabaseError(name: string, error: { message: string }, metadata?: Record<string, unknown>): never {
  logger.error("Social account storage operation failed", {
    category: "error",
    service: "supabase",
    error: { name, message: error.message },
    metadata,
  });
  throw error;
}

export async function listOwnedSocialAccountConnections(userId: string): Promise<SocialAccountConnection[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("social_account_connections")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    logSupabaseError("SocialAccountListError", error, { userId });
  }

  return ((data ?? []) as SocialAccountConnectionRow[]).map(toConnection);
}

export async function getOwnedSocialAccountConnection(
  accountId: string,
  userId: string,
): Promise<SocialAccountConnection | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("social_account_connections")
    .select("*")
    .eq("id", accountId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    logSupabaseError("SocialAccountGetError", error, { accountId, userId });
  }

  return data ? toConnection(data as SocialAccountConnectionRow) : null;
}

export async function getOwnedSocialAccountConnectionByPlatform(
  userId: string,
  platform: SocialAccountPlatform,
): Promise<SocialAccountConnection | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("social_account_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", platform)
    .maybeSingle();

  if (error) {
    logSupabaseError("SocialAccountGetByPlatformError", error, { userId, platform });
  }

  return data ? toConnection(data as SocialAccountConnectionRow) : null;
}

export async function setSocialAccountConnecting(input: {
  userId: string;
  platform: SocialAccountPlatform;
  state: string;
  expiresAt: string;
  scopes: string[];
  returnTo?: string;
}): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const now = new Date().toISOString();
  const metadata: Record<string, unknown> = {
    oauthRequestedAt: now,
  };
  if (input.returnTo) metadata.oauthReturnTo = input.returnTo;

  const { error } = await supabase.from("social_account_connections").upsert(
    {
      id: createSocialAccountConnectionId(input.userId, input.platform),
      user_id: input.userId,
      platform: input.platform,
      connection_status: "connecting",
      scopes: input.scopes,
      oauth_state: input.state,
      oauth_state_expires_at: input.expiresAt,
      reauthorization_required: false,
      last_error: null,
      disconnected_at: null,
      revoked_at: null,
      metadata_json: metadata,
      updated_at: now,
    },
    { onConflict: "id" },
  );

  if (error) {
    logSupabaseError("SocialAccountSetConnectingError", error, {
      userId: input.userId,
      platform: input.platform,
    });
  }
}

export async function completeSocialAccountConnection(input: {
  userId: string;
  platform: SocialAccountPlatform;
  state: string;
  scopes: string[];
  accessToken: string;
  tokenExpiresAt?: string;
  platformAccountId: string;
  displayName?: string;
  username?: string;
  profileUrl?: string;
  profilePictureUrl?: string;
  facebookPageId?: string;
}): Promise<SocialAccountConnection> {
  const existing = await getOwnedSocialAccountConnectionByPlatform(input.userId, input.platform);
  if (!existing || existing.oauthState !== input.state) {
    throw new SocialAccountError("Invalid social account OAuth state.", {
      code: "social_account_oauth_state_invalid",
      statusCode: 400,
    });
  }

  if (existing.oauthStateExpiresAt && new Date(existing.oauthStateExpiresAt).getTime() < Date.now()) {
    throw new SocialAccountError("Social account OAuth state has expired.", {
      code: "social_account_oauth_state_expired",
      statusCode: 400,
    });
  }

  const now = new Date().toISOString();
  const supabase = getSupabaseServiceClient();

  const nextMetadata = {
    ...existing.metadata,
    connectedAt: now,
    oauthReturnTo: undefined,
  };

  const { data, error } = await supabase
    .from("social_account_connections")
    .update({
      connection_status: toStorageStatus("connected"),
      platform_account_id: input.platformAccountId,
      account_display_name: input.displayName ?? null,
      account_username: input.username ?? null,
      profile_url: input.profileUrl ?? null,
      profile_picture_url: input.profilePictureUrl ?? null,
      scopes: input.scopes,
      encrypted_access_token: encryptSocialAccessToken(input.accessToken),
      token_reference: null,
      token_expires_at: input.tokenExpiresAt ?? null,
      token_last_refreshed_at: now,
      reauthorization_required: false,
      oauth_state: null,
      oauth_state_expires_at: null,
      last_error: null,
      metadata_json: nextMetadata,
      disconnected_at: null,
      revoked_at: null,
      last_connected_at: now,
      instagram_account_id: input.platform === "instagram" ? input.platformAccountId : null,
      instagram_username: input.platform === "instagram" ? input.username ?? null : null,
      facebook_page_id: input.platform === "instagram" ? input.facebookPageId ?? null : null,
      updated_at: now,
    })
    .eq("id", createSocialAccountConnectionId(input.userId, input.platform))
    .eq("user_id", input.userId)
    .select("*")
    .single();

  if (error) {
    logSupabaseError("SocialAccountCompleteError", error, {
      userId: input.userId,
      platform: input.platform,
    });
  }

  return toConnection(data as SocialAccountConnectionRow);
}

export async function markSocialAccountStatus(input: {
  accountId: string;
  userId: string;
  status: SocialAccountConnection["status"];
  reauthorizationRequired?: boolean;
  errorMessage?: string;
}): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("social_account_connections")
    .update({
      connection_status: toStorageStatus(input.status),
      reauthorization_required: input.reauthorizationRequired ?? input.status === "reauthorization_required",
      last_error: input.errorMessage ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.accountId)
    .eq("user_id", input.userId);

  if (error) {
    logSupabaseError("SocialAccountStatusUpdateError", error, {
      accountId: input.accountId,
      userId: input.userId,
      status: input.status,
    });
  }
}

export async function disconnectOwnedSocialAccountConnection(accountId: string, userId: string): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("social_account_connections")
    .update({
      connection_status: "disconnected",
      encrypted_access_token: null,
      token_reference: null,
      token_expires_at: null,
      token_last_refreshed_at: null,
      reauthorization_required: false,
      oauth_state: null,
      oauth_state_expires_at: null,
      last_error: null,
      disconnected_at: now,
      updated_at: now,
    })
    .eq("id", accountId)
    .eq("user_id", userId);

  if (error) {
    logSupabaseError("SocialAccountDisconnectError", error, { accountId, userId });
  }
}

export async function refreshOwnedSocialAccountToken(input: {
  accountId: string;
  userId: string;
  accessToken: string;
  tokenExpiresAt?: string;
}): Promise<SocialAccountConnection> {
  const supabase = getSupabaseServiceClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("social_account_connections")
    .update({
      encrypted_access_token: encryptSocialAccessToken(input.accessToken),
      token_expires_at: input.tokenExpiresAt ?? null,
      token_last_refreshed_at: now,
      connection_status: "connected",
      reauthorization_required: false,
      last_error: null,
      updated_at: now,
    })
    .eq("id", input.accountId)
    .eq("user_id", input.userId)
    .select("*")
    .single();

  if (error) {
    logSupabaseError("SocialAccountRefreshTokenError", error, {
      accountId: input.accountId,
      userId: input.userId,
    });
  }

  return toConnection(data as SocialAccountConnectionRow);
}

export async function requireOwnedSocialAccessToken(input: {
  accountId: string;
  userId: string;
}): Promise<{ token: string; connection: SocialAccountConnection }> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("social_account_connections")
    .select("*")
    .eq("id", input.accountId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (error) {
    logSupabaseError("SocialAccountTokenLoadError", error, {
      accountId: input.accountId,
      userId: input.userId,
    });
  }

  if (!data) {
    throw new SocialAccountError("Social account connection was not found.", {
      code: "social_account_not_found",
      statusCode: 404,
    });
  }

  const row = data as SocialAccountConnectionRow;
  const connection = toConnection(row);
  if (connection.status !== "connected" || connection.reauthorizationRequired) {
    throw new SocialAccountError("Social account requires reauthorization.", {
      code: "social_account_reauthorization_required",
      statusCode: 409,
    });
  }

  if (!row.encrypted_access_token) {
    throw new SocialAccountError("Social account access token is not available.", {
      code: "social_account_access_token_missing",
      statusCode: 409,
    });
  }

  return {
    token: decryptSocialAccessToken(row.encrypted_access_token),
    connection,
  };
}
