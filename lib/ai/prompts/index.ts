import { guardrailBlock } from "./guardrails";
import { outputContractJson, sanitizeInput, validateWebsiteGenerationInput } from "./schemas";
import { createAboutSectionTemplate } from "./templates/section-about";
import { createContactSectionTemplate } from "./templates/section-contact";
import { createCoreWebsiteTemplate } from "./templates/core-website";
import { createCtaSectionTemplate } from "./templates/section-cta";
import { createFooterSectionTemplate } from "./templates/section-footer";
import { createHeroSectionTemplate } from "./templates/section-hero";
import { createServicesSectionTemplate } from "./templates/section-services";
import { createTestimonialsSectionTemplate } from "./templates/section-testimonials";
import type {
  PromptBuildOptions,
  PromptBundle,
  WebsiteGenerationInput,
  WebsiteSectionName,
} from "./types";
import { READABILITY_RULES, resolveStyleGuidance, resolveToneGuidance } from "./variables";

const SECTION_BUILDERS: Record<
  WebsiteSectionName,
  (input: WebsiteGenerationInput) => string
> = {
  hero: createHeroSectionTemplate,
  about: createAboutSectionTemplate,
  services: createServicesSectionTemplate,
  testimonials: createTestimonialsSectionTemplate,
  cta: createCtaSectionTemplate,
  contact: createContactSectionTemplate,
  footer: createFooterSectionTemplate,
};

function resolveSectionList(options?: PromptBuildOptions): WebsiteSectionName[] {
  const requested = options?.includeSections;
  if (!requested?.length) {
    return Object.keys(SECTION_BUILDERS) as WebsiteSectionName[];
  }

  return requested.filter((section) => SECTION_BUILDERS[section]);
}

export function buildWebsitePrompt(
  rawInput: WebsiteGenerationInput,
  options?: PromptBuildOptions,
): string {
  const input = sanitizeInput(rawInput);
  const errors = validateWebsiteGenerationInput(input);

  if (errors.length) {
    throw new Error(`Invalid website generation input: ${errors.join("; ")}`);
  }

  const corePrompt = createCoreWebsiteTemplate({
    input,
    toneGuidance: resolveToneGuidance(input),
    styleGuidance: resolveStyleGuidance(input),
    readabilityRules: READABILITY_RULES,
    guardrails: guardrailBlock(input.constraints),
    outputContract: outputContractJson(),
  });

  if (options?.compact) {
    return corePrompt;
  }

  const sectionPrompts = resolveSectionList(options).map((section) => {
    const builder = SECTION_BUILDERS[section];
    return `\n[SECTION:${section}]\n${builder(input)}`;
  });

  return [corePrompt, ...sectionPrompts].join("\n");
}

export function buildSectionPrompt(
  section: WebsiteSectionName,
  rawInput: WebsiteGenerationInput,
): string {
  const input = sanitizeInput(rawInput);
  const builder = SECTION_BUILDERS[section];

  if (!builder) {
    throw new Error(`Unsupported section prompt: ${section}`);
  }

  return [
    `Section prompt for: ${section}`,
    `Tone guidance: ${resolveToneGuidance(input)}`,
    `Style guidance: ${resolveStyleGuidance(input)}`,
    `Guardrails:\n${guardrailBlock(input.constraints)}`,
    builder(input),
  ].join("\n\n");
}

export function buildPromptBundle(
  rawInput: WebsiteGenerationInput,
  options?: PromptBuildOptions,
): PromptBundle {
  const input = sanitizeInput(rawInput);
  const includeSections = resolveSectionList(options);

  const sectionPrompts = includeSections.reduce<
    Partial<Record<WebsiteSectionName, string>>
  >((acc, section) => {
    acc[section] = buildSectionPrompt(section, input);
    return acc;
  }, {});

  return {
    input,
    corePrompt: buildWebsitePrompt(input, { ...options, compact: true }),
    sectionPrompts,
  };
}

export * from "./types";
export * from "./schemas";
export * from "./guardrails";
export * from "./variables";
export * from "./workflow";
export * from "./evaluation";
export * from "./fixtures";
