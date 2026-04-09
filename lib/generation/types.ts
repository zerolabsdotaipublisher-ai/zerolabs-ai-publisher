import type { WebsiteWizardInput } from "@/lib/wizard";

export type GenerationStage = "preparing" | "structure" | "content" | "finalizing";
export type GenerationRunStatus = "idle" | "validating" | "running" | "success" | "error";

export interface GenerationInterfaceResult {
  structureId?: string;
  generatedSitePath?: string;
  completedAt?: string;
  error?: string;
}

export interface GenerationInterfaceState {
  input: WebsiteWizardInput;
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
}

export type GenerationSubmissionResult =
  | GenerationSubmissionSuccess
  | GenerationSubmissionFailure;
