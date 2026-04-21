import "server-only";

import { logger } from "@/lib/observability";
import { PipelineError } from "@/lib/pipeline";
import { canUserPublishWebsite } from "./permissions";
import { detectPublicationState } from "./detection";
import { deliverPublishedWebsite } from "./delivery";
import {
  getOwnedPublishStructure,
  PublishStorageConflictError,
  savePublishStructure,
} from "./storage";
import {
  incrementQueuedDuplicateRequest,
  markPublishFailure,
  markPublishNoOp,
  markPublished,
  markPublishing,
  normalizeDomainSnapshot,
} from "./state";
import { validatePublishEligibility } from "./validation";
import { createPublicationRequestId, acquirePublicationLock, releasePublicationLock } from "./queue";
import { createCacheInvalidationMetadata } from "./cache";
import { planDeploymentUpdate } from "./versioning";
import type { PublishAction, PublishMutationResponse } from "./types";
import type { WebsiteStructure } from "@/lib/ai/structure";
import { createWebsiteVersionLabel } from "@/lib/versions/model";
import { createWebsiteVersion } from "@/lib/versions/storage";

interface RunPublishWorkflowParams {
  structure: WebsiteStructure;
  userId: string;
  action: PublishAction;
}

function isRetryableError(error: unknown): boolean {
  return error instanceof PipelineError ? error.retryable : true;
}

