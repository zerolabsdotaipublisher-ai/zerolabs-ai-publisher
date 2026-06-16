import {
  createDefaultWizardInput,
  inferWebsiteTypeFromPages,
  syncDesignPages,
} from "./schemas";
import { WIZARD_FORM_STEPS } from "./steps";
import type {
  WebsiteCreationWizardState,
  WebsiteWizardInput,
  WebsiteWizardInputPatch,
  WizardStepId,
} from "./types";

export const WIZARD_STORAGE_KEY = "zlai.websiteCreationWizard";

const formStepIds = WIZARD_FORM_STEPS.map((step) => step.id);

function stripLegacyWizardFields(
  patch: WebsiteWizardInputPatch,
): WebsiteWizardInputPatch {
  const rest = {
    ...patch,
  } as WebsiteWizardInputPatch & {
    testimonials?: unknown;
  };

  if ("testimonials" in rest) {
    delete rest.testimonials;
  }

  return rest;
}

export function createInitialWizardState(): WebsiteCreationWizardState {
  return {
    currentStep: "page-setup",
    completedSteps: [],
    data: createDefaultWizardInput(),
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
  patch: WebsiteWizardInputPatch,
): WebsiteWizardInput {
  const sanitizedPatch = stripLegacyWizardFields(patch);

  const mergedDesignConfig = sanitizedPatch.designConfig
    ? {
        ...current.designConfig,
        ...sanitizedPatch.designConfig,
        pages: sanitizedPatch.designConfig.pages ?? current.designConfig.pages,
      }
    : current.designConfig;

  const normalizedPages = syncDesignPages(mergedDesignConfig.pages, mergedDesignConfig.pages.length);
  const inferredWebsiteType = inferWebsiteTypeFromPages(normalizedPages);

  return {
    ...current,
    ...sanitizedPatch,
    founderProfile: {
      ...current.founderProfile,
      ...sanitizedPatch.founderProfile,
    },
    contactInfo: {
      ...current.contactInfo,
      ...sanitizedPatch.contactInfo,
      socialLinks: sanitizedPatch.contactInfo?.socialLinks ?? current.contactInfo.socialLinks,
    },
    services: sanitizedPatch.services ?? current.services,
    constraints: sanitizedPatch.constraints ?? current.constraints,
    websiteType: sanitizedPatch.websiteType ?? inferredWebsiteType,
    designConfig: {
      pages: normalizedPages,
    },
  };
}

export function normalizeList(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}
