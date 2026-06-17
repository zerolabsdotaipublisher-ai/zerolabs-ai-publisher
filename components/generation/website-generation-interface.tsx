"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createDefaultWizardInput,
  mergeWizardInput,
  normalizeList,
  restoreWizardInput,
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
  type GenerationDiagnosticCode,
  type GenerationInterfaceState,
} from "@/lib/generation";
import type { WebsiteWizardInput, WebsiteWizardInputPatch } from "@/lib/wizard";
import { GenerationInputPanel } from "./generation-input-panel";
import { GenerationLayout } from "./generation-layout";
import { WebsiteBuilderPreviewPanel } from "./website-builder-preview-panel";

interface WebsiteGenerationInterfaceProps {
  entryPoint?: "create" | "generate";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

const SAFE_DIAGNOSTIC_CODES: GenerationDiagnosticCode[] = [
  "UNAUTHORIZED",
  "INVALID_JSON",
  "INVALID_INPUT",
  "STRUCTURE_ID_REQUIRED",
  "STRUCTURE_NOT_FOUND",
  "OPENAI_RATE_LIMITED",
  "OPENAI_AUTH_INVALID",
  "OPENAI_REQUEST_REJECTED",
  "OPENAI_UPSTREAM_ERROR",
  "SUPABASE_SCHEMA_MISSING",
  "SUPABASE_STORAGE_ERROR",
  "GENERATION_INTERNAL_ERROR",
  "RETRY_UNAVAILABLE",
];

function normalizeGenerationStage(value: unknown): GenerationInterfaceState["stage"] {
  return value === "preparing" || value === "structure" || value === "content" || value === "finalizing"
    ? value
    : "preparing";
}

function normalizeSubmissionStatus(value: unknown): GenerationInterfaceState["submissionStatus"] {
  return value === "idle" ||
    value === "validating" ||
    value === "running" ||
    value === "success" ||
    value === "error"
    ? value
    : "idle";
}

function normalizeGenerationResult(value: unknown): GenerationInterfaceState["result"] {
  if (!isRecord(value)) {
    return undefined;
  }

  const diagnosticCode =
    typeof value.diagnosticCode === "string" &&
    SAFE_DIAGNOSTIC_CODES.includes(value.diagnosticCode as GenerationDiagnosticCode)
      ? (value.diagnosticCode as GenerationDiagnosticCode)
      : undefined;

  return {
    structureId: typeof value.structureId === "string" ? value.structureId : undefined,
    generatedSitePath: typeof value.generatedSitePath === "string" ? value.generatedSitePath : undefined,
    completedAt: typeof value.completedAt === "string" ? value.completedAt : undefined,
    error: typeof value.error === "string" ? value.error : undefined,
    diagnosticCode,
    requestId: typeof value.requestId === "string" ? value.requestId : undefined,
  };
}

export function WebsiteGenerationInterface({
  entryPoint = "create",
}: WebsiteGenerationInterfaceProps) {
  const router = useRouter();
  const isSubmissionInFlightRef = useRef(false);
  const [state, setState] = useState<GenerationInterfaceState>(() => {
    if (typeof window === "undefined") {
      return createInitialGenerationState();
    }

    const cachedGenerationState = window.localStorage.getItem(GENERATION_STORAGE_KEY);
    if (cachedGenerationState) {
      try {
        const parsed = JSON.parse(cachedGenerationState) as unknown;
        if (isRecord(parsed)) {
          const restoredInput = restoreWizardInput(parsed.input);
          if (!restoredInput) {
            window.localStorage.removeItem(GENERATION_STORAGE_KEY);
            return createInitialGenerationState();
          }

          return {
            ...createInitialGenerationState(restoredInput),
            input: restoredInput,
            lastSubmittedInput: restoreWizardInput(parsed.lastSubmittedInput) ?? undefined,
            validationErrors: [],
            submissionStatus: normalizeSubmissionStatus(parsed.submissionStatus),
            stage: normalizeGenerationStage(parsed.stage),
            retryCount:
              typeof parsed.retryCount === "number" && Number.isFinite(parsed.retryCount) && parsed.retryCount >= 0
                ? parsed.retryCount
                : 0,
            isEditingInputs:
              typeof parsed.isEditingInputs === "boolean" ? parsed.isEditingInputs : true,
            result: normalizeGenerationResult(parsed.result),
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

  function cloneWizardInput(input: WebsiteWizardInput): WebsiteWizardInput {
    return restoreWizardInput(input) ?? createDefaultWizardInput();
  }

  function preserveRetryTarget(result: GenerationInterfaceState["result"]) {
    if (!result) {
      return undefined;
    }

    if (!result.structureId && !result.generatedSitePath && !result.completedAt) {
      return undefined;
    }

    return {
      ...result,
      error: undefined,
      diagnosticCode: undefined,
      requestId: undefined,
    };
  }

  function updateInput(patch: WebsiteWizardInputPatch) {
    setState((current) => ({
      ...current,
      input: mergeWizardInput(current.input, patch),
      validationErrors: [],
      result:
        current.submissionStatus === "error"
          ? preserveRetryTarget(current.result)
          : current.result,
      submissionStatus: current.submissionStatus === "error" ? "idle" : current.submissionStatus,
    }));
  }

  function setRetryUnavailableState() {
    setState((current) => ({
      ...current,
      submissionStatus: "error",
      result: {
        structureId: current.result?.structureId,
        generatedSitePath: current.result?.generatedSitePath,
        completedAt: current.result?.completedAt,
        error: "Retry is unavailable because no saved valid generation input was found. Review the inputs, then generate again.",
        diagnosticCode: "RETRY_UNAVAILABLE",
        requestId: undefined,
      },
      isEditingInputs: true,
    }));
  }

  async function runGeneration(isRetry = false) {
    if (isSubmissionInFlightRef.current) {
      return;
    }

    const submissionInput = isRetry
      ? (state.lastSubmittedInput ? cloneWizardInput(state.lastSubmittedInput) : null)
      : cloneWizardInput(state.input);

    if (!submissionInput) {
      setRetryUnavailableState();
      return;
    }

    const errors = validateGenerationInput(submissionInput);
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
    const targetStructureId = state.result?.structureId;

    setState((current) => ({
      ...current,
      lastSubmittedInput: submissionInput,
      submissionStatus: "running",
      validationErrors: [],
      stage: "preparing",
      result: undefined,
      isEditingInputs: false,
      retryCount: nextRetryCount,
    }));
    isSubmissionInFlightRef.current = true;

    try {
      if (isRetry) {
        void trackGenerationEvent({
          event: "generation_retry_clicked",
          retryCount: nextRetryCount,
        });
      }

      void trackGenerationEvent({ event: "generation_started", retryCount: nextRetryCount });

      const result = await submitWebsiteGeneration(submissionInput, {
        structureId: targetStructureId,
        onStageChange(stage) {
          setState((current) => updateGenerationStage(current, stage));
        },
      });

      if (!result.ok) {
        setState((current) => ({
          ...current,
          submissionStatus: "error",
          result: {
            structureId: result.structureId ?? current.result?.structureId,
            generatedSitePath: result.generatedSitePath ?? current.result?.generatedSitePath,
            completedAt: current.result?.completedAt,
            error: result.error,
            diagnosticCode: result.diagnosticCode,
            requestId: result.requestId,
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
          diagnosticCode: undefined,
          requestId: undefined,
        },
        isEditingInputs: false,
      }));

      void trackGenerationEvent({
        event: "generation_completed",
        status: "success",
        structureId: result.structureId,
        retryCount: nextRetryCount,
      });
      void trackGenerationEvent({
        event: "generation_preview_opened",
        structureId: result.structureId,
        status: "success",
      });
      router.push(result.generatedSitePath);
    } finally {
      isSubmissionInFlightRef.current = false;
    }
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
      entryPoint={entryPoint}
      builderPanel={
        <GenerationInputPanel
          data={state.input}
          socialLinksText={socialLinksText}
          constraintsText={constraintsText}
          errors={state.validationErrors}
          isEditing={state.isEditingInputs}
          activePageId={activePageId ?? undefined}
          onActivePageChange={setActivePageId}
          onFieldChange={updateInput}
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
