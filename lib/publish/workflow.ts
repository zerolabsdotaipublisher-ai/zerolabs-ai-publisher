import "server-only";

import { logger } from "@/lib/observability";
import { canUserPublishWebsite } from "./permissions";
import { detectPublicationState } from "./detection";
import { deliverPublishedWebsite } from "./delivery";
import { savePublishStructure } from "./storage";
import { markPublishFailure, markPublished, markPublishing } from "./state";
import { validatePublishEligibility } from "./validation";
import type { PublishAction, PublishMutationResponse } from "./types";
import type { WebsiteStructure } from "@/lib/ai/structure";

interface RunPublishWorkflowParams {
  structure: WebsiteStructure;
  userId: string;
  action: PublishAction;
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

  const currentDetection = detectPublicationState(structure);

  if (currentDetection.isPublishing) {
    return {
      ok: false,
      error: "A publish operation is already in progress.",
    };
  }

  if (action === "update" && currentDetection.neverPublished) {
    return {
      ok: false,
      error: "This website has not been published yet.",
    };
  }

  const validation = validatePublishEligibility(structure);
  if (!validation.eligible) {
    return {
      ok: false,
      validation,
      error: "Website is not eligible for publishing.",
    };
  }

  const attemptedAt = new Date().toISOString();
  const publishingStructure = markPublishing(structure, attemptedAt);

  try {
    await savePublishStructure(publishingStructure);
    const delivery = await deliverPublishedWebsite(publishingStructure);

    const publishedStructure = markPublished(publishingStructure, {
      liveUrl: delivery.liveUrl,
      livePath: delivery.livePath,
      publishedAt: delivery.deliveredAt,
    });

    const stored = await savePublishStructure(publishedStructure);

    logger.info("publish workflow completed", {
      category: "request",
      service: "publish",
      action,
      userId,
      structureId: structure.id,
      liveUrl: delivery.liveUrl,
      deploymentId: delivery.deploymentId,
    });

    return {
      ok: true,
      structure: stored,
      detection: detectPublicationState(stored),
      validation,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown publish error";
    const failedStructure = markPublishFailure(publishingStructure, attemptedAt, message);

    try {
      await savePublishStructure(failedStructure);
    } catch {
      // no-op: preserve original error path
    }

    logger.error("publish workflow failed", {
      category: "error",
      service: "publish",
      action,
      userId,
      structureId: structure.id,
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
    };
  }
}
