import type { WebsiteGenerationInput } from "../prompts/types";
import type { HeroSectionContent } from "./types";

export function createHeroFallback(input: WebsiteGenerationInput): HeroSectionContent {
  return {
    headline: `${input.brandName}: ${input.services[0] ?? "Trusted solutions"}`,
    subheadline: `Built for ${input.targetAudience} with clear outcomes and practical execution.`,
    supportingCopy: input.description,
    primaryCta: input.primaryCta,
    secondaryCta: "Learn more",
  };
}

export function normalizeHeroSectionContent(
  content: Partial<HeroSectionContent> | undefined,
  input: WebsiteGenerationInput,
): HeroSectionContent {
  const fallback = createHeroFallback(input);

  return {
    headline: content?.headline?.trim() || fallback.headline,
    subheadline: content?.subheadline?.trim() || fallback.subheadline,
    supportingCopy: content?.supportingCopy?.trim() || fallback.supportingCopy,
    primaryCta: content?.primaryCta?.trim() || fallback.primaryCta,
    secondaryCta: content?.secondaryCta?.trim() || fallback.secondaryCta,
  };
}
