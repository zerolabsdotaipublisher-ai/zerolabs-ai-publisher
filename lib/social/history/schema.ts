import type {
  SocialPublishHistoryJob,
  SocialPublishHistoryLifecycleEntry,
  SocialPublishHistoryStatus,
} from "./types";

export const SOCIAL_PUBLISH_HISTORY_STATUSES: SocialPublishHistoryStatus[] = [
  "requested",
  "queued",
  "publishing",
  "published",
  "failed",
  "retry",
  "canceled",
];

export const SOCIAL_PUBLISH_HISTORY_SOURCES = ["manual", "schedule", "retry"] as const;

export const SOCIAL_PUBLISH_HISTORY_EVENT_TYPES = [
  "requested",
  "queued",
  "publishing",
  "published",
  "failed",
  "retry",
  "canceled",
  "delivery_request",
  "delivery_response",
  "audit",
] as const;

export const SOCIAL_PUBLISH_HISTORY_MVP_BOUNDARIES = {
  livePlatforms: ["instagram"] as const,
  filtering: ["status", "platform", "date", "account"] as const,
  pagination: true,
  retryMode: "manual" as const,
  dashboards: false,
  externalReportingApi: false,
};

export const SOCIAL_PUBLISH_HISTORY_REQUIREMENTS = {
  ownership: ["user", "tenant"] as const,
  storeSnapshot: true,
  trackLifecycle: true,
  trackPlatformDelivery: true,
  captureProviderRequestResponse: true,
  captureErrors: true,
  captureTimestamps: ["scheduled", "started", "completed", "retry"] as const,
};

export const SOCIAL_PUBLISH_HISTORY_LIFECYCLE_EXAMPLE: SocialPublishHistoryLifecycleEntry[] = [
  {
    status: "requested",
    at: "2026-04-30T00:00:00.000Z",
    message: "Publish request accepted.",
  },
  {
    status: "queued",
    at: "2026-04-30T00:00:01.000Z",
    message: "Publish request queued.",
  },
  {
    status: "publishing",
    at: "2026-04-30T00:00:05.000Z",
    message: "Platform delivery started.",
  },
  {
    status: "published",
    at: "2026-04-30T00:00:08.000Z",
    message: "Platform delivery completed.",
  },
];

export const SOCIAL_PUBLISH_HISTORY_EXAMPLE: Omit<
  SocialPublishHistoryJob,
  "id" | "userId" | "createdAt" | "updatedAt"
> = {
  tenantId: "tenant_demo",
  structureId: "ws_abc123",
  socialPostId: "social_abc123",
  publishJobId: "spjob_instagram_demo",
  source: "manual",
  sourceRefId: "api/social/instagram/publish",
  status: "published",
  platform: "instagram",
  contentSnapshot: {
    caption: "AI workflows scale social publishing without losing quality.",
    media: ["https://cdn.example.com/social/hero.png"],
    metadata: {
      hashtags: ["#AIPublishing", "#ContentOps"],
    },
  },
  accountReference: {
    platformAccountId: "1784xxxx",
    platformUsername: "zero_labs",
    facebookPageId: "12345",
  },
  requestPayload: {
    caption: "AI workflows scale social publishing without losing quality.",
    imageUrl: "https://cdn.example.com/social/hero.png",
  },
  responsePayload: {
    mediaId: "1798xxxx",
  },
  lifecycle: SOCIAL_PUBLISH_HISTORY_LIFECYCLE_EXAMPLE,
  error: undefined,
  scheduledAt: "2026-04-30T00:00:00.000Z",
  startedAt: "2026-04-30T00:00:05.000Z",
  completedAt: "2026-04-30T00:00:08.000Z",
  retryAt: undefined,
};
