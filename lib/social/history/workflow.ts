import "server-only";

import type { InstagramPublishJob } from "@/lib/social/instagram/types";
import { logger } from "@/lib/observability";
import {
  createSocialPublishHistoryDeliveryId,
  createSocialPublishHistoryEventId,
  createSocialPublishHistoryJobId,
  getOwnedSocialPublishHistoryDetail,
  getSocialPublishHistoryByPublishJobId,
  listOwnedSocialPublishHistoryDeliveries,
  saveSocialPublishHistoryDelivery,
  saveSocialPublishHistoryEvent,
  saveSocialPublishHistoryJob,
} from "./storage";
import type {
  SocialPublishHistoryAccountReference,
  SocialPublishHistoryDelivery,
  SocialPublishHistoryError,
  SocialPublishHistoryJob,
  SocialPublishHistoryJobWithDetails,
  SocialPublishHistorySource,
  SocialPublishHistoryStatus,
} from "./types";
import { validateSocialPublishHistoryJob } from "./validation";

function appendLifecycle(
  lifecycle: SocialPublishHistoryJob["lifecycle"],
  status: SocialPublishHistoryStatus,
  message: string,
  details?: Record<string, unknown>,
): SocialPublishHistoryJob["lifecycle"] {
  return [
    ...lifecycle,
    {
      status,
      at: new Date().toISOString(),
      message,
      details,
    },
  ];
}

function resolveTenantId(tenantId: string | undefined, metadata: Record<string, unknown>): string | undefined {
  if (tenantId) return tenantId;
  const candidate = metadata.tenantId;
  return typeof candidate === "string" && candidate.trim() ? candidate : undefined;
}

async function getPrimaryDelivery(historyJobId: string, userId: string): Promise<SocialPublishHistoryDelivery | null> {
  const deliveries = await listOwnedSocialPublishHistoryDeliveries(historyJobId, userId);
  return deliveries[0] ?? null;
}

export async function createSocialPublishHistoryJob(args: {
  userId: string;
  tenantId?: string;
  structureId?: string;
  socialPostId?: string;
  publishJobId?: string;
  source: SocialPublishHistorySource;
  sourceRefId?: string;
  platform: SocialPublishHistoryJob["platform"];
  contentSnapshot: SocialPublishHistoryJob["contentSnapshot"];
  accountReference: SocialPublishHistoryAccountReference;
  requestPayload: Record<string, unknown>;
  scheduledAt?: string;
}): Promise<SocialPublishHistoryJobWithDetails> {
  const now = new Date().toISOString();
  const historyJob: SocialPublishHistoryJob = {
    id: createSocialPublishHistoryJobId(),
    userId: args.userId,
    tenantId: args.tenantId,
    structureId: args.structureId,
    socialPostId: args.socialPostId,
    publishJobId: args.publishJobId,
    source: args.source,
    sourceRefId: args.sourceRefId,
    status: "requested",
    platform: args.platform,
    contentSnapshot: args.contentSnapshot,
    accountReference: args.accountReference,
    requestPayload: args.requestPayload,
    responsePayload: {},
    lifecycle: [
      {
        status: "requested",
        at: now,
        message: "Publish request captured.",
      },
    ],
    error: undefined,
    scheduledAt: args.scheduledAt,
    startedAt: undefined,
    completedAt: undefined,
    retryAt: undefined,
    createdAt: now,
    updatedAt: now,
  };

  const errors = validateSocialPublishHistoryJob(historyJob);
  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  await saveSocialPublishHistoryJob(historyJob);

  const delivery: SocialPublishHistoryDelivery = {
    id: createSocialPublishHistoryDeliveryId(historyJob.id),
    historyJobId: historyJob.id,
    userId: args.userId,
    tenantId: args.tenantId,
    platform: args.platform,
    status: "requested",
    accountReference: args.accountReference,
    requestPayload: args.requestPayload,
    responsePayload: {},
    error: undefined,
    requestedAt: now,
    queuedAt: undefined,
    startedAt: undefined,
    completedAt: undefined,
    retryAt: undefined,
    canceledAt: undefined,
    createdAt: now,
    updatedAt: now,
  };

  await saveSocialPublishHistoryDelivery(delivery);
  await saveSocialPublishHistoryEvent({
    id: createSocialPublishHistoryEventId(historyJob.id),
    historyJobId: historyJob.id,
    deliveryId: delivery.id,
    userId: args.userId,
    tenantId: args.tenantId,
    eventType: "requested",
    severity: "info",
    message: "Social publish history requested state recorded.",
    payload: {
      source: args.source,
      sourceRefId: args.sourceRefId,
    },
    createdAt: now,
  });

  return {
    ...historyJob,
    deliveries: [delivery],
    events: [],
  };
}

export async function createSocialPublishHistoryForInstagramJob(args: {
  job: InstagramPublishJob;
  source: SocialPublishHistorySource;
  sourceRefId?: string;
  structureId?: string;
  socialPostId?: string;
  tenantId?: string;
  contentMetadata?: Record<string, unknown>;
}): Promise<SocialPublishHistoryJobWithDetails> {
  return createSocialPublishHistoryJob({
    userId: args.job.userId,
    tenantId: resolveTenantId(args.tenantId, args.job.metadata),
    structureId:
      args.structureId ??
      (typeof args.job.metadata.structureId === "string" ? args.job.metadata.structureId : undefined),
    socialPostId: args.socialPostId ?? args.job.socialPostId,
    publishJobId: args.job.id,
    source: args.source,
    sourceRefId: args.sourceRefId,
    platform: "instagram",
    contentSnapshot: {
      caption: args.job.caption,
      media: [args.job.mediaUrl],
      metadata: {
        ...(args.contentMetadata ?? {}),
        socialPostId: args.job.socialPostId,
      },
    },
    accountReference: {
      platformAccountId: args.job.instagramAccountId,
      facebookPageId: args.job.facebookPageId,
    },
    requestPayload: {
      caption: args.job.caption,
      mediaUrl: args.job.mediaUrl,
      scheduledFor: args.job.scheduledFor,
    },
    scheduledAt: args.job.scheduledFor,
  });
}

