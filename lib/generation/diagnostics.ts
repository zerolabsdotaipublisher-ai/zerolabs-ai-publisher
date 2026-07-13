export type GenerationFailedStage =
  | "auth"
  | "payload-validation"
  | "openai-config"
  | "openai-request"
  | "openai-response-parse"
  | "database-save"
  | "retry-state";

export type GenerationSafeErrorCategory =
  | "session-expired"
  | "payload-invalid"
  | "ai-not-configured"
  | "ai-rate-limited"
  | "ai-request-failed"
  | "ai-response-invalid"
  | "database-save-failed"
  | "retry-state-invalid"
  | "internal";

export const AI_GENERATION_NOT_CONFIGURED_MESSAGE = "AI generation is not configured.";
export const GENERATION_RATE_LIMITED_MESSAGE =
  "Generation is temporarily rate-limited. Please try again soon.";
export const WEBSITE_SETUP_INVALID_MESSAGE =
  "Some website setup data is invalid. Please review your inputs.";
export const WEBSITE_SAVE_FAILED_MESSAGE =
  "Website was generated but could not be saved.";
export const SESSION_EXPIRED_MESSAGE =
  "Your session expired. Please sign in again.";
export const RETRY_STATE_INVALID_MESSAGE =
  "The saved generation state is no longer available. Please start generation again.";
export const GENERATION_GENERIC_FAILURE_MESSAGE =
  "Generation could not be completed right now. Please try again soon.";

interface ResolveGenerationSafeMessageArgs {
  diagnosticCode?: string;
  failedStage?: GenerationFailedStage;
  safeErrorCategory?: GenerationSafeErrorCategory;
  fallback?: string;
}

export function resolveGenerationSafeMessage(
  args: ResolveGenerationSafeMessageArgs,
): string {
  if (
    args.diagnosticCode === "UNAUTHORIZED" ||
    args.safeErrorCategory === "session-expired" ||
    args.failedStage === "auth"
  ) {
    return SESSION_EXPIRED_MESSAGE;
  }

  if (
    args.diagnosticCode === "INVALID_JSON" ||
    args.diagnosticCode === "INVALID_INPUT" ||
    args.safeErrorCategory === "payload-invalid" ||
    args.failedStage === "payload-validation"
  ) {
    return WEBSITE_SETUP_INVALID_MESSAGE;
  }

  if (
    args.diagnosticCode === "OPENAI_AUTH_INVALID" ||
    args.safeErrorCategory === "ai-not-configured" ||
    args.failedStage === "openai-config"
  ) {
    return AI_GENERATION_NOT_CONFIGURED_MESSAGE;
  }

  if (
    args.diagnosticCode === "OPENAI_RATE_LIMITED" ||
    args.safeErrorCategory === "ai-rate-limited"
  ) {
    return GENERATION_RATE_LIMITED_MESSAGE;
  }

  if (
    args.diagnosticCode === "SUPABASE_SCHEMA_MISSING" ||
    args.diagnosticCode === "SUPABASE_STORAGE_ERROR" ||
    args.safeErrorCategory === "database-save-failed" ||
    args.failedStage === "database-save"
  ) {
    return WEBSITE_SAVE_FAILED_MESSAGE;
  }

  if (
    args.diagnosticCode === "RETRY_UNAVAILABLE" ||
    args.diagnosticCode === "STRUCTURE_ID_REQUIRED" ||
    args.diagnosticCode === "STRUCTURE_NOT_FOUND" ||
    args.safeErrorCategory === "retry-state-invalid" ||
    args.failedStage === "retry-state"
  ) {
    return RETRY_STATE_INVALID_MESSAGE;
  }

  if (args.safeErrorCategory === "ai-response-invalid") {
    return GENERATION_GENERIC_FAILURE_MESSAGE;
  }

  if (args.safeErrorCategory === "ai-request-failed") {
    return GENERATION_GENERIC_FAILURE_MESSAGE;
  }

  return args.fallback ?? GENERATION_GENERIC_FAILURE_MESSAGE;
}
