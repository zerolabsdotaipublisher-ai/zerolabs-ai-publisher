import type { SocialPostVariant } from "@/lib/social/types";

export type SocialConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "token_expiring"
  | "reconnect_required"
  | "revoked";

export type InstagramPublishStatus =
  | "draft"
  | "pending"
  | "uploading"
  | "publishing"
  | "published"
  | "failed"
  | "retry_pending"
  | "canceled";

export interface InstagramPublishRetryPolicy {
  maxAttempts: number;
  baseDelaySeconds: number;
  backoffMultiplier: number;
}

export interface InstagramConnection {
  id: string;
  userId: string;
  platform: "instagram";
  connectionStatus: SocialConnectionStatus;
  instagramAccountId?: string;
  instagramUsername?: string;
  facebookPageId?: string;
  scopes: string[];
  tokenExpiresAt?: string;
  tokenLastRefreshedAt?: string;
  reauthorizationRequired: boolean;
  oauthState?: string;
  oauthStateExpiresAt?: string;
  lastError?: string;
  metadata: Record<string, unknown>;
  revokedAt?: string;
  disconnectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstagramConnectionRow {
  id: string;
  user_id: string;
  platform: "instagram";
  connection_status: SocialConnectionStatus;
  instagram_account_id?: string | null;
  instagram_username?: string | null;
  facebook_page_id?: string | null;
  scopes: string[] | null;
  encrypted_access_token?: string | null;
  token_expires_at?: string | null;
  token_last_refreshed_at?: string | null;
  reauthorization_required: boolean;
  oauth_state?: string | null;
  oauth_state_expires_at?: string | null;
  last_error?: string | null;
  metadata_json: unknown;
  revoked_at?: string | null;
  disconnected_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstagramPublishJob {
  id: string;
  userId: string;
  platform: "instagram";
  socialPostId?: string;
  status: InstagramPublishStatus;
  caption: string;
  mediaUrl: string;
  instagramAccountId: string;
  facebookPageId?: string;
  scheduledFor: string;
  publishedAt?: string;
  providerCreationId?: string;
  providerMediaId?: string;
  attemptCount: number;
  maxAttempts: number;
  nextAttemptAt?: string;
  retryable: boolean;
  lastErrorCode?: string;
  lastError?: string;
  metadata: Record<string, unknown>;
  canceledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstagramPublishJobRow {
  id: string;
  user_id: string;
  platform: "instagram";
  social_post_id?: string | null;
  status: InstagramPublishStatus;
  caption: string;
  media_url: string;
  instagram_account_id: string;
  facebook_page_id?: string | null;
  scheduled_for: string;
  published_at?: string | null;
  provider_creation_id?: string | null;
  provider_media_id?: string | null;
  attempt_count: number;
  max_attempts: number;
  next_attempt_at?: string | null;
  retryable: boolean;
  last_error_code?: string | null;
  last_error?: string | null;
  metadata_json: unknown;
  canceled_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstagramPublishAttempt {
  id: string;
  jobId: string;
  userId: string;
  status: "uploading" | "publishing" | "published" | "failed" | "retry_pending";
  attempt: number;
  startedAt: string;
  completedAt?: string;
  retryable: boolean;
  errorCode?: string;
  errorMessage?: string;
  providerResponse: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface InstagramPublishAttemptRow {
  id: string;
  job_id: string;
  user_id: string;
  status: InstagramPublishAttempt["status"];
  attempt: number;
  started_at: string;
  completed_at?: string | null;
  retryable: boolean;
  error_code?: string | null;
  error_message?: string | null;
  provider_response_json: unknown;
  created_at: string;
  updated_at: string;
}

export interface InstagramOAuthState {
  state: string;
  expiresAt: string;
}

export interface InstagramOAuthTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

export interface InstagramGraphPageAccount {
  id: string;
  name?: string;
  access_token?: string;
  instagram_business_account?: {
    id?: string;
    username?: string;
  };
}

export interface InstagramGraphPageAccountsResponse {
  data: InstagramGraphPageAccount[];
}

export interface InstagramGraphMediaContainerResponse {
  id: string;
}

export interface InstagramGraphPublishResponse {
  id: string;
}

export interface InstagramPublishValidationResult {
  isValid: boolean;
  errors: string[];
  mediaUrl?: string;
  caption?: string;
}

export interface InstagramCanonicalPublishPayload {
  variant: SocialPostVariant;
}

export interface PlatformPublishAdapter<
  TCanonicalPayload,
  TPlatformPayload,
  TResult,
> {
  platform: "instagram";
  validate(payload: TCanonicalPayload): InstagramPublishValidationResult;
  map(payload: TCanonicalPayload): TPlatformPayload;
  publish(payload: TPlatformPayload, token: string): Promise<TResult>;
  normalizeError(error: unknown): {
    message: string;
    code: string;
    retryable: boolean;
    statusCode?: number;
    metadata?: Record<string, unknown>;
  };
}
