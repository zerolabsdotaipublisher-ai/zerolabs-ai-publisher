import type { ContentSectionType } from "./types";

export interface SectionContentContract {
  sectionType: ContentSectionType;
  requiredFields: string[];
  optionalFields: string[];
  sectionGoal: string;
  supportedVariants: string[];
}

export const SECTION_CONTENT_CONTRACTS: SectionContentContract[] = [
  {
    sectionType: "hero",
    requiredFields: ["headline", "subheadline", "supportingCopy", "primaryCta"],
    optionalFields: ["secondaryCta", "eyebrow", "ctaHref", "image"],
    sectionGoal: "Lead with value proposition and conversion-focused action.",
    supportedVariants: ["text-only", "with-image"],
  },
  {
    sectionType: "about",
    requiredFields: ["headline", "paragraphs"],
    optionalFields: ["subheadline", "description", "bullets", "items"],
    sectionGoal: "Establish credibility and brand context.",
    supportedVariants: ["stacked", "grid", "list"],
  },
  {
    sectionType: "services",
    requiredFields: ["headline", "items"],
    optionalFields: ["subheadline", "description", "paragraphs", "bullets"],
    sectionGoal: "Present offerings with outcome-oriented descriptions.",
    supportedVariants: ["grid", "list"],
  },
  {
    sectionType: "features",
    requiredFields: ["headline", "items"],
    optionalFields: ["subheadline", "description", "paragraphs", "bullets"],
    sectionGoal: "Explain key product capabilities in scannable form.",
    supportedVariants: ["grid", "list"],
  },
  {
    sectionType: "process",
    requiredFields: ["headline", "items"],
    optionalFields: ["subheadline", "description", "paragraphs", "bullets"],
    sectionGoal: "Clarify engagement steps and delivery process.",
    supportedVariants: ["stacked", "list"],
  },
  {
    sectionType: "benefits",
    requiredFields: ["headline", "items"],
    optionalFields: ["subheadline", "description", "paragraphs", "bullets"],
    sectionGoal: "Highlight practical outcomes and user gains.",
    supportedVariants: ["grid", "list"],
  },
  {
    sectionType: "testimonials",
    requiredFields: ["headline", "items"],
    optionalFields: ["subheadline"],
    sectionGoal: "Provide social proof without fabricated claims.",
    supportedVariants: ["single-quote", "quote-grid", "trust-strip"],
  },
  {
    sectionType: "faq",
    requiredFields: ["headline", "items"],
    optionalFields: ["subheadline"],
    sectionGoal: "Address objections and reduce purchase friction.",
    supportedVariants: ["compact", "expanded"],
  },
  {
    sectionType: "pricing",
    requiredFields: ["headline", "tiers"],
    optionalFields: ["subheadline", "guaranteeLine", "disclaimer"],
    sectionGoal: "Frame offers clearly so buyers can compare and convert.",
    supportedVariants: ["two-tier", "three-tier"],
  },
  {
    sectionType: "contact",
    requiredFields: ["headline", "channels"],
    optionalFields: ["subheadline", "helperText"],
    sectionGoal: "Make outreach steps clear and low-friction.",
    supportedVariants: ["default"],
  },
  {
    sectionType: "cta",
    requiredFields: ["headline", "supportingLine", "ctaText"],
    optionalFields: [
      "urgencyLabel",
      "ctaHref",
      "secondaryCtaText",
      "secondaryCtaHref",
    ],
    sectionGoal: "Drive the user toward the primary action.",
    supportedVariants: ["banner", "block"],
  },
  {
    sectionType: "footer",
    requiredFields: ["shortBlurb"],
    optionalFields: ["legalText", "trustIndicators"],
    sectionGoal: "Close with brand trust and concise legal/context details.",
    supportedVariants: ["default"],
  },
  {
    sectionType: "microcopy",
    requiredFields: [],
    optionalFields: [
      "primaryButtonLabel",
      "secondaryButtonLabel",
      "trustIndicator",
      "helperText",
      "descriptor",
      "shortTagline",
      "bullets",
    ],
    sectionGoal: "Polish UX text details that improve conversion clarity.",
    supportedVariants: ["default"],
  },
];

export function getSectionContract(
  sectionType: ContentSectionType,
): SectionContentContract | undefined {
  return SECTION_CONTENT_CONTRACTS.find((contract) => contract.sectionType === sectionType);
}