export async function ensureSocialPublishHistoryForInstagramJob(args: {
  job: InstagramPublishJob;
  fallbackSource: SocialPublishHistorySource;
  fallbackSourceRefId?: string;
}): Promise<SocialPublishHistoryJobWithDetails> {
  const metadataHistoryId =
    typeof args.job.metadata.historyJobId === "string" ? args.job.metadata.historyJobId : undefined;
  if (metadataHistoryId) {
    const existing = await getOwnedSocialPublishHistoryDetail(metadataHistoryId, args.job.userId);
    if (existing) {
      return existing;
    }
  }

  const existingByPublishJob = await getSocialPublishHistoryByPublishJobId(args.job.id, args.job.userId);
  if (existingByPublishJob) {
    const detail = await getOwnedSocialPublishHistoryDetail(existingByPublishJob.id, args.job.userId);
    if (detail) {
      return detail;
    }
  }

  return createSocialPublishHistoryForInstagramJob({
    job: args.job,
    source: args.fallbackSource,
    sourceRefId: args.fallbackSourceRefId,
  });
}

export async function transitionSocialPublishHistory(args: {
  historyJobId: string;
  userId: string;
  status: SocialPublishHistoryStatus;
  message: string;
  requestPayload?: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
  error?: SocialPublishHistoryError;
  retryAt?: string;
  details?: Record<string, unknown>;
}): Promise<SocialPublishHistoryJobWithDetails | null> {
  const detail = await getOwnedSocialPublishHistoryDetail(args.historyJobId, args.userId);
  if (!detail) {
    return null;
  }

  const now = new Date().toISOString();
  const updatedJob: SocialPublishHistoryJob = {
    ...detail,
    status: args.status,
    requestPayload: args.requestPayload ?? detail.requestPayload,
    responsePayload: args.responsePayload ?? detail.responsePayload,
    error: args.error,
    retryAt: args.retryAt,
    startedAt: args.status === "publishing" ? now : detail.startedAt,
    completedAt:
      args.status === "published" || args.status === "failed" || args.status === "canceled" ? now : detail.completedAt,
    lifecycle: appendLifecycle(detail.lifecycle, args.status, args.message, args.details),
    updatedAt: now,
  };
  await saveSocialPublishHistoryJob(updatedJob);

  const primaryDelivery = await getPrimaryDelivery(detail.id, detail.userId);
  if (primaryDelivery) {
    const updatedDelivery: SocialPublishHistoryDelivery = {
      ...primaryDelivery,
      status: args.status,
      requestPayload: args.requestPayload ?? primaryDelivery.requestPayload,
      responsePayload: args.responsePayload ?? primaryDelivery.responsePayload,
      error: args.error,
      queuedAt: args.status === "queued" ? now : primaryDelivery.queuedAt,
      startedAt: args.status === "publishing" ? now : primaryDelivery.startedAt,
      completedAt:
        args.status === "published" || args.status === "failed" || args.status === "canceled"
          ? now
          : primaryDelivery.completedAt,
      retryAt: args.retryAt,
      canceledAt: args.status === "canceled" ? now : primaryDelivery.canceledAt,
      updatedAt: now,
    };
    await saveSocialPublishHistoryDelivery(updatedDelivery);

    await saveSocialPublishHistoryEvent({
      id: createSocialPublishHistoryEventId(detail.id),
      historyJobId: detail.id,
      deliveryId: updatedDelivery.id,
      userId: detail.userId,
      tenantId: detail.tenantId,
      eventType: args.status,
      severity: args.status === "failed" ? "error" : args.status === "retry" ? "warning" : "info",
      message: args.message,
      payload: {
        details: args.details,
        retryAt: args.retryAt,
      },
      createdAt: now,
    });
  }

  return getOwnedSocialPublishHistoryDetail(detail.id, detail.userId);
}

export async function retrySocialPublishFromHistory(
  historyJobId: string,
  userId: string,
): Promise<{ history: SocialPublishHistoryJobWithDetails; publishStatus: string }> {
  const history = await getOwnedSocialPublishHistoryDetail(historyJobId, userId);
  if (!history) {
    throw new Error("History job not found.");
  }

  if (!history.publishJobId) {
    throw new Error("History job is not linked to a publish job.");
  }

  await transitionSocialPublishHistory({
    historyJobId,
    userId,
    status: "retry",
    message: "Manual retry requested from history.",
    retryAt: new Date().toISOString(),
  });

  const { executeInstagramPublishJob, getInstagramPublishJob } = await import("@/lib/social/instagram");
  const publishJob = await getInstagramPublishJob(history.publishJobId, userId);
  if (!publishJob) {
    throw new Error("Linked publish job was not found.");
  }

  const executed = await executeInstagramPublishJob(publishJob.id, userId);
  const updatedHistory = await getOwnedSocialPublishHistoryDetail(historyJobId, userId);
  if (!updatedHistory) {
    throw new Error("Unable to load history after retry.");
  }

  logger.info("Manual social publish retry triggered from history", {
    category: "business",
    service: "social_history",
    historyJobId,
    publishJobId: publishJob.id,
    status: executed.status,
  });

  return {
    history: updatedHistory,
    publishStatus: executed.status,
  };
}
