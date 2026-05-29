import type {
  SocialAccountConnection,
  SocialAccountConnectionStatus,
  SocialAccountPlatform,
} from "./types";

export const SOCIAL_ACCOUNT_PLATFORMS: SocialAccountPlatform[] = [
  "instagram",
  "facebook",
  "linkedin",
  "x",
];

export const SOCIAL_ACCOUNT_MVP_PLATFORMS: SocialAccountPlatform[] = ["instagram"];

export const SOCIAL_ACCOUNT_CONNECTION_STATUSES: SocialAccountConnectionStatus[] = [
  "connecting",
  "connected",
  "disconnected",
  "expired",
  "invalid",
  "reauthorization_required",
];

export const SOCIAL_ACCOUNT_REQUIREMENTS = {
  ownerScoped: true,
  encryptedTokenStorage: true,
  oauthStateValidation: true,
  platformRegistry: true,
  statusTracking: true,
  mvpPlatforms: SOCIAL_ACCOUNT_MVP_PLATFORMS,
  futurePlatforms: ["facebook", "linkedin", "x"] as const,
};

export const SOCIAL_ACCOUNT_EXAMPLE: Omit<
  SocialAccountConnection,
  "id" | "userId" | "createdAt" | "updatedAt"
> = {
  platform: "instagram",
  status: "connected",
  platformAccountId: "17840000000000000",
  displayName: "Zero Labs",
  username: "zerolabs",
  profileUrl: "https://instagram.com/zerolabs",
  profilePictureUrl: undefined,
  scopes: [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish",
  ],
  tokenExpiresAt: "2026-06-01T00:00:00.000Z",
  tokenLastRefreshedAt: "2026-05-01T00:00:00.000Z",
  tokenReference: undefined,
  reauthorizationRequired: false,
  oauthState: undefined,
  oauthStateExpiresAt: undefined,
  lastError: undefined,
  metadata: {
    connectedBy: "oauth",
  },
  connectedAt: "2026-05-01T00:00:00.000Z",
  disconnectedAt: undefined,
  instagramAccountId: "17840000000000000",
  instagramUsername: "zerolabs",
  facebookPageId: "1234567890",
};
