import "server-only";

import { logger, metrics } from "@/lib/observability";
import {
  buildSocialOAuthAuthorizeUrl,
  createSocialOAuthState,
  exchangeSocialOAuthCode,
  refreshSocialAccessToken,
  retrieveSocialProviderAccount,
} from "./oauth";
import { getSocialAccountProvider } from "./providers";
import {
  completeSocialAccountConnection,
  disconnectOwnedSocialAccountConnection,
  getOwnedSocialAccountConnection,
  getOwnedSocialAccountConnectionByPlatform,
  listOwnedSocialAccountConnections,
  markSocialAccountStatus,
  refreshOwnedSocialAccountToken,
  requireOwnedSocialAccessToken,
  setSocialAccountConnecting,
} from "./storage";
import type { SocialAccountConnection, SocialAccountPlatform } from "./types";
import { SocialAccountError } from "./validation";

const TOKEN_EXPIRY_BUFFER_MS = 60_000;

function mapProviderError(error: unknown): SocialAccountError {
  if (error instanceof SocialAccountError) {
    return error;
  }

  if (error instanceof Error) {
    return new SocialAccountError(error.message, {
      code: "social_account_unknown_error",
      statusCode: 500,
      retryable: true,
    });
  }

  return new SocialAccountError("Unknown social account error.", {
    code: "social_account_unknown_error",
    statusCode: 500,
    retryable: true,
  });
}

export async function beginSocialAccountConnection(input: {
  userId: string;
  platform: SocialAccountPlatform;
  returnTo?: string;
}): Promise<{ authorizeUrl: string; platform: SocialAccountPlatform }> {
  const startedAt = Date.now();
  metrics.increment("requestCount");

  try {
    const provider = getSocialAccountProvider(input.platform);
    if (!provider.supportsOAuth || !provider.mvpSupported) {
      throw new SocialAccountError("This social provider is not enabled in the current MVP.", {
        code: "social_account_provider_not_enabled",
        statusCode: 422,
      });
    }

    const oauthState = createSocialOAuthState();
    const scopes = [...provider.defaultScopes];

    await setSocialAccountConnecting({
      userId: input.userId,
      platform: input.platform,
      state: oauthState.state,
      expiresAt: oauthState.expiresAt,
      scopes,
      returnTo: input.returnTo,
    });

    const authorizeUrl = buildSocialOAuthAuthorizeUrl(input.platform, oauthState.state, scopes);

    logger.info("Social account connection started", {
      category: "request",
      service: "social_accounts",
      userId: input.userId,
      metadata: {
        platform: input.platform,
      },
    });

    return { authorizeUrl, platform: input.platform };
  } finally {
    metrics.recordDuration("socialAccountConnectStartMs", Date.now() - startedAt);
  }
}

export async function finalizeSocialAccountCallback(input: {
  userId: string;
  platform: SocialAccountPlatform;
  code: string;
  state: string;
}): Promise<SocialAccountConnection> {
  const startedAt = Date.now();
  metrics.increment("requestCount");

  try {
    const provider = getSocialAccountProvider(input.platform);
    if (!provider.supportsOAuth || !provider.mvpSupported) {
      throw new SocialAccountError("This social provider is not enabled in the current MVP.", {
        code: "social_account_provider_not_enabled",
        statusCode: 422,
      });
    }

    const token = await exchangeSocialOAuthCode(input.platform, input.code);
    const profile = await retrieveSocialProviderAccount(input.platform, token.accessToken);

    const connection = await completeSocialAccountConnection({
      userId: input.userId,
      platform: input.platform,
      state: input.state,
      scopes: [...provider.defaultScopes],
      accessToken: token.accessToken,
      tokenExpiresAt: token.expiresAt,
      platformAccountId: profile.platformAccountId,
      displayName: profile.displayName,
      username: profile.username,
      profileUrl: profile.profileUrl,
      profilePictureUrl: profile.profilePictureUrl,
      facebookPageId: profile.facebookPageId,
    });

    logger.info("Social account callback completed", {
      category: "request",
      service: "social_accounts",
      userId: input.userId,
      metadata: {
        accountId: connection.id,
        platform: input.platform,
        platformAccountId: connection.platformAccountId,
      },
    });

    return connection;
  } catch (error) {
    const normalized = mapProviderError(error);
    logger.error("Social account callback failed", {
      category: "error",
      service: "social_accounts",
      userId: input.userId,
      error: {
        name: "SocialAccountCallbackError",
        message: normalized.message,
      },
      metadata: {
        code: normalized.code,
        platform: input.platform,
      },
    });
    throw normalized;
  } finally {
    metrics.recordDuration("socialAccountCallbackMs", Date.now() - startedAt);
  }
}

