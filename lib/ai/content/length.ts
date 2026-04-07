import type {
  ContentDensityPreset,
  ContentLengthPreset,
  ContentSectionType,
} from "./types";

export interface ContentLengthRule {
  sectionType: ContentSectionType;
  headlineWordsMax: number;
  paragraphCountMax: number;
  paragraphWordsMax: number;
  bulletsMax: number;
}

function scaleByLength(value: number, preset: ContentLengthPreset): number {
  if (preset === "concise") return Math.max(1, Math.floor(value * 0.75));
  if (preset === "detailed") return Math.ceil(value * 1.35);
  return value;
}

function scaleByDensity(value: number, preset: ContentDensityPreset): number {
  if (preset === "light") return Math.max(1, Math.floor(value * 0.8));
  if (preset === "high") return Math.ceil(value * 1.2);
  return value;
}

const BASE_LENGTH_RULES: Record<ContentSectionType, ContentLengthRule> = {
  hero: {
    sectionType: "hero",
    headlineWordsMax: 12,
    paragraphCountMax: 1,
    paragraphWordsMax: 30,
    bulletsMax: 0,
  },
  about: {
    sectionType: "about",
    headlineWordsMax: 12,
    paragraphCountMax: 2,
    paragraphWordsMax: 55,
    bulletsMax: 4,
  },
  services: {
    sectionType: "services",
    headlineWordsMax: 12,
    paragraphCountMax: 2,
    paragraphWordsMax: 45,
    bulletsMax: 6,
  },
  features: {
    sectionType: "features",
    headlineWordsMax: 12,
    paragraphCountMax: 2,
    paragraphWordsMax: 45,
    bulletsMax: 6,
  },
  process: {
    sectionType: "process",
    headlineWordsMax: 12,
    paragraphCountMax: 2,
    paragraphWordsMax: 45,
    bulletsMax: 6,
  },
  benefits: {
    sectionType: "benefits",
    headlineWordsMax: 12,
    paragraphCountMax: 2,
    paragraphWordsMax: 45,
    bulletsMax: 6,
  },
  testimonials: {
    sectionType: "testimonials",
    headlineWordsMax: 12,
    paragraphCountMax: 1,
    paragraphWordsMax: 30,
    bulletsMax: 0,
  },
  faq: {
    sectionType: "faq",
    headlineWordsMax: 12,
    paragraphCountMax: 0,
    paragraphWordsMax: 0,
    bulletsMax: 6,
  },
  contact: {
    sectionType: "contact",
    headlineWordsMax: 12,
    paragraphCountMax: 1,
    paragraphWordsMax: 30,
    bulletsMax: 4,
  },
  cta: {
    sectionType: "cta",
    headlineWordsMax: 10,
    paragraphCountMax: 1,
    paragraphWordsMax: 20,
    bulletsMax: 0,
  },
  footer: {
    sectionType: "footer",
    headlineWordsMax: 0,
    paragraphCountMax: 1,
    paragraphWordsMax: 18,
    bulletsMax: 3,
  },
  microcopy: {
    sectionType: "microcopy",
    headlineWordsMax: 0,
    paragraphCountMax: 0,
    paragraphWordsMax: 0,
    bulletsMax: 5,
  },
};

export function getLengthRule(
  sectionType: ContentSectionType,
  lengthPreset: ContentLengthPreset,
  densityPreset: ContentDensityPreset,
): ContentLengthRule {
  const base = BASE_LENGTH_RULES[sectionType];

  return {
    sectionType,
    headlineWordsMax: scaleByDensity(scaleByLength(base.headlineWordsMax, lengthPreset), densityPreset),
    paragraphCountMax: scaleByDensity(scaleByLength(base.paragraphCountMax, lengthPreset), densityPreset),
    paragraphWordsMax: scaleByDensity(scaleByLength(base.paragraphWordsMax, lengthPreset), densityPreset),
    bulletsMax: scaleByDensity(scaleByLength(base.bulletsMax, lengthPreset), densityPreset),
  };
}
