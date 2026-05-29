import { wizardPipelineEndpoints } from "@/lib/wizard";
import { mapStructureIdToOutputPath, mapWizardInputToGenerationInput } from "./mapping";
import type { GenerationStage, GenerationSubmissionResult } from "./types";
import type {
  ContentGenerationResponse,
  StructureGenerationResponse,
  WebsiteWizardInput,
} from "@/lib/wizard";

interface SubmitOptions {
  onStageChange?: (stage: GenerationStage) => void;
}

const RATE_LIMIT_MESSAGE =
  "Generation is temporarily rate-limited. Please wait a moment, then try again.";
const GENERIC_FAILURE_MESSAGE =
  "Generation could not be completed right now. Please review your inputs or try again in a moment.";

type SafeGenerationPayload = {
  error?: string;
  message?: string;
  details?: string[];
};

function humanizeFieldName(value: string): string {
  const normalized = value
    .replace(/\./g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  switch (normalized) {
    case "brand name":
      return "brand name";
    case "target audience":
      return "target audience";
    case "primary cta":
      return "primary call to action";
    case "website type":
      return "website type";
    case "design config":
      return "page setup";
    default:
      return normalized;
  }
}

function toFriendlyValidationDetail(detail: string): string {
  const trimmed = detail.trim().replace(/\.$/, "");

  if (!trimmed) {
    return "A required input still needs attention.";
  }

  if (/^services must include at least one offering$/i.test(trimmed)) {
    return "Add at least one service or offer before generating.";
  }

  if (/^websiteType must be one of the supported website types$/i.test(trimmed)) {
    return "Choose a valid primary page layout so the website type can be inferred.";
  }

  const requiredMatch = trimmed.match(/^([A-Za-z0-9_.]+) is required$/i);
  if (requiredMatch) {
    return `Add ${humanizeFieldName(requiredMatch[1])} before generating.`;
  }

  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}.`;
}

function isValidationFailure(status: number, payload: SafeGenerationPayload): boolean {
  if (status === 400 || status === 422) {
    return true;
  }

  const candidates = [payload.error, payload.message, ...(payload.details ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    candidates.includes("invalid input") ||
    candidates.includes("required") ||
    candidates.includes("missing")
  );
}

function isRateLimited(status: number, payload: SafeGenerationPayload): boolean {
  if (status === 429) {
    return true;
  }

  const candidates = [payload.error, payload.message, ...(payload.details ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    candidates.includes("openai api error 429") ||
    candidates.includes("rate-limit") ||
    candidates.includes("rate limit") ||
    candidates.includes("rate-limited") ||
    candidates.includes("quota")
  );
}

function toSafeGenerationMessage(
  payload: SafeGenerationPayload,
  fallback: string,
  status = 0,
): string {
  if (isRateLimited(status, payload)) {
    return RATE_LIMIT_MESSAGE;
  }

  if (payload.details?.length) {
    const details = payload.details.slice(0, 3).map(toFriendlyValidationDetail);
    return `Some inputs need attention: ${details.join(" ")}`;
  }

  const raw = payload.message || payload.error;
  if (!raw) {
    return isValidationFailure(status, payload) ? "Some required inputs are still missing." : fallback;
  }

  const firstLine = raw.split(/\r?\n/)[0]?.trim();
  if (!firstLine) {
    return isValidationFailure(status, payload) ? "Some required inputs are still missing." : fallback;
  }

  if (isValidationFailure(status, payload)) {
    return `Some inputs need attention: ${toFriendlyValidationDetail(firstLine)}`;
  }

  const sanitized = firstLine.length > 240 ? `${firstLine.slice(0, 237)}...` : firstLine;

  if (
    sanitized.toLowerCase() === "generation failed" ||
    sanitized.toLowerCase() === "structure generation failed." ||
    sanitized.toLowerCase() === "content generation failed."
  ) {
    return GENERIC_FAILURE_MESSAGE;
  }

  return sanitized;
}

async function parseJsonResponse<T extends SafeGenerationPayload>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

function createCompatibleGenerationPayload(input: WebsiteWizardInput) {
  const generationInput = mapWizardInputToGenerationInput(input);
  const primaryPage =
    generationInput.designConfig?.pages.find((page) => page.name.trim().toLowerCase() === "home") ??
    generationInput.designConfig?.pages[0];

  return {
    ...generationInput,
    websiteType: generationInput.websiteType,
    brandName: generationInput.brandName ?? "",
    description: generationInput.description ?? "",
    targetAudience: generationInput.targetAudience ?? "",
    primaryCta: generationInput.primaryCta ?? "",
    services: generationInput.services ?? [],
    founderProfile: generationInput.founderProfile ?? {
      name: "",
      role: "",
      bio: "",
    },
    testimonials: generationInput.testimonials ?? [],
    contactInfo: {
      email: generationInput.contactInfo?.email ?? "",
      phone: generationInput.contactInfo?.phone ?? "",
      location: generationInput.contactInfo?.location ?? "",
      socialLinks: generationInput.contactInfo?.socialLinks ?? [],
    },
    constraints: generationInput.constraints ?? [],
    customToneNotes: generationInput.customToneNotes ?? "",
    customStyleNotes: generationInput.customStyleNotes ?? "",
    designConfig: generationInput.designConfig ?? { pages: [] },
    layout: primaryPage ? { structure: primaryPage.layout } : undefined,
    background: primaryPage?.background,
    typography: primaryPage?.typography,
    headings: primaryPage?.headings,
  };
}

export async function submitWebsiteGeneration(
  input: WebsiteWizardInput,
  options?: SubmitOptions,
): Promise<GenerationSubmissionResult> {
  options?.onStageChange?.("preparing");

  const generationInput = createCompatibleGenerationPayload(input);

  options?.onStageChange?.("structure");
  const structureResponse = await fetch(wizardPipelineEndpoints.generateStructure, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(generationInput),
  });

  const structureBody = await parseJsonResponse<StructureGenerationResponse>(structureResponse);
  if (!structureResponse.ok || !structureBody.structure?.id) {
    return {
      ok: false,
      error: toSafeGenerationMessage(
        structureBody,
        GENERIC_FAILURE_MESSAGE,
        structureResponse.status,
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

  const contentBody = await parseJsonResponse<ContentGenerationResponse>(contentResponse);
  if (!contentResponse.ok) {
    return {
      ok: false,
      error: toSafeGenerationMessage(
        contentBody,
        GENERIC_FAILURE_MESSAGE,
        contentResponse.status,
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