export async function listSocialAccountConnections(userId: string): Promise<SocialAccountConnection[]> {
  return listOwnedSocialAccountConnections(userId);
}

export async function getSocialAccountConnection(
  accountId: string,
  userId: string,
): Promise<SocialAccountConnection | null> {
  return getOwnedSocialAccountConnection(accountId, userId);
}

export async function refreshSocialAccountConnection(
  accountId: string,
  userId: string,
): Promise<SocialAccountConnection> {
  const startedAt = Date.now();
  metrics.increment("requestCount");

  try {
    const account = await getOwnedSocialAccountConnection(accountId, userId);
    if (!account) {
      throw new SocialAccountError("Social account connection was not found.", {
        code: "social_account_not_found",
        statusCode: 404,
      });
    }

    const { token } = await requireOwnedSocialAccessToken({ accountId, userId });
    const refreshed = await refreshSocialAccessToken(account.platform, token);

    const updated = await refreshOwnedSocialAccountToken({
      accountId,
      userId,
      accessToken: refreshed.accessToken,
      tokenExpiresAt: refreshed.expiresAt,
    });

    logger.info("Social account token refreshed", {
      category: "request",
      service: "social_accounts",
      userId,
      metadata: {
        accountId,
        platform: account.platform,
      },
    });

    return updated;
  } catch (error) {
    const normalized = mapProviderError(error);
    await markSocialAccountStatus({
      accountId,
      userId,
      status: "reauthorization_required",
      reauthorizationRequired: true,
      errorMessage: normalized.message,
    });
    logger.error("Social account token refresh failed", {
      category: "error",
      service: "social_accounts",
      userId,
      metadata: {
        accountId,
        code: normalized.code,
      },
      error: {
        name: "SocialAccountRefreshError",
        message: normalized.message,
      },
    });
    throw normalized;
  } finally {
    metrics.recordDuration("socialAccountRefreshMs", Date.now() - startedAt);
  }
}

export async function disconnectSocialAccountConnection(accountId: string, userId: string): Promise<void> {
  const startedAt = Date.now();
  metrics.increment("requestCount");

  try {
    const account = await getOwnedSocialAccountConnection(accountId, userId);
    if (!account) {
      throw new SocialAccountError("Social account connection was not found.", {
        code: "social_account_not_found",
        statusCode: 404,
      });
    }

    await disconnectOwnedSocialAccountConnection(accountId, userId);

    logger.info("Social account disconnected", {
      category: "request",
      service: "social_accounts",
      userId,
      metadata: {
        accountId,
        platform: account.platform,
      },
    });
  } finally {
    metrics.recordDuration("socialAccountDisconnectMs", Date.now() - startedAt);
  }
}

export async function getInstagramPublishingAccount(userId: string): Promise<SocialAccountConnection | null> {
  const account = await getOwnedSocialAccountConnectionByPlatform(userId, "instagram");
  if (!account) return null;

  if (account.status === "connected") {
    if (account.tokenExpiresAt && new Date(account.tokenExpiresAt).getTime() < Date.now() + TOKEN_EXPIRY_BUFFER_MS) {
      await markSocialAccountStatus({
        accountId: account.id,
        userId,
        status: "expired",
        reauthorizationRequired: true,
        errorMessage: "Instagram access token has expired.",
      });
      return {
        ...account,
        status: "expired",
        reauthorizationRequired: true,
      };
    }

    return account;
  }

  return account;
}
