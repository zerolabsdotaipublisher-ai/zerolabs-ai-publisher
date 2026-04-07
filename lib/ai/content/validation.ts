import { getLengthRule } from "./length";
import { getSectionContract } from "./section-types";
import { validateWebsiteContentShape } from "./schemas";
import type {
  ContentDensityPreset,
  ContentLengthPreset,
  ContentSectionType,
  GeneratedPageContent,
  WebsiteContentPackage,
} from "./types";

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function validateRequiredFields(
  sectionType: ContentSectionType,
  sectionValue: unknown,
): string[] {
  const contract = getSectionContract(sectionType);
  if (!contract) return [];

  const errors: string[] = [];
  const section = (sectionValue ?? {}) as Record<string, unknown>;

  for (const field of contract.requiredFields) {
    const value = section[field];

    if (value === undefined || value === null) {
      errors.push(`${sectionType}.${field} is required`);
      continue;
    }

    if (typeof value === "string" && value.trim().length === 0) {
      errors.push(`${sectionType}.${field} must not be empty`);
    }

    if (Array.isArray(value) && value.length === 0) {
      errors.push(`${sectionType}.${field} must not be empty`);
    }
  }

  return errors;
}

function validateLength(
  sectionType: ContentSectionType,
  sectionValue: unknown,
  lengthPreset: ContentLengthPreset,
  densityPreset: ContentDensityPreset,
): string[] {
  const errors: string[] = [];
  const section = (sectionValue ?? {}) as Record<string, unknown>;
  const rule = getLengthRule(sectionType, lengthPreset, densityPreset);

  if (typeof section.headline === "string" && rule.headlineWordsMax > 0) {
    if (wordCount(section.headline) > rule.headlineWordsMax) {
      errors.push(`${sectionType}.headline exceeds max words (${rule.headlineWordsMax})`);
    }
  }

  if (Array.isArray(section.paragraphs) && rule.paragraphCountMax > 0) {
    if (section.paragraphs.length > rule.paragraphCountMax) {
      errors.push(`${sectionType}.paragraphs exceeds max count (${rule.paragraphCountMax})`);
    }

    section.paragraphs.forEach((paragraph, index) => {
      if (typeof paragraph === "string" && rule.paragraphWordsMax > 0) {
        if (wordCount(paragraph) > rule.paragraphWordsMax) {
          errors.push(
            `${sectionType}.paragraphs[${index}] exceeds max words (${rule.paragraphWordsMax})`,
          );
        }
      }
    });
  }

  if (Array.isArray(section.bullets) && section.bullets.length > rule.bulletsMax) {
    errors.push(`${sectionType}.bullets exceeds max count (${rule.bulletsMax})`);
  }

  return errors;
}

function validatePageSections(
  page: GeneratedPageContent,
  lengthPreset: ContentLengthPreset,
  densityPreset: ContentDensityPreset,
): string[] {
  const errors: string[] = [];

  const sectionEntries = Object.entries(page.sections) as Array<
    [ContentSectionType, unknown]
  >;

  sectionEntries.forEach(([sectionType, sectionValue]) => {
    errors.push(...validateRequiredFields(sectionType, sectionValue));
    errors.push(
      ...validateLength(sectionType, sectionValue, lengthPreset, densityPreset),
    );
  });

  return errors;
}

export function validateGeneratedWebsiteContent(
  content: WebsiteContentPackage,
): string[] {
  const errors = validateWebsiteContentShape(content);

  content.pages.forEach((page) => {
    errors.push(
      ...validatePageSections(page, content.lengthPreset, content.densityPreset),
    );
  });

  return errors;
}
