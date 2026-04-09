"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultWizardInput, mergeWizardInput, normalizeList } from "@/lib/wizard";
import {
  createInitialGenerationState,
  extractWizardInput,
  GENERATION_STORAGE_KEY,
  submitWebsiteGeneration,
  trackGenerationEvent,
  updateGenerationStage,
  validateGenerationInput,
  WIZARD_STORAGE_KEY,
  type GenerationInterfaceState,
} from "@/lib/generation";
import type { WebsiteWizardInput } from "@/lib/wizard";
import { GenerationActions } from "./generation-actions";
import { GenerationInputPanel } from "./generation-input-panel";
import { GenerationLayout } from "./generation-layout";
import { GenerationStatusPanel } from "./generation-status-panel";

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

export function WebsiteGenerationInterface() {
  const [state, setState] = useState<GenerationInterfaceState>(createInitialGenerationState());

  useEffect(() => {
    const cachedGenerationState = window.localStorage.getItem(GENERATION_STORAGE_KEY);
    if (cachedGenerationState) {
      try {
        const parsed = JSON.parse(cachedGenerationState) as GenerationInterfaceState;
        if (parsed?.input) {
          setState(parsed);
          return;
        }
      } catch {
        window.localStorage.removeItem(GENERATION_STORAGE_KEY);
      }
    }

    const cachedWizardState = window.localStorage.getItem(WIZARD_STORAGE_KEY);
    if (!cachedWizardState) {
      return;
    }

    try {
      const parsed = JSON.parse(cachedWizardState) as unknown;
      const mappedInput = extractWizardInput(parsed);
      if (mappedInput) {
        setState(createInitialGenerationState(mappedInput));
      }
    } catch {
      window.localStorage.removeItem(WIZARD_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(GENERATION_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const servicesText = useMemo(() => state.input.services.join("\n"), [state.input.services]);
  const testimonialsText = useMemo(
    () =>
      state.input.testimonials
        .map((item) => [item.quote, item.author, item.role].filter(Boolean).join(" | "))
        .join("\n"),
    [state.input.testimonials],
  );
  const socialLinksText = useMemo(
    () => state.input.contactInfo.socialLinks?.join("\n") ?? "",
    [state.input.contactInfo.socialLinks],
  );
  const constraintsText = useMemo(() => state.input.constraints.join("\n"), [state.input.constraints]);

  function updateInput(patch: Partial<WebsiteWizardInput>) {
    setState((current) => ({
      ...current,
      input: mergeWizardInput(current.input, patch),
      validationErrors: [],
      result: current.submissionStatus === "error" ? undefined : current.result,
      submissionStatus: current.submissionStatus === "error" ? "idle" : current.submissionStatus,
    }));
  }

  async function runGeneration(isRetry = false) {
    const errors = validateGenerationInput(state.input);
    if (errors.length > 0) {
      setState((current) => ({
        ...current,
        submissionStatus: "validating",
        validationErrors: errors,
        isEditingInputs: true,
      }));
      return;
    }

    setState((current) => ({
      ...current,
      submissionStatus: "running",
      validationErrors: [],
      stage: "preparing",
      result: undefined,
      isEditingInputs: false,
      retryCount: isRetry ? current.retryCount + 1 : current.retryCount,
    }));

    if (isRetry) {
      void trackGenerationEvent({
        event: "generation_retry_clicked",
        retryCount: state.retryCount + 1,
      });
    }

    void trackGenerationEvent({ event: "generation_started", retryCount: state.retryCount });

    const result = await submitWebsiteGeneration(state.input, {
      onStageChange(stage) {
        setState((current) => updateGenerationStage(current, stage));
      },
    });

    if (!result.ok) {
      setState((current) => ({
        ...current,
        submissionStatus: "error",
        result: {
          error: result.error,
        },
        isEditingInputs: false,
      }));
      void trackGenerationEvent({
        event: "generation_failed",
        status: "error",
        message: result.error,
        retryCount: state.retryCount,
      });
      return;
    }

    setState((current) => ({
      ...current,
      submissionStatus: "success",
      result: {
        structureId: result.structureId,
        generatedSitePath: result.generatedSitePath,
        completedAt: new Date().toISOString(),
      },
      isEditingInputs: false,
    }));

    void trackGenerationEvent({
      event: "generation_completed",
      status: "success",
      structureId: result.structureId,
      retryCount: state.retryCount,
    });
  }

  function handleEdit() {
    setState((current) => ({
      ...current,
      isEditingInputs: true,
    }));
    void trackGenerationEvent({ event: "generation_edit_inputs_clicked" });
  }

  function handleReset() {
    const resetState = createInitialGenerationState(defaultWizardInput);
    setState(resetState);
    window.localStorage.removeItem(GENERATION_STORAGE_KEY);
    window.localStorage.removeItem(WIZARD_STORAGE_KEY);
  }

  return (
    <GenerationLayout
      inputPanel={
        <GenerationInputPanel
          data={state.input}
          servicesText={servicesText}
          testimonialsText={testimonialsText}
          socialLinksText={socialLinksText}
          constraintsText={constraintsText}
          errors={state.validationErrors}
          isEditing={state.isEditingInputs}
          onFieldChange={updateInput}
          onServicesTextChange={(value) => updateInput({ services: normalizeList(value.split("\n")) })}
          onTestimonialsChange={(value) => updateInput({ testimonials: parseTestimonials(value) })}
          onSocialLinksChange={(value) =>
            updateInput({
              contactInfo: {
                ...state.input.contactInfo,
                socialLinks: normalizeList(value.split("\n")),
              },
            })
          }
          onConstraintsChange={(value) => updateInput({ constraints: normalizeList(value.split("\n")) })}
        />
      }
      statusPanel={<GenerationStatusPanel state={state} />}
      actions={
        <GenerationActions
          isRunning={state.submissionStatus === "running"}
          canRetry={state.submissionStatus === "error"}
          canPreview={Boolean(state.result?.generatedSitePath)}
          previewPath={state.result?.generatedSitePath}
          onGenerate={() => void runGeneration(false)}
          onRetry={() => void runGeneration(true)}
          onEdit={handleEdit}
          onReset={handleReset}
          onPreviewClick={() =>
            void trackGenerationEvent({
              event: "generation_preview_opened",
              structureId: state.result?.structureId,
              status: state.submissionStatus,
            })
          }
        />
      }
    />
  );
}
