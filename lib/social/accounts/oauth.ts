import { randomBytes } from "node:crypto";
import {
  assertInstagramMetaConfig,
  buildInstagramOAuthAuthorizeUrl,
  exchangeCodeForMetaAccessToken,
  getInstagramBusinessAccountFromPages,
  getInstagramGraphApiBaseUrl,
} from "@/lib/social/instagram";
import { getSocialAccountProvider } from "./providers";
import type {
  SocialAccountPlatform,
  SocialOAuthState,
  SocialProviderAccountProfile,
  SocialProviderTokenResponse,
} from "./types";
import { SocialAccountError } from "./validation";

const OAUTH_STATE_EXPIRY_MS = 10 * 60 * 1000;

export function createSocialOAuthState(now = new Date()): SocialOAuthState {
  const state = randomBytes(24).toString("base64url");
  return {
    state,
    expiresAt: new Date(now.getTime() + OAUTH_STATE_EXPIRY_MS).toISOString(),
  };
}

export function buildSocialOAuthAuthorizeUrl(
  platform: SocialAccountPlatform,
  state: string,
  scopes: string[],
): string {
  const provider = getSocialAccountProvider(platform);
  if (!provider.supportsOAuth) {
    throw new SocialAccountError("OAuth is not yet supported for this provider in MVP.", {
      code: "social_account_provider_not_supported",
      statusCode: 422,
    });
  }

  if (platform === "instagram") {
    return buildInstagramOAuthAuthorizeUrl(state, scopes);
  }

  throw new SocialAccountError("OAuth provider is not implemented.", {
    code: "social_account_provider_not_implemented",
    statusCode: 422,
  });
}

export async function exchangeSocialOAuthCode(
  platform: SocialAccountPlatform,
  code: string,
): Promise<SocialProviderTokenResponse> {
  if (platform !== "instagram") {
    throw new SocialAccountError("OAuth token exchange is not implemented for this provider.", {
      code: "social_account_token_exchange_unsupported",
      statusCode: 422,
    });
  }

  const token = await exchangeCodeForMetaAccessToken(code);
  return {
    accessToken: token.access_token,
    tokenType: token.token_type,
    expiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : undefined,
  };
}

export async function retrieveSocialProviderAccount(
  platform: SocialAccountPlatform,
  accessToken: string,
): Promise<SocialProviderAccountProfile> {
  if (platform !== "instagram") {
    throw new SocialAccountError("Account retrieval is not implemented for this provider.", {
      code: "social_account_retrieval_unsupported",
      statusCode: 422,
    });
  }

  const account = await getInstagramBusinessAccountFromPages(accessToken);
  return {
    platformAccountId: account.instagramAccountId,
    username: account.instagramUsername,
    displayName: account.instagramUsername,
    profileUrl: account.instagramUsername ? `https://instagram.com/${account.instagramUsername}` : undefined,
    facebookPageId: account.facebookPageId,
  };
}

export async function refreshSocialAccessToken(
  platform: SocialAccountPlatform,
  accessToken: string,
): Promise<SocialProviderTokenResponse> {
  if (platform !== "instagram") {
    throw new SocialAccountError("Token refresh is not implemented for this provider.", {
      code: "social_account_token_refresh_unsupported",
      statusCode: 422,
    });
  }

  const { appId, appSecret } = assertInstagramMetaConfig();
  const url = new URL(`${getInstagramGraphApiBaseUrl()}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("fb_exchange_token", accessToken);

  const response = await fetch(url.toString(), { method: "GET" });
  const data = (await response.json()) as {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
    error?: { message?: string; code?: number; type?: string };
  };

  if (!response.ok || !data.access_token) {
    throw new SocialAccountError(data.error?.message ?? "Unable to refresh social account access token.", {
      code: "social_account_token_refresh_failed",
      statusCode: response.status || 500,
      metadata: {
        platform,
        providerCode: data.error?.code,
        providerType: data.error?.type,
      },
    });
  }

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : undefined,
  };
}
