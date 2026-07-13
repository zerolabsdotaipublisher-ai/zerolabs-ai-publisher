import type { WebsiteWizardInput } from "@/lib/wizard";
import type {
  GenerationFailedStage,
  GenerationSafeErrorCategory,
} from "./diagnostics";

export type GenerationStage = "preparing" | "structure" | "content" | "finalizing";
export type GenerationRunStatus = "idle" | "validating" | "running" | "success" | "error";
export type GenerationDiagnosticCode =
  | "UNAUTHORIZED"
  | "INVALID_JSON"
  | "INVALID_INPUT"
  | "STRUCTURE_ID_REQUIRED"
  | "STRUCTURE_NOT_FOUND"
  | "OPENAI_RATE_LIMITED"
  | "OPENAI_AUTH_INVALID"
  | "OPENAI_REQUEST_REJECTED"
  | "OPENAI_UPSTREAM_ERROR"
  | "SUPABASE_SCHEMA_MISSING"
  | "SUPABASE_STORAGE_ERROR"
  | "GENERATION_INTERNAL_ERROR"
  | "RETRY_UNAVAILABLE";

export interface GenerationInterfaceResult {
  structureId?: string;
  generatedSitePath?: string;
  completedAt?: string;
  error?: string;
  diagnosticCode?: GenerationDiagnosticCode;
  requestId?: string;
  failedStage?: GenerationFailedStage;
  safeErrorCategory?: GenerationSafeErrorCategory;
}

export interface GenerationInterfaceState {
  input: WebsiteWizardInput;
  lastSubmittedInput?: WebsiteWizardInput;
  validationErrors: string[];
  submissionStatus: GenerationRunStatus;
  stage: GenerationStage;
  result?: GenerationInterfaceResult;
  retryCount: number;
  isEditingInputs: boolean;
}

export interface GenerationSubmissionSuccess {
  ok: true;
  structureId: string;
  generatedSitePath: string;
}

export interface GenerationSubmissionFailure {
  ok: false;
  error: string;
  structureId?: string;
  generatedSitePath?: string;
  diagnosticCode?: GenerationDiagnosticCode;
  requestId?: string;
  failedStage?: GenerationFailedStage;
  safeErrorCategory?: GenerationSafeErrorCategory;
}

export type GenerationSubmissionResult =
  | GenerationSubmissionSuccess
  | GenerationSubmissionFailure;
