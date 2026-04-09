"use client";

import { useEffect, useMemo, useState } from "react";
import {
  WIZARD_FORM_STEPS,
  WIZARD_STORAGE_KEY,
  createInitialWizardState,
  getFormStepIndex,
  getNextFormStep,
  getPreviousFormStep,
  mapStructureIdToOutputPath,
  mapWizardInputToGenerationInput,
  mergeWizardInput,
  normalizeList,
  validateReviewStep,
  validateWizardStep,
  wizardPipelineEndpoints,
  type ContentGenerationResponse,
  type StructureGenerationResponse,
  type WebsiteCreationWizardState,
  type WebsiteWizardInput,
  type WizardStepId,
} from "@/lib/wizard";
import { WizardShell } from "./wizard-shell";
import { WizardProgress } from "./wizard-progress";
import { WizardStepper } from "./wizard-stepper";
import { WizardNavigation } from "./wizard-navigation";
import { WizardReview } from "./wizard-review";
import { WizardLoading } from "./wizard-loading";
import { WizardSuccess } from "./wizard-success";
import { StepBusinessInfo } from "./steps/step-business-info";
import { StepContentInput } from "./steps/step-content-input";
import { StepStyleTheme } from "./steps/step-style-theme";
import { StepWebsiteType } from "./steps/step-website-type";

const loadingLabels: Record<string, string> = {
  preparing: "Preparing your input package…",
  structure: "Generating structure and layout…",
  content: "Generating content and final metadata…",
  finalizing: "Finalizing your generated website…",
};

function splitEscapedPipes(value: string): string[] {
  const segments: string[] = [];
  let current = "";
  let escaped = false;

  for (const char of value) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === "|") {
      segments.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  segments.push(current.trim());
  return segments;
}

function parseTestimonials(value: string): WebsiteWizardInput["testimonials"] {
  return normalizeList(value.split("\n")).map((line) => {
    const [quote, author, ...roleParts] = splitEscapedPipes(line);
    return {
      quote: quote || "",
      author: author || "",
      role: roleParts.length ? roleParts.join(" | ") : undefined,
    };
  });
}

function isRestorableWizardState(value: unknown): value is WebsiteCreationWizardState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<WebsiteCreationWizardState>;
  if (!candidate.data || typeof candidate.data !== "object") {
    return false;
  }

  return typeof candidate.currentStep === "string" && typeof candidate.data.brandName === "string";
}

