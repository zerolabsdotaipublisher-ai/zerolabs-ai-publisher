import { wizardPipelineEndpoints } from "@/lib/wizard";
import {
  mapStructureIdToOutputPath,
  mapWizardInputToGenerationInput,
} from "./mapping";
import type {
  GenerationStage,
  GenerationSubmissionResult,
} from "./types";
import type {
  ContentGenerationResponse,
  StructureGenerationResponse,
  WebsiteWizardInput,
} from "@/lib/wizard";

interface SubmitOptions {
  onStageChange?: (stage: GenerationStage) => void;
}

function toSafeGenerationMessage(payload: {
  error?: string;
  message?: string;
  details?: string[];
}, fallback: string): string {
  if (payload.details?.length) {
    return payload.details.slice(0, 3).join(" ");
  }

  const raw = payload.message || payload.error;
  if (!raw) {
    return fallback;
  }

  const firstLine = raw.split(/\r?\n/)[0]?.trim();
  if (!firstLine) {
    return fallback;
  }

  return firstLine.length > 240 ? `${firstLine.slice(0, 237)}...` : firstLine;
}

export async function submitWebsiteGeneration(
  input: WebsiteWizardInput,
  options?: SubmitOptions,
): Promise<GenerationSubmissionResult> {
  options?.onStageChange?.("preparing");

  const generationInput = mapWizardInputToGenerationInput(input);

  options?.onStageChange?.("structure");
  const structureResponse = await fetch(wizardPipelineEndpoints.generateStructure, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(generationInput),
  });

  const structureBody = (await structureResponse.json()) as StructureGenerationResponse;
  if (!structureResponse.ok || !structureBody.structure?.id) {
    return {
      ok: false,
      error: toSafeGenerationMessage(
        structureBody,
        "Structure generation failed.",
      ),
    };
  }

  const structureId = structureBody.structure.id;

  options?.onStageChange?.("content");
  const contentResponse = await fetch(wizardPipelineEndpoints.generateContent, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ structureId }),
  });

  const contentBody = (await contentResponse.json()) as ContentGenerationResponse;
  if (!contentResponse.ok) {
    return {
      ok: false,
      error: toSafeGenerationMessage(
        contentBody,
        "Content generation failed.",
      ),
    };
  }

  options?.onStageChange?.("finalizing");

  return {
    ok: true,
    structureId,
    generatedSitePath: mapStructureIdToOutputPath(structureId),
  };
}
