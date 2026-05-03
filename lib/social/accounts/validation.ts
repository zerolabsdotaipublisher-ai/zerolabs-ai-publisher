import { SOCIAL_ACCOUNT_CONNECTION_STATUSES, SOCIAL_ACCOUNT_PLATFORMS } from "./schema";
import type { SocialAccountConnectionStatus, SocialAccountPlatform } from "./types";

export class SocialAccountError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly retryable: boolean;
  readonly metadata?: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      code: string;
      statusCode?: number;
      retryable?: boolean;
      metadata?: Record<string, unknown>;
    },
  ) {
    super(message);
    this.name = "SocialAccountError";
    this.code = options.code;
    this.statusCode = options.statusCode ?? 400;
    this.retryable = options.retryable ?? false;
    this.metadata = options.metadata;
  }
}

export function isSocialAccountPlatform(value: string): value is SocialAccountPlatform {
  return SOCIAL_ACCOUNT_PLATFORMS.includes(value as SocialAccountPlatform);
}

export function requireSocialAccountPlatform(value: string): SocialAccountPlatform {
  if (!isSocialAccountPlatform(value)) {
    throw new SocialAccountError("Unsupported social account provider.", {
      code: "social_account_provider_unsupported",
      statusCode: 422,
    });
  }

  return value;
}

export function normalizeConnectionStatus(
  status: string,
  reauthorizationRequired: boolean,
): SocialAccountConnectionStatus {
  // Backward compatibility for pre-story-7-6 rows that used legacy status names.
  if (status === "reconnect_required") return "reauthorization_required";
  if (status === "token_expiring") return "expired";
  if (status === "revoked") return "invalid";
  if (reauthorizationRequired) return "reauthorization_required";

  return SOCIAL_ACCOUNT_CONNECTION_STATUSES.includes(status as SocialAccountConnectionStatus)
    ? (status as SocialAccountConnectionStatus)
    : "invalid";
}

export function assertOAuthCallbackInput(input: {
  code?: string | null;
  state?: string | null;
}): { code: string; state: string } {
  const code = input.code?.trim();
  const state = input.state?.trim();

  if (!code || !state) {
    throw new SocialAccountError("OAuth callback is missing code or state.", {
      code: "social_account_oauth_callback_invalid",
      statusCode: 400,
    });
  }

  return { code, state };
}
