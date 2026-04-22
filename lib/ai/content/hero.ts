import type { WebsiteGenerationInput } from "../prompts/types";
import type { HeroSectionContent } from "./types";

export function createHeroFallback(input: WebsiteGenerationInput): HeroSectionContent {
  return {
    variant: input.websiteType === "landing-page" ? "with-image" : "text-only",
    eyebrow: `Built for ${input.targetAudience}`,
    headline: `${input.brandName}: ${input.services[0] ?? "Trusted solutions"}`,
    subheadline: `Built for ${input.targetAudience} with clear outcomes and practical execution.`,
    supportingCopy: input.description,
    primaryCta: input.primaryCta,
    secondaryCta: "Learn more",
    ctaHref: "#contact",
    image:
      input.websiteType === "landing-page"
        ? {
            alt: `${input.brandName} hero illustration placeholder`,
            promptHint: `${input.brandName} serving ${input.targetAudience}`,
          }
        : undefined,
    audience: input.targetAudience,
    tone: input.tone,
    density: "medium",
    goal: input.primaryCta,
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
