import { config } from "@/config";
import { InstagramIntegrationError } from "./errors";
import type { InstagramPublishRetryPolicy } from "./types";

export const DEFAULT_INSTAGRAM_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
] as const;

export const DEFAULT_INSTAGRAM_RETRY_POLICY: InstagramPublishRetryPolicy = {
  maxAttempts: 3,
  baseDelaySeconds: 60,
  backoffMultiplier: 2,
};

export function getInstagramGraphApiBaseUrl(): string {
  return `https://graph.facebook.com/${config.services.meta.instagramGraphApiVersion}`;
}

export function assertInstagramMetaConfig(): {
  appId: string;
  appSecret: string;
  redirectUri: string;
} {
  const appId = config.services.meta.appId;
  const appSecret = config.services.meta.appSecret;
  const redirectUri = config.services.meta.redirectUri;

  if (!appId || !appSecret || !redirectUri) {
    throw new InstagramIntegrationError(
      "Instagram publishing is not configured. META_APP_ID, META_APP_SECRET, and META_REDIRECT_URI are required.",
      { code: "instagram_config_missing", retryable: false },
    );
  }

  return { appId, appSecret, redirectUri };
}
