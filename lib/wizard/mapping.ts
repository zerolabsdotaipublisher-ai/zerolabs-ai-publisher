import { routes } from "@/config/routes";
import type { WebsiteGenerationInput } from "@/lib/ai/prompts/types";
import type { GenerationDiagnosticCode } from "@/lib/generation/types";
import { sanitizeInput } from "@/lib/ai/prompts/schemas";
import { inferWebsiteTypeFromPages } from "./schemas";
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

export function mapWizardInputToGenerationInput(
  input: WebsiteWizardInput,
): WebsiteGenerationInput {
  const websiteType = inferWebsiteTypeFromPages(input.designConfig.pages);

  return sanitizeInput({
    websiteType,
    brandName: input.brandName,
    description: input.description,
    targetAudience: input.targetAudience,
    tone: input.tone,
    style: input.style,
    primaryCta: input.primaryCta,
    services: input.services,
    founderProfile: {
      name: input.founderProfile.name,
      role: input.founderProfile.role,
      bio: input.founderProfile.bio,
    },
    testimonials: input.testimonials,
    contactInfo: {
      email: input.contactInfo.email,
      phone: input.contactInfo.phone,
      location: input.contactInfo.location,
      socialLinks: input.contactInfo.socialLinks,
    },
    constraints: input.constraints,
    customToneNotes: input.customToneNotes,
    customStyleNotes: input.customStyleNotes,
    designConfig: input.designConfig,
  });
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
