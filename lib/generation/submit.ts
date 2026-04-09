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
      error: structureBody.error || structureBody.message || "Structure generation failed.",
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
      error: contentBody.error || contentBody.message || "Content generation failed.",
    };
  }

  options?.onStageChange?.("finalizing");

  return {
    ok: true,
    structureId,
    generatedSitePath: mapStructureIdToOutputPath(structureId),
  };
}
