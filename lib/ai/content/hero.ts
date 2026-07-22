import type { WebsiteGenerationInput } from "../prompts/types";
import { resolveWebsiteGenerationInput } from "../default-inputs";
import type { HeroSectionContent } from "./types";

export function createHeroFallback(input: WebsiteGenerationInput): HeroSectionContent {
  const resolvedInput = resolveWebsiteGenerationInput(input).input;

  return {
    variant: resolvedInput.websiteType === "landing-page" ? "with-image" : "text-only",
    eyebrow: `Built for ${resolvedInput.targetAudience}`,
    headline: `${resolvedInput.brandName}: ${resolvedInput.services[0] ?? "Trusted solutions"}`,
    subheadline: `Built for ${resolvedInput.targetAudience} with clear outcomes and practical execution.`,
    supportingCopy: resolvedInput.description,
    primaryCta: resolvedInput.primaryCta,
    secondaryCta: "Learn more",
    ctaHref: "#contact",
    image:
      resolvedInput.websiteType === "landing-page"
        ? {
            alt: `${resolvedInput.brandName} hero illustration`,
            promptHint: `${resolvedInput.brandName} serving ${resolvedInput.targetAudience}`,
          }
        : undefined,
    audience: resolvedInput.targetAudience,
    tone: resolvedInput.tone,
    density: "medium",
    goal: resolvedInput.primaryCta,
  };
}

export function normalizeHeroSectionContent(
  content: Partial<HeroSectionContent> | undefined,
  input: WebsiteGenerationInput,
): HeroSectionContent {
  const fallback = createHeroFallback(input);

  return {
    variant: content?.variant || fallback.variant,
    eyebrow: content?.eyebrow?.trim() || fallback.eyebrow,
    headline: content?.headline?.trim() || fallback.headline,
    subheadline: content?.subheadline?.trim() || fallback.subheadline,
    supportingCopy: content?.supportingCopy?.trim() || fallback.supportingCopy,
    primaryCta: content?.primaryCta?.trim() || fallback.primaryCta,
    secondaryCta: content?.secondaryCta?.trim() || fallback.secondaryCta,
    ctaHref: content?.ctaHref?.trim() || fallback.ctaHref,
    image:
      content?.image?.alt?.trim() || content?.image?.promptHint?.trim()
        ? {
            alt: content?.image?.alt?.trim() || fallback.image?.alt || `${input.brandName} image placeholder`,
            src: content?.image?.src?.trim() || fallback.image?.src,
            promptHint:
              content?.image?.promptHint?.trim() || fallback.image?.promptHint,
          }
        : fallback.image,
    audience: content?.audience?.trim() || fallback.audience,
    tone: content?.tone || fallback.tone,
    density: content?.density || fallback.density,
    goal: content?.goal?.trim() || fallback.goal,
  };
}
