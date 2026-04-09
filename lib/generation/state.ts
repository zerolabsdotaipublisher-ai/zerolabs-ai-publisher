import { defaultWizardInput } from "@/lib/wizard";
import type { WebsiteWizardInput } from "@/lib/wizard";
import type { GenerationInterfaceState, GenerationStage } from "./types";

export const GENERATION_STORAGE_KEY = "zlai.websiteGenerationInterface";

export function createInitialGenerationState(
  input: WebsiteWizardInput = defaultWizardInput,
): GenerationInterfaceState {
  return {
    input,
    validationErrors: [],
    submissionStatus: "idle",
    stage: "preparing",
    retryCount: 0,
    isEditingInputs: true,
  };
}

export function updateGenerationStage(
  state: GenerationInterfaceState,
  stage: GenerationStage,
): GenerationInterfaceState {
  return {
    ...state,
    stage,
  };
}
