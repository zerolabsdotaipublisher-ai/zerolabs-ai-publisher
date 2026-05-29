"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createDefaultWizardInput,
  mergeWizardInput,
  normalizeDesignConfig,
  normalizeList,
} from "@/lib/wizard";
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
import type { WebsiteWizardInput, WebsiteWizardInputPatch } from "@/lib/wizard";
import { GenerationInputPanel } from "./generation-input-panel";
import { GenerationLayout } from "./generation-layout";
import { WebsiteBuilderPreviewPanel } from "./website-builder-preview-panel";

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

interface WebsiteGenerationInterfaceProps {
  entryPoint?: "create" | "generate";
}

export function WebsiteGenerationInterface({
  entryPoint = "create",
}: WebsiteGenerationInterfaceProps) {
  const [state, setState] = useState<GenerationInterfaceState>(() => {
    if (typeof window === "undefined") {
      return createInitialGenerationState();
    }

    const cachedGenerationState = window.localStorage.getItem(GENERATION_STORAGE_KEY);
    if (cachedGenerationState) {
      try {
        const parsed = JSON.parse(cachedGenerationState) as GenerationInterfaceState;
        if (parsed?.input) {
          return {
            ...parsed,
            input: mergeWizardInput(createDefaultWizardInput(), {
              ...parsed.input,
              designConfig: {
                pages: normalizeDesignConfig(parsed.input.designConfig).pages,
              },
            }),
          };
        }
      } catch {
        window.localStorage.removeItem(GENERATION_STORAGE_KEY);
      }
    }

    const cachedWizardState = window.localStorage.getItem(WIZARD_STORAGE_KEY);
    if (!cachedWizardState) {
      return createInitialGenerationState();
    }

    try {
      const parsed = JSON.parse(cachedWizardState) as unknown;
      const mappedInput = extractWizardInput(parsed);
      return mappedInput ? createInitialGenerationState(mappedInput) : createInitialGenerationState();
    } catch {
      window.localStorage.removeItem(WIZARD_STORAGE_KEY);
      return createInitialGenerationState();
    }
  });
  const [activePageId, setActivePageId] = useState<string | null>(
    state.input.designConfig.pages[0]?.id ?? null,
  );

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
  const readinessErrors = useMemo(() => validateGenerationInput(state.input), [state.input]);
  const activePage = useMemo(
    () =>
      state.input.designConfig.pages.find((page) => page.id === activePageId) ??
      state.input.designConfig.pages[0],
    [activePageId, state.input.designConfig.pages],
  );
  const activePageIndex = useMemo(() => {
    if (!activePage) {
      return 0;
    }

    const index = state.input.designConfig.pages.findIndex((page) => page.id === activePage.id);
    return index === -1 ? 0 : index;
  }, [activePage, state.input.designConfig.pages]);

  function updateInput(patch: WebsiteWizardInputPatch) {
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

    const nextRetryCount = isRetry ? state.retryCount + 1 : state.retryCount;

    setState((current) => ({
      ...current,
      submissionStatus: "running",
      validationErrors: [],
      stage: "preparing",
      result: undefined,
      isEditingInputs: false,
      retryCount: nextRetryCount,
    }));

    if (isRetry) {
      void trackGenerationEvent({
        event: "generation_retry_clicked",
        retryCount: nextRetryCount,
      });
    }

    void trackGenerationEvent({ event: "generation_started", retryCount: nextRetryCount });

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
        isEditingInputs: true,
      }));
      void trackGenerationEvent({
        event: "generation_failed",
        status: "error",
        message: result.error,
        retryCount: nextRetryCount,
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
      retryCount: nextRetryCount,
    });
  }

  function handleReviewInputs() {
    setState((current) => {
      const errors = validateGenerationInput(current.input);

      return {
        ...current,
        validationErrors: errors,
        submissionStatus: errors.length > 0 ? "validating" : current.submissionStatus,
        isEditingInputs: errors.length > 0 ? true : false,
      };
    });
  }

  function handleEdit() {
    setState((current) => ({
      ...current,
      isEditingInputs: true,
    }));
    void trackGenerationEvent({ event: "generation_edit_inputs_clicked" });
  }

  function handlePreviewClick() {
    void trackGenerationEvent({
      event: "generation_preview_opened",
      structureId: state.result?.structureId,
      status: state.submissionStatus,
    });
  }

  const title = entryPoint === "generate" ? "Generate website" : "Create website";
  const description =
    entryPoint === "generate"
      ? "Review or refine the saved builder inputs, then generate and continue to preview."
      : "Set up pages on the left, then generate, review status, and continue to preview on the right.";

  return (
    <GenerationLayout
      title={title}
      description={description}
      builderPanel={
        <GenerationInputPanel
          data={state.input}
          servicesText={servicesText}
          testimonialsText={testimonialsText}
          socialLinksText={socialLinksText}
          constraintsText={constraintsText}
          errors={state.validationErrors}
          isEditing={state.isEditingInputs}
          activePageId={activePageId ?? undefined}
          onActivePageChange={setActivePageId}
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
      previewPanel={
        <WebsiteBuilderPreviewPanel
          state={state}
          activePage={activePage}
          activePageIndex={activePageIndex}
          totalPages={state.input.designConfig.pages.length}
          readinessErrors={readinessErrors}
          onGenerate={() => void runGeneration(false)}
          onRetry={() => void runGeneration(true)}
          onReviewInputs={handleReviewInputs}
          onEditInputs={handleEdit}
          onPreviewClick={handlePreviewClick}
        />
      }
    />
  );
}
