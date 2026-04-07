import type { WebsiteGenerationInput } from "../prompts/types";
import type { MicrocopyContent } from "./types";

export function createMicrocopyFallback(
  input: WebsiteGenerationInput,
): MicrocopyContent {
  return {
    primaryButtonLabel: input.primaryCta,
    secondaryButtonLabel: "Explore services",
    trustIndicator: "No obligation, clear next steps",
    helperText: `Designed for ${input.targetAudience}`,
    descriptor: "Trusted by results-focused teams",
    shortTagline: input.description.slice(0, 80),
    bullets: ["Fast response", "Clear scope", "Practical outcomes"],
  };
}

export function normalizeMicrocopy(
  content: Partial<MicrocopyContent> | undefined,
  input: WebsiteGenerationInput,
): MicrocopyContent {
  const fallback = createMicrocopyFallback(input);

  return {
    primaryButtonLabel:
      content?.primaryButtonLabel?.trim() || fallback.primaryButtonLabel,
    secondaryButtonLabel:
      content?.secondaryButtonLabel?.trim() || fallback.secondaryButtonLabel,
    trustIndicator: content?.trustIndicator?.trim() || fallback.trustIndicator,
    helperText: content?.helperText?.trim() || fallback.helperText,
    descriptor: content?.descriptor?.trim() || fallback.descriptor,
    shortTagline: content?.shortTagline?.trim() || fallback.shortTagline,
    bullets:
      content?.bullets?.map((bullet) => bullet.trim()).filter(Boolean) ||
      fallback.bullets,
  };
}
