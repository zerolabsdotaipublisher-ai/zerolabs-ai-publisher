import { routes } from "@/config/routes";
import type {
  StylePreset,
  TonePreset,
  WebsiteGenerationInput,
} from "@/lib/ai/prompts/types";
import type { GenerationDiagnosticCode } from "@/lib/generation/types";
import { sanitizeInput } from "@/lib/ai/prompts/schemas";
import { createGeneratedWebsiteBrief } from "./identity";
import { inferWebsiteTypeFromPages, normalizeDesignConfig } from "./schemas";
import type { WebsiteWizardInput } from "./types";

export interface WizardPipelineEndpoints {
  generateStructure: "/api/ai/generate-structure";
  generateContent: "/api/ai/generate-content";
  regenerateStructure: "/api/ai/regenerate-structure";
  regenerateContent: "/api/ai/regenerate-content";
  generateNavigation: "/api/ai/generate-navigation";
  generateSeo: "/api/ai/generate-seo";
}

export const wizardPipelineEndpoints: WizardPipelineEndpoints = {
  generateStructure: "/api/ai/generate-structure",
  generateContent: "/api/ai/generate-content",
  regenerateStructure: "/api/ai/regenerate-structure",
  regenerateContent: "/api/ai/regenerate-content",
  generateNavigation: "/api/ai/generate-navigation",
  generateSeo: "/api/ai/generate-seo",
};

const SAFE_TONE_PRESETS: TonePreset[] = [
  "professional",
  "casual",
  "premium",
  "friendly",
  "bold",
  "custom",
];

const SAFE_STYLE_PRESETS: StylePreset[] = [
  "minimalist",
  "modern",
  "corporate",
  "editorial",
  "playful",
  "custom",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveTonePreset(value: unknown): TonePreset {
  return typeof value === "string" && SAFE_TONE_PRESETS.includes(value as TonePreset)
    ? (value as TonePreset)
    : "professional";
}

function resolveStylePreset(value: unknown): StylePreset {
  return typeof value === "string" && SAFE_STYLE_PRESETS.includes(value as StylePreset)
    ? (value as StylePreset)
    : "modern";
}

function normalizeFounderProfile(input: unknown): NonNullable<WebsiteGenerationInput["founderProfile"]> {
  const source = isRecord(input) ? input : {};

  return {
    name: toTrimmedString(source.name),
    role: toTrimmedString(source.role),
    bio: toTrimmedString(source.bio),
  };
}

function normalizeContactInfo(input: unknown): NonNullable<WebsiteGenerationInput["contactInfo"]> {
  const source = isRecord(input) ? input : {};

  return {
    email: toTrimmedString(source.email),
    phone: toTrimmedString(source.phone),
    location: toTrimmedString(source.location),
    socialLinks: toStringList(source.socialLinks),
  };
}

function hasContactInfo(input: NonNullable<WebsiteGenerationInput["contactInfo"]>): boolean {
  return Boolean(
    input.email ||
      input.phone ||
      input.location ||
      (input.socialLinks ?? []).some(Boolean),
  );
}

export function createSafeGenerationPayload(input: WebsiteWizardInput): WebsiteGenerationInput {
  const designConfig = normalizeDesignConfig(input.designConfig);
  const founderProfile = normalizeFounderProfile(input.founderProfile);
  const contactInfo = normalizeContactInfo(input.contactInfo);
  const websiteType = inferWebsiteTypeFromPages(designConfig.pages);
  const generatedBrief = createGeneratedWebsiteBrief(input);
  const tone = resolveTonePreset(input.tone);
  const style = resolveStylePreset(input.style);

  return sanitizeInput({
    websiteType,
    brandName: generatedBrief.brandName,
    description: generatedBrief.description,
    targetAudience: generatedBrief.targetAudience,
    tone,
    style,
    primaryCta: generatedBrief.primaryCta,
    services: generatedBrief.services,
    founderProfile,
    contactInfo: hasContactInfo(contactInfo)
      ? contactInfo
      : undefined,
    constraints: toStringList(input.constraints),
    customToneNotes: tone === "custom" ? toTrimmedString(input.customToneNotes) : "",
    customStyleNotes: style === "custom" ? toTrimmedString(input.customStyleNotes) : "",
    designConfig,
  });
}

export function mapWizardInputToGenerationInput(
  input: WebsiteWizardInput,
): WebsiteGenerationInput {
  return createSafeGenerationPayload(input);
}

export function mapStructureIdToOutputPath(structureId: string): string {
  return routes.previewSite(structureId);
}

export interface StructureGenerationResponse {
  structure?: {
    id: string;
  };
  error?: string;
  message?: string;
  details?: string[];
  diagnosticCode?: GenerationDiagnosticCode;
  requestId?: string;
}

export interface ContentGenerationResponse {
  content?: { id: string };
  structure?: { id: string };
  error?: string;
  message?: string;
  details?: string[];
  diagnosticCode?: GenerationDiagnosticCode;
  requestId?: string;
}
