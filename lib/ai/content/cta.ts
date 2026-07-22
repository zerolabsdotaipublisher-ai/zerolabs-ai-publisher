import type { WebsiteGenerationInput } from "../prompts/types";
import { resolveWebsiteGenerationInput } from "../default-inputs";
import type { CtaSectionContent } from "./types";

export function createCtaFallback(input: WebsiteGenerationInput): CtaSectionContent {
  const resolvedInput = resolveWebsiteGenerationInput(input).input;

  return {
    variant: resolvedInput.websiteType === "landing-page" ? "banner" : "block",
    headline: `Ready to move forward with ${resolvedInput.brandName}?`,
    supportingLine: `Start with a focused conversation tailored to ${resolvedInput.targetAudience}.`,
    ctaText: resolvedInput.primaryCta,
    ctaHref: "#contact",
    secondaryCtaText: "View the details",
    secondaryCtaHref: "#services",
    urgencyLabel: "Clear scope. Practical next steps.",
    audience: resolvedInput.targetAudience,
    tone: resolvedInput.tone,
    density: "medium",
    goal: resolvedInput.primaryCta,
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
