import type { ContentSectionType } from "./types";

export interface SectionContentContract {
  sectionType: ContentSectionType;
  requiredFields: string[];
  optionalFields: string[];
  sectionGoal: string;
}

export const SECTION_CONTENT_CONTRACTS: SectionContentContract[] = [
  {
    sectionType: "hero",
    requiredFields: ["headline", "subheadline", "supportingCopy", "primaryCta"],
    optionalFields: ["secondaryCta"],
    sectionGoal: "Lead with value proposition and conversion-focused action.",
  },
  {
    sectionType: "about",
    requiredFields: ["headline", "paragraphs"],
    optionalFields: ["subheadline", "bullets"],
    sectionGoal: "Establish credibility and brand context.",
  },
  {
    sectionType: "services",
    requiredFields: ["headline", "items"],
    optionalFields: ["subheadline", "paragraphs", "bullets"],
    sectionGoal: "Present offerings with outcome-oriented descriptions.",
  },
  {
    sectionType: "features",
    requiredFields: ["headline", "paragraphs"],
    optionalFields: ["subheadline", "bullets"],
    sectionGoal: "Explain key product capabilities in scannable form.",
  },
  {
    sectionType: "process",
    requiredFields: ["headline", "paragraphs"],
    optionalFields: ["subheadline", "bullets"],
    sectionGoal: "Clarify engagement steps and delivery process.",
  },
  {
    sectionType: "benefits",
    requiredFields: ["headline", "paragraphs"],
    optionalFields: ["subheadline", "bullets"],
    sectionGoal: "Highlight practical outcomes and user gains.",
  },
  {
    sectionType: "testimonials",
    requiredFields: ["headline", "items"],
    optionalFields: ["subheadline"],
    sectionGoal: "Provide social proof without fabricated claims.",
  },
  {
    sectionType: "faq",
    requiredFields: ["headline", "items"],
    optionalFields: [],
    sectionGoal: "Address objections and reduce purchase friction.",
  },
  {
    sectionType: "contact",
    requiredFields: ["headline", "channels"],
    optionalFields: ["subheadline", "helperText"],
    sectionGoal: "Make outreach steps clear and low-friction.",
  },
  {
    sectionType: "cta",
    requiredFields: ["headline", "supportingLine", "ctaText"],
    optionalFields: ["urgencyLabel"],
    sectionGoal: "Drive the user toward the primary action.",
  },
  {
    sectionType: "footer",
    requiredFields: ["shortBlurb"],
    optionalFields: ["legalText", "trustIndicators"],
    sectionGoal: "Close with brand trust and concise legal/context details.",
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
  },
];

export function getSectionContract(
  sectionType: ContentSectionType,
): SectionContentContract | undefined {
  return SECTION_CONTENT_CONTRACTS.find((contract) => contract.sectionType === sectionType);
}
