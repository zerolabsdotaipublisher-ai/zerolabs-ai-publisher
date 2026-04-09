import { defaultWizardInput } from "./schemas";
import { WIZARD_FORM_STEPS } from "./steps";
import type {
  WebsiteCreationWizardState,
  WebsiteWizardInput,
  WizardStepId,
} from "./types";

export const WIZARD_STORAGE_KEY = "zlai.websiteCreationWizard";

const formStepIds = WIZARD_FORM_STEPS.map((step) => step.id);

export function createInitialWizardState(): WebsiteCreationWizardState {
  return {
    currentStep: "website-type",
    completedSteps: [],
    data: defaultWizardInput,
    stepErrors: {},
    generationStatus: "idle",
  };
}

export function getFormStepIndex(stepId: WizardStepId): number {
  return formStepIds.indexOf(stepId);
}

export function getNextFormStep(stepId: WizardStepId): WizardStepId | null {
  const currentIndex = getFormStepIndex(stepId);
  if (currentIndex === -1 || currentIndex === formStepIds.length - 1) {
    return null;
  }

  return formStepIds[currentIndex + 1];
}

export function getPreviousFormStep(stepId: WizardStepId): WizardStepId | null {
  const currentIndex = getFormStepIndex(stepId);
  if (currentIndex <= 0) {
    return null;
  }

  return formStepIds[currentIndex - 1];
}

export function mergeWizardInput(
  current: WebsiteWizardInput,
  patch: Partial<WebsiteWizardInput>,
): WebsiteWizardInput {
  return {
    ...current,
    ...patch,
    founderProfile: {
      ...current.founderProfile,
      ...patch.founderProfile,
    },
    contactInfo: {
      ...current.contactInfo,
      ...patch.contactInfo,
      socialLinks: patch.contactInfo?.socialLinks ?? current.contactInfo.socialLinks,
    },
    testimonials: patch.testimonials ?? current.testimonials,
    services: patch.services ?? current.services,
    constraints: patch.constraints ?? current.constraints,
  };
}

export function normalizeList(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}
