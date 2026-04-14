import type { PipelineValidationResult } from "./types";

export class PipelineError extends Error {
  readonly code: string;
  readonly retryable: boolean;

  constructor(message: string, params: { code: string; retryable?: boolean }) {
    super(message);
    this.name = "PipelineError";
    this.code = params.code;
    this.retryable = params.retryable ?? false;
  }
}

export class PipelineValidationError extends PipelineError {
  readonly validation: PipelineValidationResult;

  constructor(validation: PipelineValidationResult) {
    super(`Pipeline validation failed: ${validation.errors.join("; ")}`, {
      code: "PIPELINE_VALIDATION_FAILED",
      retryable: false,
    });
    this.name = "PipelineValidationError";
    this.validation = validation;
  }
}

export class PipelineDeploymentError extends PipelineError {
  constructor(message: string, params?: { retryable?: boolean }) {
    super(message, {
      code: "PIPELINE_DEPLOYMENT_FAILED",
      retryable: params?.retryable ?? true,
    });
    this.name = "PipelineDeploymentError";
  }
}

export function normalizePipelineError(error: unknown): PipelineError {
  if (error instanceof PipelineError) {
    return error;
  }

  if (error instanceof Error) {
    return new PipelineDeploymentError(error.message);
  }

  return new PipelineDeploymentError(String(error));
}
