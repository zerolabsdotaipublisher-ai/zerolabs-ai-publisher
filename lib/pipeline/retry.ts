import "server-only";

import { emitPipelineEvent } from "./observability";
import { normalizePipelineError } from "./errors";
import type { PipelineEvent, PipelineObserver } from "./types";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withPipelineRetry<T>(params: {
  maxAttempts: number;
  retryBaseDelayMs: number;
  observer?: PipelineObserver;
  createRetryEvent: (attempt: number, error: Error, delayMs: number) => PipelineEvent;
  operation: (attempt: number) => Promise<T>;
}): Promise<T> {
  const maxAttempts = Math.max(1, params.maxAttempts);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await params.operation(attempt);
    } catch (error) {
      const pipelineError = normalizePipelineError(error);
      const shouldRetry = pipelineError.retryable && attempt < maxAttempts;

      if (!shouldRetry) {
        throw pipelineError;
      }

      const delayMs = params.retryBaseDelayMs * attempt;
      await emitPipelineEvent(
        params.createRetryEvent(attempt, pipelineError, delayMs),
        params.observer,
      );
      await delay(delayMs);
    }
  }

  throw new Error("Pipeline retry exhausted without returning a result.");
}
