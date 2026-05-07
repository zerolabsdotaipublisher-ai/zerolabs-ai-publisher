import "server-only";

import { getStructureApprovalPublishingGate } from "@/lib/approval";
import { getOwnedApprovalDetail } from "@/lib/approval/model";
import { detectPublicationState, getPublicationMetadata, withPublicationMetadata } from "@/lib/publish";
import { runPublishWorkflow } from "@/lib/publish/workflow";
import { savePublishStructure } from "@/lib/publish/storage";
import { getOwnedContentScheduleByStructureId, updateContentScheduleStatus } from "@/lib/scheduling";
import { logger } from "@/lib/observability";
import { getSocialPostById } from "@/lib/social";
import { getInstagramPublishingAccount } from "@/lib/social/accounts";
import { createSocialPublishHistoryForInstagramJob } from "@/lib/social/history";
import {
  createInstagramPublishJob,
  executeInstagramPublishJob,
  prepareInstagramPublishPayload,
  updateInstagramPublishJob,
} from "@/lib/social/instagram";
import { getOwnedSocialScheduleByPostId, setOwnedSocialScheduleStatus } from "@/lib/social/scheduling";
import { toRevisionWorkflowIdMap } from "@/lib/revisions/model";
import { recordContentRevisionAction } from "@/lib/revisions/workflow";
import { getOwnedPublishStructure } from "../storage";
import { appendManualOverrideAuditEntry } from "./audit";
import { emitManualOverrideNotification } from "./notifications";
import { resolveManualOverridePermission } from "./permissions";
import type {
  ManualOverrideBypassedWorkflow,
  ManualOverrideExecutionResult,
  ManualOverrideResolvedTarget,
  ManualOverrideWorkflowParams,
} from "./types";

function createRequestId(): string {
  return `moverride_${crypto.randomUUID()}`;
}

function isApprovalAccepted(state: string | undefined): boolean {
  return state === "approved" || state === "published";
}

async function resolveTarget(params: ManualOverrideWorkflowParams): Promise<ManualOverrideResolvedTarget> {
  const { user, input } = params;

  if (input.contentId) {
    const detail = await getOwnedApprovalDetail(user.id, input.contentId);
    if (!detail) {
      throw new Error("Content not found for manual override.");
    }

    return {
      structureId: detail.linkedStructureId,
      contentId: detail.contentId,
      socialPostId: detail.item.type === "social_post" ? detail.item.sourceId : undefined,
      targetContentId: input.targetContentId ?? detail.contentId,
      targetContentType: input.targetContentType ?? (detail.item.type === "social_post" ? "social_post" : detail.item.type),
      approvalState: detail.approvalState,
    };
  }

  if (input.socialPostId) {
    return {
      structureId: input.structureId,
      socialPostId: input.socialPostId,
      targetContentId: input.targetContentId ?? input.socialPostId,
      targetContentType: input.targetContentType ?? "social_post",
    };
  }

  if (input.structureId) {
    return {
      structureId: input.structureId,
      targetContentId: input.targetContentId ?? input.structureId,
      targetContentType: input.targetContentType ?? "website",
    };
  }

  throw new Error("Unable to resolve manual override target.");
}

async function pauseStructureSchedule(structureId: string, userId: string): Promise<boolean> {
  const schedule = await getOwnedContentScheduleByStructureId(structureId, userId);
  if (!schedule || !schedule.nextRunAt || schedule.status === "cancelled" || schedule.status === "completed") {
    return false;
  }

  await updateContentScheduleStatus(schedule, "paused", {
    nextRunAt: undefined,
    clearContentSchedule: true,
  });

  return true;
}

async function cancelSocialSchedule(socialPostId: string, userId: string): Promise<boolean> {
  const schedule = await getOwnedSocialScheduleByPostId(socialPostId, userId);
  if (!schedule || !schedule.scheduledFor || schedule.status === "canceled") {
    return false;
  }

  await setOwnedSocialScheduleStatus(schedule.id, userId, "canceled", {
    scheduledFor: undefined,
    clearScheduledPublishAt: true,
  });

  return true;
}