export function WebsiteCreationWizard() {
  const [state, setState] = useState<WebsiteCreationWizardState>(createInitialWizardState());
  const [loadingStage, setLoadingStage] = useState<keyof typeof loadingLabels>("preparing");

  useEffect(() => {
    const cached = window.localStorage.getItem(WIZARD_STORAGE_KEY);
    if (!cached) {
      return;
    }

    try {
      const parsed = JSON.parse(cached) as WebsiteCreationWizardState;
      if (isRestorableWizardState(parsed)) {
        setState({
          ...parsed,
          generationStatus: "idle",
          currentStep: parsed.currentStep === "loading" ? "review-confirm" : parsed.currentStep,
        });
      }
    } catch {
      window.localStorage.removeItem(WIZARD_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (state.currentStep === "success") {
      return;
    }

    window.localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const currentStepDefinition = WIZARD_FORM_STEPS.find((step) => step.id === state.currentStep);
  const currentStepIndex = Math.max(getFormStepIndex(state.currentStep), 0);

  const stepErrors = state.stepErrors[state.currentStep] || [];
  const generationError = state.generationResult?.error;

  const servicesText = useMemo(() => state.data.services.join("\n"), [state.data.services]);
  const testimonialsText = useMemo(
    () =>
      state.data.testimonials
        .map((item) => [item.quote, item.author, item.role].filter(Boolean).join(" | "))
        .join("\n"),
    [state.data.testimonials],
  );
  const socialLinksText = useMemo(
    () => state.data.contactInfo.socialLinks?.join("\n") ?? "",
    [state.data.contactInfo.socialLinks],
  );
  const constraintsText = useMemo(() => state.data.constraints.join("\n"), [state.data.constraints]);

  function updateData(patch: Partial<WebsiteWizardInput>) {
    setState((current) => ({
      ...current,
      data: mergeWizardInput(current.data, patch),
      stepErrors: {
        ...current.stepErrors,
        [current.currentStep]: undefined,
      },
      generationResult: current.generationStatus === "error" ? undefined : current.generationResult,
      generationStatus: current.generationStatus === "error" ? "idle" : current.generationStatus,
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

  async function generateWebsite() {
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

    setLoadingStage("preparing");
    setState((current) => ({
      ...current,
      generationStatus: "submitting",
      currentStep: "loading",
      completedSteps: markStepComplete("review-confirm", current),
      generationResult: undefined,
    }));

    try {
      const generationInput = mapWizardInputToGenerationInput(state.data);

      setLoadingStage("structure");
      const structureResponse = await fetch(wizardPipelineEndpoints.generateStructure, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generationInput),
      });

      const structureBody = (await structureResponse.json()) as StructureGenerationResponse;
      if (!structureResponse.ok || !structureBody.structure?.id) {
        throw new Error(structureBody.error || structureBody.message || "Structure generation failed.");
      }
      const structureId = structureBody.structure.id;

      setLoadingStage("content");
      const contentResponse = await fetch(wizardPipelineEndpoints.generateContent, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          structureId,
        }),
      });

      const contentBody = (await contentResponse.json()) as ContentGenerationResponse;
      if (!contentResponse.ok) {
        throw new Error(contentBody.error || contentBody.message || "Content generation failed.");
      }

      setLoadingStage("finalizing");
      const generatedSitePath = mapStructureIdToOutputPath(structureId);

      setState((current) => ({
        ...current,
        generationStatus: "success",
        currentStep: "success",
        completedSteps: markStepComplete("loading", current),
        generationResult: {
          structureId,
          generatedSitePath,
          completedAt: new Date().toISOString(),
        },
      }));

      window.localStorage.removeItem(WIZARD_STORAGE_KEY);
    } catch (error) {
      const message =
        error instanceof TypeError
          ? "Network issue detected. Check your connection and try again."
          : error instanceof Error
            ? error.message
            : "Generation failed. Please try again.";
      setState((current) => ({
        ...current,
        generationStatus: "error",
        currentStep: "review-confirm",
        generationResult: {
          error: message,
        },
      }));
    }
  }

  function resetWizard() {
    setState(createInitialWizardState());
    setLoadingStage("preparing");
    window.localStorage.removeItem(WIZARD_STORAGE_KEY);
  }

  return (
    <WizardShell>
      {state.currentStep === "loading" ? <WizardLoading stageLabel={loadingLabels[loadingStage]} /> : null}

      {state.currentStep === "success" ? (
        <WizardSuccess
          generatedSitePath={state.generationResult?.generatedSitePath}
          onCreateAnother={resetWizard}
        />
      ) : null}

      {state.currentStep !== "loading" && state.currentStep !== "success" ? (
        <>
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

          {stepErrors.length > 0 ? (
            <div className="wizard-error" role="alert">
              {stepErrors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}

          {generationError ? (
            <div className="wizard-error" role="alert">
              <p>{generationError}</p>
            </div>
          ) : null}

          {state.currentStep === "website-type" ? (
            <StepWebsiteType
              value={state.data.websiteType}
              onChange={(value) => updateData({ websiteType: value })}
            />
          ) : null}

          {state.currentStep === "business-info" ? (
            <StepBusinessInfo
              data={state.data}
              servicesText={servicesText}
              onFieldChange={updateData}
              onServicesTextChange={(value) => updateData({ services: normalizeList(value.split("\n")) })}
            />
          ) : null}

          {state.currentStep === "style-theme" ? (
            <StepStyleTheme data={state.data} onFieldChange={updateData} />
          ) : null}

          {state.currentStep === "content-input" ? (
            <StepContentInput
              data={state.data}
              testimonialsText={testimonialsText}
              socialLinksText={socialLinksText}
              constraintsText={constraintsText}
              onFieldChange={updateData}
              onTestimonialsChange={(value) => updateData({ testimonials: parseTestimonials(value) })}
              onSocialLinksChange={(value) =>
                updateData({
                  contactInfo: {
                    ...state.data.contactInfo,
                    socialLinks: normalizeList(value.split("\n")),
                  },
                })
              }
              onConstraintsChange={(value) => updateData({ constraints: normalizeList(value.split("\n")) })}
            />
          ) : null}

          {state.currentStep === "review-confirm" ? (
            <>
              <WizardReview
                data={state.data}
                onEditStep={(stepId) => setState((current) => ({ ...current, currentStep: stepId }))}
                onGenerate={generateWebsite}
                isSubmitting={state.generationStatus === "submitting"}
              />

              <div className="wizard-navigation">
                <button type="button" onClick={handleBack}>
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
        </>
      ) : null}
    </WizardShell>
  );
}
