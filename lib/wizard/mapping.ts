import { routes } from "@/config/routes";
import type { WebsiteGenerationInput } from "@/lib/ai/prompts/types";
import { sanitizeInput } from "@/lib/ai/prompts/schemas";
import type { WebsiteWizardInput } from "./types";

export interface WizardPipelineEndpoints {
  generateStructure: "/api/ai/generate-structure";
  generateContent: "/api/ai/generate-content";
  generateNavigation: "/api/ai/generate-navigation";
  generateSeo: "/api/ai/generate-seo";
}

export const wizardPipelineEndpoints: WizardPipelineEndpoints = {
  generateStructure: "/api/ai/generate-structure",
  generateContent: "/api/ai/generate-content",
  generateNavigation: "/api/ai/generate-navigation",
  generateSeo: "/api/ai/generate-seo",
};

export function mapWizardInputToGenerationInput(
  input: WebsiteWizardInput,
): WebsiteGenerationInput {
  return sanitizeInput({
    websiteType: input.websiteType,
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
  });
}

export function mapStructureIdToOutputPath(structureId: string): string {
  return routes.generatedSite(structureId);
}

export interface StructureGenerationResponse {
  structure?: {
    id: string;
  };
  error?: string;
  message?: string;
}

export interface ContentGenerationResponse {
  content?: { id: string };
  structure?: { id: string };
  error?: string;
  message?: string;
}
