export type SocialAccountPlatform = "instagram" | "facebook" | "linkedin" | "x";

export type SocialAccountConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "expired"
  | "invalid"
  | "reauthorization_required";

export interface SocialAccountConnection {
  id: string;
  userId: string;
  platform: SocialAccountPlatform;
  status: SocialAccountConnectionStatus;
  platformAccountId?: string;
  displayName?: string;
  username?: string;
  profileUrl?: string;
  profilePictureUrl?: string;
  scopes: string[];
  tokenExpiresAt?: string;
  tokenLastRefreshedAt?: string;
  tokenReference?: string;
  reauthorizationRequired: boolean;
  oauthState?: string;
  oauthStateExpiresAt?: string;
  lastError?: string;
  metadata: Record<string, unknown>;
  connectedAt?: string;
  disconnectedAt?: string;
  createdAt: string;
  updatedAt: string;
  instagramAccountId?: string;
  instagramUsername?: string;
  facebookPageId?: string;
}

export interface SocialAccountConnectionRow {
  id: string;
  user_id: string;
  platform: SocialAccountPlatform;
  connection_status:
    | "disconnected"
    | "connecting"
    | "connected"
    | "token_expiring"
    | "reconnect_required"
    | "revoked"
    | "expired"
    | "invalid"
    | "reauthorization_required";
  platform_account_id?: string | null;
  account_display_name?: string | null;
  account_username?: string | null;
  profile_url?: string | null;
  profile_picture_url?: string | null;
  instagram_account_id?: string | null;
  instagram_username?: string | null;
  facebook_page_id?: string | null;
  scopes: string[] | null;
  encrypted_access_token?: string | null;
  token_reference?: string | null;
  token_expires_at?: string | null;
  token_last_refreshed_at?: string | null;
  reauthorization_required: boolean;
  oauth_state?: string | null;
  oauth_state_expires_at?: string | null;
  last_error?: string | null;
  metadata_json: unknown;
  last_connected_at?: string | null;
  revoked_at?: string | null;
  disconnected_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialOAuthState {
  state: string;
  expiresAt: string;
}

export interface SocialProviderTokenResponse {
  accessToken: string;
  expiresAt?: string;
  tokenType?: string;
}

export interface SocialProviderAccountProfile {
  platformAccountId: string;
  displayName?: string;
  username?: string;
  profileUrl?: string;
  profilePictureUrl?: string;
  facebookPageId?: string;
}

export interface SocialAccountProvider {
  platform: SocialAccountPlatform;
  mvpSupported: boolean;
  supportsOAuth: boolean;
  defaultScopes: readonly string[];
}
