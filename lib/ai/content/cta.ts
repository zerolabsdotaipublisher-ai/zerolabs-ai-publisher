import type { WebsiteGenerationInput } from "../prompts/types";
import type { CtaSectionContent } from "./types";

export function createCtaFallback(input: WebsiteGenerationInput): CtaSectionContent {
  return {
    headline: `Ready to move forward with ${input.brandName}?`,
    supportingLine: `Start with a focused conversation tailored to ${input.targetAudience}.`,
    ctaText: input.primaryCta,
    urgencyLabel: "Limited availability",
  };
}

export function normalizeCtaSection(
  content: Partial<CtaSectionContent> | undefined,
  input: WebsiteGenerationInput,
): CtaSectionContent {
  const fallback = createCtaFallback(input);

  return {
    headline: content?.headline?.trim() || fallback.headline,
    supportingLine: content?.supportingLine?.trim() || fallback.supportingLine,
    ctaText: content?.ctaText?.trim() || fallback.ctaText,
    urgencyLabel: content?.urgencyLabel?.trim() || fallback.urgencyLabel,
  };
}
