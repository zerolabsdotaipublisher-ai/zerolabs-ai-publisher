import "server-only";

import { logger, metrics } from "@/lib/observability";
import type { PipelineEvent, PipelineObserver } from "./types";

function logPipelineEvent(event: PipelineEvent): void {
  const isFailure = event.event === "pipeline_deployment_failed";
  const message = `pipeline ${event.event}`;
  const { error, ...eventMeta } = event;

  if (event.durationMs !== undefined) {
    metrics.recordDuration(`pipeline.${event.event}`, event.durationMs);
  }

  if (isFailure) {
    metrics.increment("errorCount");
    logger.error(message, {
      category: "error",
      service: "pipeline",
      ...eventMeta,
      pipelineError: error,
      error: {
        name: "PipelineError",
        message: error ?? event.message ?? "Pipeline deployment failed",
      },
    });
    return;
  }

  logger.info(message, {
    category: "request",
    service: "pipeline",
    ...eventMeta,
    pipelineError: error,
  });
}

export const loggingPipelineObserver: PipelineObserver = {
  onEvent(event) {
    logPipelineEvent(event);
  },
};

export async function emitPipelineEvent(
  event: PipelineEvent,
  observer: PipelineObserver | undefined,
): Promise<void> {
  logPipelineEvent(event);

  if (observer) {
    await observer.onEvent(event);
  }
}
