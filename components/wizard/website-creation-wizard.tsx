"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/config/routes";
import {
  WIZARD_FORM_STEPS,
  WIZARD_STORAGE_KEY,
  createInitialWizardState,
  getFormStepIndex,
  getNextFormStep,
  getPreviousFormStep,
  mergeWizardInput,
  restoreWizardInput,
  validateReviewStep,
  validateWizardStep,
  type WebsiteCreationWizardState,
  type WebsiteWizardInputPatch,
  type WizardStepId,
} from "@/lib/wizard";
import { WizardShell } from "./wizard-shell";
import { WizardProgress } from "./wizard-progress";
import { WizardStepper } from "./wizard-stepper";
import { WizardNavigation } from "./wizard-navigation";
import { WizardReview } from "./wizard-review";
import { StepPageDesign } from "./steps/step-page-design";
import { StepPagesSetup } from "./steps/step-pages-setup";
import { StepWebsiteIdentity } from "./steps/step-website-identity";

function normalizeWizardStepId(stepId: string): WizardStepId {
  switch (stepId) {
    case "website-type":
      return "page-setup";
    case "business-info":
    case "style-theme":
    case "content-input":
      return "brand-content";
    case "page-setup":
    case "page-design":
    case "brand-content":
    case "review-confirm":
    case "loading":
    case "success":
      return stepId;
    default:
      return "page-setup";
  }
}

function isRestorableWizardState(value: unknown): value is WebsiteCreationWizardState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<WebsiteCreationWizardState>;
  if (!candidate.data || typeof candidate.data !== "object") {
    return false;
  }

  return typeof candidate.currentStep === "string";
}

function normalizeCompletedWizardSteps(value: unknown): WizardStepId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const allowedStepIds = new Set(WIZARD_FORM_STEPS.map((step) => step.id));
  const completedSteps: WizardStepId[] = [];

  value.forEach((stepId) => {
    if (typeof stepId !== "string") {
      return;
    }

    const normalizedStepId = normalizeWizardStepId(stepId);
    if (!allowedStepIds.has(normalizedStepId) || completedSteps.includes(normalizedStepId)) {
      return;
    }

    completedSteps.push(normalizedStepId);
  });

  return completedSteps;
}

export function WebsiteCreationWizard() {
  const router = useRouter();
  const [state, setState] = useState<WebsiteCreationWizardState>(() => {
    if (typeof window === "undefined") {
      return createInitialWizardState();
    }

    const cached = window.localStorage.getItem(WIZARD_STORAGE_KEY);
    if (!cached) {
      return createInitialWizardState();
    }

    try {
      const parsed = JSON.parse(cached) as WebsiteCreationWizardState;
      if (!isRestorableWizardState(parsed)) {
        return createInitialWizardState();
      }

      const restoredInput = restoreWizardInput(parsed.data);
      if (!restoredInput) {
        return createInitialWizardState();
      }

      return {
        currentStep:
          parsed.currentStep === "loading" || parsed.currentStep === "success"
            ? "review-confirm"
            : normalizeWizardStepId(parsed.currentStep),
        completedSteps: normalizeCompletedWizardSteps(parsed.completedSteps),
        data: restoredInput,
        stepErrors: {},
        generationStatus: "idle",
      };
    } catch {
      window.localStorage.removeItem(WIZARD_STORAGE_KEY);
      return createInitialWizardState();
    }
  });

  useEffect(() => {
    window.localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const currentStepDefinition = WIZARD_FORM_STEPS.find((step) => step.id === state.currentStep);
  const currentStepIndex = Math.max(getFormStepIndex(state.currentStep), 0);

  const stepErrors = state.stepErrors[state.currentStep] || [];

  function updateData(patch: WebsiteWizardInputPatch) {
    setState((current) => ({
      ...current,
      data: mergeWizardInput(current.data, patch),
      stepErrors: {
        ...current.stepErrors,
        [current.currentStep]: undefined,
      },
      generationResult: undefined,
      generationStatus: "idle",
    }));
  }

  function markStepComplete(stepId: WizardStepId, current: WebsiteCreationWizardState): WizardStepId[] {
    if (current.completedSteps.includes(stepId)) {
      return current.completedSteps;
    }

    return [...current.completedSteps, stepId];
  }

  function handleNext() {
    const errors = validateWizardStep(state.currentStep, state.data);

    if (errors.length > 0) {
      setState((current) => ({
        ...current,
        stepErrors: {
          ...current.stepErrors,
          [current.currentStep]: errors,
        },
      }));
      return;
    }

    const nextStep = getNextFormStep(state.currentStep);
    if (!nextStep) {
      return;
    }

    setState((current) => ({
      ...current,
      currentStep: nextStep,
      completedSteps: markStepComplete(current.currentStep, current),
    }));
  }

  function handleBack() {
    const previousStep = getPreviousFormStep(state.currentStep);
    if (!previousStep) {
      return;
    }

    setState((current) => ({
      ...current,
      currentStep: previousStep,
    }));
  }

  function handleSkip() {
    const nextStep = getNextFormStep(state.currentStep);
    if (!nextStep) {
      return;
    }

    setState((current) => ({
      ...current,
      currentStep: nextStep,
      completedSteps: markStepComplete(current.currentStep, current),
      stepErrors: {
        ...current.stepErrors,
        [current.currentStep]: undefined,
      },
    }));
  }

  function handleOpenGenerationInterface() {
    const errors = validateReviewStep(state.data);
    if (errors.length > 0) {
      setState((current) => ({
        ...current,
        stepErrors: {
          ...current.stepErrors,
          "review-confirm": errors,
        },
      }));
      return;
    }

    setState((current) => ({
      ...current,
      generationStatus: "submitting",
      completedSteps: markStepComplete("review-confirm", current),
    }));

    router.push(routes.generateWebsite);
  }

  return (
    <WizardShell>
      <WizardProgress
        current={currentStepIndex + 1}
        total={WIZARD_FORM_STEPS.length}
        label={currentStepDefinition?.title || "Create website"}
      />

      <WizardStepper
        steps={WIZARD_FORM_STEPS}
        currentStep={state.currentStep}
        completedSteps={state.completedSteps}
      />

      {stepErrors.length > 0 && state.currentStep !== "brand-content" ? (
        <div className="wizard-error" role="alert">
          {stepErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}

      {state.currentStep === "page-setup" ? (
        <StepPagesSetup
          value={state.data.designConfig}
          onChange={(value) => updateData({ designConfig: value })}
        />
      ) : null}

      {state.currentStep === "page-design" ? (
        <StepPageDesign
          value={state.data.designConfig}
          onChange={(value) => updateData({ designConfig: value })}
        />
      ) : null}

      {state.currentStep === "brand-content" ? (
        <StepWebsiteIdentity data={state.data} errors={stepErrors} onFieldChange={updateData} />
      ) : null}

      {state.currentStep === "review-confirm" ? (
        <>
          <WizardReview
            data={state.data}
            onEditStep={(stepId) => setState((current) => ({ ...current, currentStep: stepId }))}
            onGenerate={handleOpenGenerationInterface}
            isSubmitting={state.generationStatus === "submitting"}
          />

          <div className="wizard-navigation">
            <button type="button" className="wizard-button-secondary" onClick={handleBack}>
              Back
            </button>
          </div>
        </>
      ) : (
        <WizardNavigation
          canBack={currentStepIndex > 0}
          canSkip={Boolean(currentStepDefinition?.skippable)}
          onBack={handleBack}
          onSkip={handleSkip}
          onNext={handleNext}
        />
      )}
    </WizardShell>
  );
}
