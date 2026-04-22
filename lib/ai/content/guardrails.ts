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
  const phrases = serialized
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 4);
  const duplicatePhrase = phrases.find(
    (phrase, index) => phrases.indexOf(phrase) !== index,
  );

  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(serialized)) {
      errors.push(`${sectionType}: contains banned filler or unsupported claim pattern`);
    }
  }

  const duplicateMatches = duplicatePhrase
    ? serialized.toLowerCase().match(new RegExp(duplicatePhrase, "g"))
    : null;

  if (duplicatePhrase && duplicateMatches && duplicateMatches.length >= 4) {
    errors.push(`${sectionType}: repeats generic phrasing too often`);
  }

  if (
    sectionType === "testimonials" &&
    /"isPlaceholder":false/i.test(serialized) &&
    !/"company":/i.test(serialized)
  ) {
    errors.push("testimonials: non-placeholder proof should include richer attribution");
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