export async function runPublishWorkflow({
  structure,
  userId,
  action,
}: RunPublishWorkflowParams): Promise<PublishMutationResponse> {
  if (!canUserPublishWebsite(structure, userId)) {
    return {
      ok: false,
      error: "You do not have permission to publish this website.",
    };
  }

  const latestStructure = (await getOwnedPublishStructure(structure.id, userId)) ?? structure;
  const currentDetection = detectPublicationState(latestStructure);

  if (currentDetection.isPublishing) {
    return {
      ok: false,
      error: "A publish operation is already in progress.",
      structure: incrementQueuedDuplicateRequest(latestStructure),
      detection: currentDetection,
    };
  }

  if (action === "update" && currentDetection.neverPublished) {
    return {
      ok: false,
      error: "This website has not been published yet.",
    };
  }

  const validation = validatePublishEligibility(latestStructure);
  if (!validation.eligible) {
    return {
      ok: false,
      validation,
      error: "Website is not eligible for publishing.",
    };
  }

  const requestedAt = new Date().toISOString();
  const requestId = createPublicationRequestId(latestStructure.id, action, requestedAt);
  const updatePlan = planDeploymentUpdate(latestStructure, {
    liveFingerprint: latestStructure.publication?.updates?.liveFingerprint,
    includeManualTrigger: action === "update",
  });

  if (action === "update" && !updatePlan.required) {
    const noOpStructure = markPublishNoOp(latestStructure, {
      completedAt: requestedAt,
      action,
      requestId,
      updatePlan,
    });

    try {
      const stored = await savePublishStructure(noOpStructure, {
        expectedUpdatedAt: latestStructure.updatedAt,
      });

      return {
        ok: true,
        structure: stored,
        detection: detectPublicationState(stored),
        validation,
        requestId,
        didDeploy: false,
        message: "No deployment update was required because the live version already matches the current draft.",
      };
    } catch (error) {
      if (error instanceof PublishStorageConflictError) {
        const conflicted = await getOwnedPublishStructure(structure.id, userId);
        return {
          ok: false,
          error: "Another deployment update request won the race. Refresh and try again.",
          structure: conflicted ?? latestStructure,
          detection: conflicted ? detectPublicationState(conflicted) : currentDetection,
          validation,
          requestId,
          didDeploy: false,
        };
      }
      throw error;
    }
  }

  if (!acquirePublicationLock(latestStructure.id)) {
    return {
      ok: false,
      error: "A publish operation is already in progress.",
      structure: incrementQueuedDuplicateRequest(latestStructure),
      detection: currentDetection,
      validation,
      requestId,
    };
  }

  const publishingStructure = markPublishing(latestStructure, {
    attemptedAt: requestedAt,
    action,
    requestId,
    updatePlan,
  });

  try {
    await savePublishStructure(publishingStructure, {
      expectedUpdatedAt: latestStructure.updatedAt,
    });

    const delivery = await deliverPublishedWebsite(publishingStructure);
    const domain = normalizeDomainSnapshot(
      latestStructure.publication?.liveUrl,
      latestStructure.publication?.livePath,
      latestStructure.publication?.deployment?.domains,
      delivery.domain,
    );
    const cache = createCacheInvalidationMetadata({
      action,
      plan: updatePlan,
      staticSite: delivery.staticSite,
      provider: delivery.deployment?.target === "vercel" ? "vercel" : "provider-neutral",
      invalidatedAt: delivery.deliveredAt,
    });
    const publishedStructure = markPublished(publishingStructure, {
      action,
      requestId,
      liveUrl: domain.liveUrl,
      livePath: domain.livePath,
      publishedAt: delivery.deliveredAt,
      updatePlan,
      deployment: delivery.deployment,
      cache,
      domain,
      staticSite: delivery.staticSite,
    });

    const stored = await savePublishStructure(publishedStructure, {
      expectedUpdatedAt: publishingStructure.updatedAt,
    });

    try {
      await createWebsiteVersion({
        structure: stored,
        userId,
        source: action,
        status: "published",
        label: createWebsiteVersionLabel(action, stored),
        requestId,
        comparison: updatePlan,
        deployment: {
          deploymentId: delivery.deploymentId,
          providerDeploymentId: delivery.deployment?.providerDeploymentId,
          environment: delivery.deployment?.environment,
          status: delivery.deployment?.status,
          target: delivery.deployment?.target,
          url: delivery.deployment?.url,
          path: delivery.deployment?.path,
          domains: delivery.domain.domains,
          publishedAt: delivery.deliveredAt,
          liveUrl: domain.liveUrl,
          livePath: domain.livePath,
          publicationVersionId: stored.publication?.updates?.liveVersionId,
        },
      });
    } catch (versionError) {
      logger.error("Published website without creating a website version snapshot", {
        category: "error",
        service: "versions",
        action,
        userId,
        structureId: structure.id,
        requestId,
        error: {
          name: "PublishVersionSnapshotError",
          message: versionError instanceof Error ? versionError.message : "Unknown error",
        },
      });
    }

    logger.info("publish workflow completed", {
      category: "request",
      service: "publish",
      action,
      userId,
      structureId: structure.id,
      liveUrl: domain.liveUrl,
      deploymentId: delivery.deploymentId,
      requestId,
      changeKinds: updatePlan.scope.changeKinds,
      routePaths: cache.affectedPaths,
    });

    return {
      ok: true,
      structure: stored,
      detection: detectPublicationState(stored),
      validation,
      requestId,
      didDeploy: true,
      message:
        action === "publish"
          ? "Website published successfully."
          : updatePlan.scope.metadataOnly
            ? "Live website updated successfully with metadata-only changes."
            : "Live website updated successfully.",
    };
  } catch (error) {
    if (error instanceof PublishStorageConflictError) {
      const conflicted = await getOwnedPublishStructure(structure.id, userId);
      return {
        ok: false,
        error: "Another deployment update request won the race. Refresh and try again.",
        structure: conflicted ?? publishingStructure,
        detection: conflicted ? detectPublicationState(conflicted) : detectPublicationState(publishingStructure),
        validation,
        requestId,
        didDeploy: false,
      };
    }

    const message = error instanceof Error ? error.message : "Unknown publish error";
    const failedAt = new Date().toISOString();
    const failedStructure = markPublishFailure(publishingStructure, {
      failureRecordedAt: failedAt,
      action,
      requestId,
      errorMessage: message,
      retryable: isRetryableError(error),
      updatePlan,
    });

    try {
      await savePublishStructure(failedStructure, {
        expectedUpdatedAt: publishingStructure.updatedAt,
      });
    } catch {
      // no-op: preserve original error path
    }

    logger.error("publish workflow failed", {
      category: "error",
      service: "publish",
      action,
      userId,
      structureId: structure.id,
      requestId,
      changeKinds: updatePlan.scope.changeKinds,
      retryable: isRetryableError(error),
      error: {
        name: "PublishWorkflowError",
        message,
      },
    });

    return {
      ok: false,
      error: message,
      structure: failedStructure,
      detection: detectPublicationState(failedStructure),
      validation,
      requestId,
      didDeploy: false,
    };
  } finally {
    releasePublicationLock(latestStructure.id);
  }
}
