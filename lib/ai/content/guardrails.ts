import { guardrailBlock } from "../prompts/guardrails";
import type { WebsiteGenerationInput } from "../prompts/types";
import type {
  ContentSectionType,
  GeneratedPageContent,
  WebsiteContentPackage,
} from "./types";

const BANNED_PATTERNS = [
  /lorem ipsum/i,
  /tbd/i,
  /\\bcoming soon\\.?$/i,
  /best in the world/i,
  /guaranteed results/i,
];

export function contentGuardrailPrompt(input: WebsiteGenerationInput): string {
  return [
    guardrailBlock(input.constraints),
    "- Do not fabricate client names, numbers, or legal claims.",
    "- If testimonials are synthetic, mark each item with isPlaceholder=true.",
    "- Avoid filler adjectives and repeated generic phrases.",
    "- Ensure each requested section has complete, non-empty content fields.",
  ].join("\n");
}

export function evaluateSectionQuality(
  sectionType: ContentSectionType,
  section: unknown,
): string[] {
  const errors: string[] = [];
  const serialized = JSON.stringify(section ?? {});

  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(serialized)) {
      errors.push(`${sectionType}: contains banned filler or unsupported claim pattern`);
    }
  }

  return errors;
}

export function evaluateContentQuality(
  content: WebsiteContentPackage,
): string[] {
  const errors: string[] = [];

  content.pages.forEach((page: GeneratedPageContent) => {
    const sectionEntries = Object.entries(page.sections) as Array<
      [ContentSectionType, unknown]
    >;

    sectionEntries.forEach(([sectionType, section]) => {
      errors.push(...evaluateSectionQuality(sectionType, section));
    });
  });

  return errors;
}
