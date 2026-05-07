import "server-only";

import { logger } from "@/lib/observability";
import type { ManualOverrideExecutionResult } from "./types";

export async function emitManualOverrideNotification(input: {
  userId: string;
  result: ManualOverrideExecutionResult;
}): Promise<void> {
  logger.info("manual publish override used", {
    category: "request",
    service: "publish_override",
    userId: input.userId,
    structureId: input.result.structureId,
    contentId: input.result.contentId,
    socialPostId: input.result.socialPostId,
    targetContentId: input.result.targetContentId,
    targetContentType: input.result.targetContentType,
    requestId: input.result.requestId,
    scenario: input.result.scenario,
    bypassedWorkflows: input.result.bypassedWorkflows,
    approvalBypassed: input.result.approvalBypassed,
    status: input.result.ok ? "succeeded" : "failed",
    message: input.result.message,
    error: input.result.error
      ? {
          name: "ManualPublishOverrideError",
          message: input.result.error,
        }
      : undefined,
  });
}
