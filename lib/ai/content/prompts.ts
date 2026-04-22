import {
  buildPromptBundle,
  resolveStyleGuidance,
  resolveToneGuidance,
} from "../prompts";
import { contentOutputContractJson } from "./schemas";
import { contentGuardrailPrompt } from "./guardrails";
import type {
  ContentDensityPreset,
  ContentGenerationOptions,
  ContentLengthPreset,
  PageGenerationContext,
} from "./types";
import { SECTION_CONTENT_CONTRACTS } from "./section-types";

export interface ContentPromptArgs {
  input: Parameters<typeof buildPromptBundle>[0];
  pages: PageGenerationContext[];
  lengthPreset: ContentLengthPreset;
  densityPreset: ContentDensityPreset;
  options?: ContentGenerationOptions;
}

function sectionInstruction(sections: string[]): string {
  return sections.map((section) => `- ${section}`).join("\n");
}

function pageInstruction(page: PageGenerationContext): string {
  return [
    `Page slug: ${page.pageSlug}`,
    `Page type: ${page.pageType}`,
    `Required sections:`,
    sectionInstruction(page.sections),
  ].join("\n");
}

function sectionTemplateInstructions(
  options?: ContentGenerationOptions,
): string {
  const variantMap = options?.sectionVariants ?? {};

  return SECTION_CONTENT_CONTRACTS.map((contract) => {
    const requestedVariant = variantMap[contract.sectionType];
    const variantInstruction = requestedVariant
      ? `Preferred variant: ${requestedVariant}.`
      : `Allowed variants: ${contract.supportedVariants.join(", ")}.`;

    return [
      `- ${contract.sectionType}: ${contract.sectionGoal}`,
      `  ${variantInstruction}`,
      `  Required fields: ${contract.requiredFields.join(", ") || "none"}.`,
    ].join("\n");
  }).join("\n");
}

function lengthInstruction(lengthPreset: ContentLengthPreset): string {
  if (lengthPreset === "concise") {
    return "Prefer short headlines and concise paragraphs; avoid long-form blocks.";
  }

  if (lengthPreset === "detailed") {
    return "Provide richer detail while staying scannable and conversion-focused.";
  }

  return "Balance clarity and detail with website-ready readability.";
}

function densityInstruction(densityPreset: ContentDensityPreset): string {
  if (densityPreset === "light") {
    return "Keep copy airy, minimal, and highly skimmable.";
  }

  if (densityPreset === "high") {
    return "Increase information density without sounding verbose.";
  }

  return "Use medium density appropriate for product websites.";
}

export function buildWebsiteContentPrompt({
  input,
  pages,
  lengthPreset,
  densityPreset,
  options,
}: ContentPromptArgs): string {
  const promptBundle = buildPromptBundle(input, { compact: true });
  const audience = options?.audienceOverride?.trim() || input.targetAudience;
  const conversionGoal = options?.conversionGoal?.trim() || input.primaryCta;

  return [
    "You are generating website content for Zero Labs AI Publisher.",
    "Reuse the same product meaning and constraints as the existing prompt foundation.",
    "Generate product-owned marketing sections that fit the existing WebsiteStructure and renderer.",
    "",
    "BASE PROMPT FOUNDATION (Story 3-1):",
    promptBundle.corePrompt,
    "",
    "TONE AND STYLE OVERRIDES:",
    `- ${resolveToneGuidance(input)}`,
    `- ${resolveStyleGuidance(input)}`,
    `- ${lengthInstruction(lengthPreset)}`,
    `- ${densityInstruction(densityPreset)}`,
    `- Target audience: ${audience}`,
    `- Primary conversion goal: ${conversionGoal}`,
    "",
    "MARKETING SECTION TEMPLATES:",
    sectionTemplateInstructions(options),
    "",
    "CONTENT GUARDRAILS:",
    contentGuardrailPrompt(input),
    "- Keep the copy persuasive, concrete, and conversion-aware rather than generic.",
    "- Testimonials and social proof must stay clearly synthetic unless supplied in the input.",
    "- Pricing must be safe placeholder packaging when explicit commercial data is unavailable.",
    "- FAQ answers should reduce objections without inventing policies or guarantees.",
    "",
    "MULTI-PAGE REQUIREMENTS:",
    ...pages.map((page, index) => `Page ${index + 1}\n${pageInstruction(page)}`),
    "",
    "OUTPUT CONTRACT (strict JSON):",
    contentOutputContractJson(),
    "",
    "Return JSON only. No markdown fences. Do not include unsupported sections.",
  ].join("\n");
}
