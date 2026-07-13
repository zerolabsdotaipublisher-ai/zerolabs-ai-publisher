import { wizardPipelineEndpoints } from "@/lib/wizard";
import { mapStructureIdToOutputPath, mapWizardInputToGenerationInput } from "./mapping";
import {
  GENERATION_GENERIC_FAILURE_MESSAGE,
  type GenerationFailedStage,
  type GenerationSafeErrorCategory,
  resolveGenerationSafeMessage,
} from "./diagnostics";
import type {
  GenerationDiagnosticCode,
  GenerationStage,
  GenerationSubmissionResult,
} from "./types";
import type {
  ContentGenerationResponse,
  StructureGenerationResponse,
  WebsiteWizardInput,
} from "@/lib/wizard";
import {
  type WebsiteGenerationInput,
  validateWebsiteGenerationInput,
} from "@/lib/ai/prompts";

interface SubmitOptions {
  onStageChange?: (stage: GenerationStage) => void;
  structureId?: string;
}

type SafeGenerationPayload = {
  error?: string;
  message?: string;
  details?: string[];
  diagnosticCode?: GenerationDiagnosticCode;
  requestId?: string;
  failedStage?: GenerationFailedStage;
  safeErrorCategory?: GenerationSafeErrorCategory;
};

function toSafeGenerationMessage(
  payload: SafeGenerationPayload,
  fallback: string,
  status = 0,
): string {
  return resolveGenerationSafeMessage({
    diagnosticCode: payload.diagnosticCode,
    failedStage: payload.failedStage,
    safeErrorCategory:
      payload.safeErrorCategory ??
      (status === 429
        ? "ai-rate-limited"
        : status === 401
          ? "session-expired"
          : status === 400 || status === 422
            ? "payload-invalid"
            : undefined),
    fallback,
  });
}

async function parseJsonResponse<T extends SafeGenerationPayload>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

function createGenerationPayload(input: WebsiteWizardInput): WebsiteGenerationInput {
  return mapWizardInputToGenerationInput(input);
}

function buildFailureResult(args: {
  error: string;
  structureId?: string;
  diagnosticCode?: GenerationDiagnosticCode;
  requestId?: string;
  failedStage?: GenerationFailedStage;
  safeErrorCategory?: GenerationSafeErrorCategory;
}): GenerationSubmissionResult {
  return {
    ok: false,
    error: args.error,
    structureId: args.structureId,
    diagnosticCode: args.diagnosticCode,
    requestId: args.requestId,
    failedStage: args.failedStage,
    safeErrorCategory: args.safeErrorCategory,
    generatedSitePath: args.structureId
      ? mapStructureIdToOutputPath(args.structureId)
      : undefined,
  };
}

export async function submitWebsiteGeneration(
  input: WebsiteWizardInput,
  options?: SubmitOptions,
): Promise<GenerationSubmissionResult> {
  options?.onStageChange?.("preparing");

  const generationInput = createGenerationPayload(input);
  const payloadValidationErrors = validateWebsiteGenerationInput(generationInput);

  if (payloadValidationErrors.length > 0) {
    return buildFailureResult({
      error: resolveGenerationSafeMessage({
        diagnosticCode: "INVALID_INPUT",
      }),
      structureId: options?.structureId?.trim() || undefined,
      diagnosticCode: "INVALID_INPUT",
      failedStage: "payload-validation",
      safeErrorCategory: "payload-invalid",
    });
  }

  const existingStructureId = options?.structureId?.trim() || undefined;
  const structureEndpoint = existingStructureId
    ? wizardPipelineEndpoints.regenerateStructure
    : wizardPipelineEndpoints.generateStructure;

  options?.onStageChange?.("structure");
  const structureResponse = await fetch(structureEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      existingStructureId
        ? {
            structureId: existingStructureId,
            updatedInput: generationInput,
          }
        : generationInput,
    ),
  });

  const structureBody = await parseJsonResponse<StructureGenerationResponse>(structureResponse);
  if (!structureResponse.ok || !structureBody.structure?.id) {
    return buildFailureResult({
      error: toSafeGenerationMessage(
        structureBody,
        GENERATION_GENERIC_FAILURE_MESSAGE,
        structureResponse.status,
      ),
      structureId: existingStructureId,
      diagnosticCode: structureBody.diagnosticCode,
      requestId: structureBody.requestId,
      failedStage: structureBody.failedStage,
      safeErrorCategory: structureBody.safeErrorCategory,
    });
  }

  const structureId = structureBody.structure.id;
  const contentEndpoint = existingStructureId
    ? wizardPipelineEndpoints.regenerateContent
    : wizardPipelineEndpoints.generateContent;

  options?.onStageChange?.("content");
  const contentResponse = await fetch(contentEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      existingStructureId
        ? {
            structureId,
            updatedInput: generationInput,
          }
        : { structureId },
    ),
  });

  const contentBody = await parseJsonResponse<ContentGenerationResponse>(contentResponse);
  if (!contentResponse.ok) {
    return buildFailureResult({
      error: toSafeGenerationMessage(
        contentBody,
        GENERATION_GENERIC_FAILURE_MESSAGE,
        contentResponse.status,
      ),
      structureId,
      diagnosticCode: contentBody.diagnosticCode,
      requestId: contentBody.requestId,
      failedStage: contentBody.failedStage,
      safeErrorCategory: contentBody.safeErrorCategory,
    });
  }

  options?.onStageChange?.("finalizing");

  return {
    ok: true,
    structureId,
    generatedSitePath: mapStructureIdToOutputPath(structureId),
  };
}