async function executeSocialOverride(params: {
  userId: string;
  socialPostId: string;
  requestId: string;
}): Promise<{ jobId: string; status: string; scheduled: boolean; structureId?: string }> {
  const socialPost = await getSocialPostById(params.socialPostId, params.userId);
  if (!socialPost) {
    throw new Error("Social post not found.");
  }

  const variant = socialPost.variants.find((entry) => entry.platform === "instagram");
  if (!variant) {
    throw new Error("Manual override supports social posts with an Instagram variant.");
  }

  const connection = await getInstagramPublishingAccount(params.userId);
  if (!connection || connection.status !== "connected" || !connection.instagramAccountId) {
    throw new Error("Instagram account is not connected for this user.");
  }

  const payload = prepareInstagramPublishPayload(variant);
  const executedAt = new Date().toISOString();
  const job = await createInstagramPublishJob({
    userId: params.userId,
    socialPostId: socialPost.id,
    caption: payload.caption,
    mediaUrl: payload.mediaUrl,
    instagramAccountId: connection.instagramAccountId,
    facebookPageId: connection.facebookPageId,
    scheduledFor: executedAt,
    metadata: {
      source: "api/publish/override",
      manualOverride: true,
      overrideRequestId: params.requestId,
      structureId: socialPost.structureId,
    },
  });

  const history = await createSocialPublishHistoryForInstagramJob({
    job,
    source: "manual",
    sourceRefId: params.requestId,
    structureId: socialPost.structureId,
    socialPostId: socialPost.id,
    contentMetadata: {
      override: true,
      overrideRequestId: params.requestId,
      hashtags: variant.hashtags,
      callToAction: variant.callToAction,
    },
  });

  await updateInstagramPublishJob(job.id, params.userId, {
    metadata_json: {
      ...job.metadata,
      historyJobId: history.id,
      overrideRequestId: params.requestId,
    },
  });

  const executed = await executeInstagramPublishJob(job.id, params.userId);

  return {
    jobId: executed.id,
    status: executed.status,
    scheduled: false,
    structureId: socialPost.structureId,
  };
}

async function attachOverrideMetadataToStructure(params: {
  structureId: string;
  userId: string;
  targetContentId: string;
  targetContentType: ManualOverrideResolvedTarget["targetContentType"];
  reason: string;
  scenario: ManualOverrideExecutionResult["scenario"];
  bypassedWorkflows: ManualOverrideBypassedWorkflow[];
  approvalBypassed: boolean;
  requestId: string;
  overrideTimestamp: string;
}): Promise<void> {
  const structure = await getOwnedPublishStructure(params.structureId, params.userId);
  if (!structure) {
    return;
  }

  const publication = getPublicationMetadata(structure);
  const next = withPublicationMetadata(structure, {
    ...publication,
    updates: {
      ...publication.updates,
      manualOverride: {
        overrideUsed: true,
        overrideReason: params.reason,
        overrideTimestamp: params.overrideTimestamp,
        overrideUserId: params.userId,
        bypassedWorkflows: params.bypassedWorkflows,
        targetContentId: params.targetContentId,
        targetContentType: params.targetContentType,
        scenario: params.scenario,
        approvalBypassed: params.approvalBypassed,
        requestId: params.requestId,
      },
    },
  });

  await savePublishStructure(next);
}

