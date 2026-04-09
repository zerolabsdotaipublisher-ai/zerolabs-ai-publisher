import {
  mapWizardInputToGenerationInput,
  mapStructureIdToOutputPath,
  WIZARD_STORAGE_KEY,
  type WebsiteCreationWizardState,
  type WebsiteWizardInput,
} from "@/lib/wizard";

export { mapWizardInputToGenerationInput, mapStructureIdToOutputPath, WIZARD_STORAGE_KEY };

export function isRestorableWizardState(value: unknown): value is WebsiteCreationWizardState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<WebsiteCreationWizardState>;
  return Boolean(
    candidate.data &&
      typeof candidate.data === "object" &&
      typeof candidate.currentStep === "string" &&
      typeof candidate.data.brandName === "string",
  );
}

export function extractWizardInput(value: unknown): WebsiteWizardInput | null {
  if (!isRestorableWizardState(value)) {
    return null;
  }

  return value.data;
}
