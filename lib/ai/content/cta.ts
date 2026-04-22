import type { WebsiteGenerationInput } from "../prompts/types";
import type { CtaSectionContent } from "./types";

export function createCtaFallback(input: WebsiteGenerationInput): CtaSectionContent {
  return {
    variant: input.websiteType === "landing-page" ? "banner" : "block",
    headline: `Ready to move forward with ${input.brandName}?`,
    supportingLine: `Start with a focused conversation tailored to ${input.targetAudience}.`,
    ctaText: input.primaryCta,
    ctaHref: "#contact",
    secondaryCtaText: "See how it works",
    secondaryCtaHref: "#services",
    urgencyLabel: "Limited availability",
    audience: input.targetAudience,
    tone: input.tone,
    density: "medium",
    goal: input.primaryCta,
  };
}

export function normalizeCtaSection(
  content: Partial<CtaSectionContent> | undefined,
  input: WebsiteGenerationInput,
): CtaSectionContent {
  const fallback = createCtaFallback(input);

  return {
    variant: content?.variant || fallback.variant,
    headline: content?.headline?.trim() || fallback.headline,
    supportingLine: content?.supportingLine?.trim() || fallback.supportingLine,
    ctaText: content?.ctaText?.trim() || fallback.ctaText,
    ctaHref: content?.ctaHref?.trim() || fallback.ctaHref,
    secondaryCtaText:
      content?.secondaryCtaText?.trim() || fallback.secondaryCtaText,
    secondaryCtaHref:
      content?.secondaryCtaHref?.trim() || fallback.secondaryCtaHref,
    urgencyLabel: content?.urgencyLabel?.trim() || fallback.urgencyLabel,
    audience: content?.audience?.trim() || fallback.audience,
    tone: content?.tone || fallback.tone,
    density: content?.density || fallback.density,
    goal: content?.goal?.trim() || fallback.goal,
  };
}