export async function runManualOverrideWorkflow(params: ManualOverrideWorkflowParams): Promise<ManualOverrideExecutionResult> {
  const requestId = createRequestId();
  const overrideTimestamp = new Date().toISOString();
  const resolvedTarget = await resolveTarget(params);

  const permission = resolveManualOverridePermission(params.user, params.user.id);
  if (!permission.allowed) {
    return {
      ok: false,
      requestId,
      targetContentId: resolvedTarget.targetContentId,
      targetContentType: resolvedTarget.targetContentType,
      structureId: resolvedTarget.structureId,
      contentId: resolvedTarget.contentId,
      socialPostId: resolvedTarget.socialPostId,
      overrideUsed: true,
      overrideReason: params.input.reason,
      overrideTimestamp,
      overrideUserId: params.user.id,
      scenario: params.input.scenario,
      bypassedWorkflows: [],
      approvalBypassed: false,
      error: permission.reason || "Manual override is not allowed.",
    };
  }

  if (params.input.bypassApproval && !permission.canBypassApproval) {
    return {
      ok: false,
      requestId,
      targetContentId: resolvedTarget.targetContentId,
      targetContentType: resolvedTarget.targetContentType,
      structureId: resolvedTarget.structureId,
      contentId: resolvedTarget.contentId,
      socialPostId: resolvedTarget.socialPostId,
      overrideUsed: true,
      overrideReason: params.input.reason,
      overrideTimestamp,
      overrideUserId: params.user.id,
      scenario: params.input.scenario,
      bypassedWorkflows: [],
      approvalBypassed: false,
      error: "Approval bypass requires admin or authorized approver role.",
    };
  }

  const bypassedWorkflows: ManualOverrideBypassedWorkflow[] = [];

  if (resolvedTarget.approvalState && !isApprovalAccepted(resolvedTarget.approvalState)) {
    if (!params.input.bypassApproval) {
      return {
        ok: false,
        requestId,
        targetContentId: resolvedTarget.targetContentId,
        targetContentType: resolvedTarget.targetContentType,
        structureId: resolvedTarget.structureId,
        contentId: resolvedTarget.contentId,
        socialPostId: resolvedTarget.socialPostId,
        overrideUsed: true,
        overrideReason: params.input.reason,
        overrideTimestamp,
        overrideUserId: params.user.id,
        scenario: params.input.scenario,
        bypassedWorkflows: [],
        approvalBypassed: false,
        error: "Manual override is blocked until content approval is complete or bypass is authorized.",
      };
    }

    bypassedWorkflows.push("approval");
  }

  if (resolvedTarget.structureId && resolvedTarget.targetContentType !== "social_post") {
    const approvalGate = await getStructureApprovalPublishingGate(params.user.id, resolvedTarget.structureId);
    if (approvalGate.blocked) {
      if (!params.input.bypassApproval) {
        return {
          ok: false,
          requestId,
          targetContentId: resolvedTarget.targetContentId,
          targetContentType: resolvedTarget.targetContentType,
          structureId: resolvedTarget.structureId,
          contentId: resolvedTarget.contentId,
          socialPostId: resolvedTarget.socialPostId,
          overrideUsed: true,
          overrideReason: params.input.reason,
          overrideTimestamp,
          overrideUserId: params.user.id,
          scenario: params.input.scenario,
          bypassedWorkflows,
          approvalBypassed: false,
          error: approvalGate.reason || "Publishing is blocked by approval workflow.",
        };
      }

      if (!bypassedWorkflows.includes("approval")) {
        bypassedWorkflows.push("approval");
      }
    }
  }

  const approvalBypassed = bypassedWorkflows.includes("approval");

  try {
    if (resolvedTarget.targetContentType === "social_post") {
      if (!resolvedTarget.socialPostId) {
        throw new Error("socialPostId is required for social manual override.");
      }

      const socialResult = await executeSocialOverride({
        userId: params.user.id,
        socialPostId: resolvedTarget.socialPostId,
        requestId,
      });

      const scheduleBypassed = await cancelSocialSchedule(resolvedTarget.socialPostId, params.user.id);
      if (scheduleBypassed) {
        bypassedWorkflows.push("schedule");
      }

      if (socialResult.structureId) {
        await attachOverrideMetadataToStructure({
          structureId: socialResult.structureId,
          userId: params.user.id,
          targetContentId: resolvedTarget.targetContentId,
          targetContentType: resolvedTarget.targetContentType,
          reason: params.input.reason,
          scenario: params.input.scenario,
          bypassedWorkflows,
          approvalBypassed,
          requestId,
          overrideTimestamp,
        });
      }

      await appendManualOverrideAuditEntry({
        userId: params.user.id,
        overrideUserId: params.user.id,
        structureId: socialResult.structureId,
        contentId: resolvedTarget.contentId,
        targetContentId: resolvedTarget.targetContentId,
        targetContentType: resolvedTarget.targetContentType,
        overrideUsed: true,
        overrideReason: params.input.reason,
        overrideScenario: params.input.scenario,
        overrideTimestamp,
        bypassedWorkflows,
        approvalBypassed,
        metadata: {
          requestId,
          roles: permission.roles,
          socialJobId: socialResult.jobId,
          socialStatus: socialResult.status,
        },
      });

      if (resolvedTarget.contentId) {
        await recordContentRevisionAction({
          userId: params.user.id,
          contentId: resolvedTarget.contentId,
          actionType: "publish",
          relatedWorkflowIds: toRevisionWorkflowIdMap({ publishRequestId: requestId }),
          metadata: {
            manualOverride: true,
            overrideScenario: params.input.scenario,
            overrideReason: params.input.reason,
            bypassedWorkflows,
          },
        });
      }

      const result: ManualOverrideExecutionResult = {
        ok: true,
        requestId,
        targetContentId: resolvedTarget.targetContentId,
        targetContentType: resolvedTarget.targetContentType,
        structureId: socialResult.structureId,
        contentId: resolvedTarget.contentId,
        socialPostId: resolvedTarget.socialPostId,
        overrideUsed: true,
        overrideReason: params.input.reason,
        overrideTimestamp,
        overrideUserId: params.user.id,
        scenario: params.input.scenario,
        bypassedWorkflows,
        approvalBypassed,
        social: {
          ok: socialResult.status === "published",
          jobId: socialResult.jobId,
          status: socialResult.status,
          scheduled: socialResult.scheduled,
        },
        message: socialResult.status === "published"
          ? "Manual social override published successfully."
          : `Manual social override completed with status: ${socialResult.status}.`,
      };

      await emitManualOverrideNotification({ userId: params.user.id, result });
      return result;
    }

    if (!resolvedTarget.structureId) {
      throw new Error("structureId is required for website/blog/article override.");
    }

    const structure = await getOwnedPublishStructure(resolvedTarget.structureId, params.user.id);
    if (!structure) {
      throw new Error("Structure not found.");
    }

    const action = detectPublicationState(structure).neverPublished ? "publish" : "update";
    const publish = await runPublishWorkflow({
      structure,
      userId: params.user.id,
      action,
    });

    if (!publish.ok || !publish.structure) {
      throw new Error(publish.error || "Manual override publish failed.");
    }

    const scheduleBypassed = await pauseStructureSchedule(resolvedTarget.structureId, params.user.id);
    if (scheduleBypassed) {
      bypassedWorkflows.push("schedule");
    }

    await attachOverrideMetadataToStructure({
      structureId: resolvedTarget.structureId,
      userId: params.user.id,
      targetContentId: resolvedTarget.targetContentId,
      targetContentType: resolvedTarget.targetContentType,
      reason: params.input.reason,
      scenario: params.input.scenario,
      bypassedWorkflows,
      approvalBypassed,
      requestId,
      overrideTimestamp,
    });

    await appendManualOverrideAuditEntry({
      userId: params.user.id,
      overrideUserId: params.user.id,
      structureId: resolvedTarget.structureId,
      contentId: resolvedTarget.contentId,
      targetContentId: resolvedTarget.targetContentId,
      targetContentType: resolvedTarget.targetContentType,
      overrideUsed: true,
      overrideReason: params.input.reason,
      overrideScenario: params.input.scenario,
      overrideTimestamp,
      bypassedWorkflows,
      approvalBypassed,
      metadata: {
        requestId,
        roles: permission.roles,
        publishAction: action,
        publishRequestId: publish.requestId,
      },
    });

    const result: ManualOverrideExecutionResult = {
      ok: true,
      requestId,
      targetContentId: resolvedTarget.targetContentId,
      targetContentType: resolvedTarget.targetContentType,
      structureId: resolvedTarget.structureId,
      contentId: resolvedTarget.contentId,
      socialPostId: resolvedTarget.socialPostId,
      overrideUsed: true,
      overrideReason: params.input.reason,
      overrideTimestamp,
      overrideUserId: params.user.id,
      scenario: params.input.scenario,
      bypassedWorkflows,
      approvalBypassed,
      publish,
      message: "Manual publishing override completed successfully.",
    };

    await emitManualOverrideNotification({ userId: params.user.id, result });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Manual override failed.";

    logger.error("manual publish override failed", {
      category: "error",
      service: "publish_override",
      requestId,
      userId: params.user.id,
      structureId: resolvedTarget.structureId,
      contentId: resolvedTarget.contentId,
      socialPostId: resolvedTarget.socialPostId,
      targetContentId: resolvedTarget.targetContentId,
      targetContentType: resolvedTarget.targetContentType,
      scenario: params.input.scenario,
      bypassedWorkflows,
      approvalBypassed,
      error: {
        name: "ManualPublishOverrideError",
        message,
      },
    });

    const result: ManualOverrideExecutionResult = {
      ok: false,
      requestId,
      targetContentId: resolvedTarget.targetContentId,
      targetContentType: resolvedTarget.targetContentType,
      structureId: resolvedTarget.structureId,
      contentId: resolvedTarget.contentId,
      socialPostId: resolvedTarget.socialPostId,
      overrideUsed: true,
      overrideReason: params.input.reason,
      overrideTimestamp,
      overrideUserId: params.user.id,
      scenario: params.input.scenario,
      bypassedWorkflows,
      approvalBypassed,
      error: message,
    };

    await emitManualOverrideNotification({ userId: params.user.id, result });
    return result;
  }
}
