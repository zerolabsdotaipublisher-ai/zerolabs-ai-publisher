import { randomBytes } from "node:crypto";
import { assertInstagramMetaConfig, DEFAULT_INSTAGRAM_SCOPES, getInstagramGraphApiBaseUrl } from "./config";
import { InstagramIntegrationError } from "./errors";
import type {
  InstagramGraphPageAccountsResponse,
  InstagramOAuthState,
  InstagramOAuthTokenResponse,
} from "./types";

const OAUTH_STATE_EXPIRY_MS = 10 * 60 * 1000;

export function createInstagramOAuthState(now = new Date()): InstagramOAuthState {
  const state = randomBytes(24).toString("base64url");
  return {
    state,
    expiresAt: new Date(now.getTime() + OAUTH_STATE_EXPIRY_MS).toISOString(),
  };
}

export function buildInstagramOAuthAuthorizeUrl(state: string, scopes = [...DEFAULT_INSTAGRAM_SCOPES]): string {
  const { appId, redirectUri } = assertInstagramMetaConfig();
  const url = new URL("https://www.facebook.com/dialog/oauth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", scopes.join(","));
  url.searchParams.set("response_type", "code");
  return url.toString();
}

export async function exchangeCodeForMetaAccessToken(code: string): Promise<InstagramOAuthTokenResponse> {
  const { appId, appSecret, redirectUri } = assertInstagramMetaConfig();
  const url = new URL(`${getInstagramGraphApiBaseUrl()}/oauth/access_token`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);

  const response = await fetch(url, { method: "GET" });
  const data = (await response.json()) as InstagramOAuthTokenResponse & {
    error?: { message?: string; code?: number; type?: string };
  };

  if (!response.ok || !data.access_token) {
    throw new InstagramIntegrationError(data.error?.message ?? "Unable to exchange OAuth code for token.", {
      code: "instagram_oauth_exchange_failed",
      retryable: false,
      statusCode: response.status,
      metadata: {
        providerCode: data.error?.code,
        providerType: data.error?.type,
      },
    });
  }

  return data;
}

export async function getInstagramBusinessAccountFromPages(accessToken: string): Promise<{
  facebookPageId: string;
  instagramAccountId: string;
  instagramUsername?: string;
}> {
  const url = new URL(`${getInstagramGraphApiBaseUrl()}/me/accounts`);
  url.searchParams.set("fields", "id,name,access_token,instagram_business_account{id,username}");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url, { method: "GET" });
  const data = (await response.json()) as InstagramGraphPageAccountsResponse & {
    error?: { message?: string; code?: number; type?: string };
  };

  if (!response.ok) {
    throw new InstagramIntegrationError(data.error?.message ?? "Unable to read Facebook pages for Instagram account.", {
      code: "instagram_page_discovery_failed",
      retryable: false,
      statusCode: response.status,
      metadata: {
        providerCode: data.error?.code,
        providerType: data.error?.type,
      },
    });
  }

  const linked = data.data.find((page) => page.instagram_business_account?.id);
  if (!linked?.instagram_business_account?.id) {
    throw new InstagramIntegrationError(
      "No Instagram Business or Creator account linked to a Facebook Page was found.",
      { code: "instagram_account_not_found", retryable: false },
    );
  }

  return {
    facebookPageId: linked.id,
    instagramAccountId: linked.instagram_business_account.id,
    instagramUsername: linked.instagram_business_account.username,
  };
}
