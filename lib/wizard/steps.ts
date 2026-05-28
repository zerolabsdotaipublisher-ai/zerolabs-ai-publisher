import type { WizardStepDefinition } from "./types";

export const WIZARD_FORM_STEPS: WizardStepDefinition[] = [
  {
    id: "page-setup",
    title: "Pages setup",
    purpose: "Choose page count and name each page.",
    required: true,
    skippable: false,
  },
  {
    id: "page-design",
    title: "Design each page",
    purpose: "Set layout, background, typography, and purpose for every page.",
    required: true,
    skippable: false,
  },
  {
    id: "brand-content",
    title: "Brand and content",
    purpose: "Capture brand, tone, and supporting content inputs.",
    required: true,
    skippable: false,
  },
  {
    id: "review-confirm",
    title: "Review",
    purpose: "Confirm inputs before generation.",
    required: true,
    skippable: false,
  },
];

export const WIZARD_SYSTEM_STEPS: WizardStepDefinition[] = [
  {
    id: "loading",
    title: "Generating",
    purpose: "Run AI generation pipeline.",
    required: true,
    skippable: false,
  },
  {
    id: "success",
    title: "Success",
    purpose: "Enter generated website output.",
    required: true,
    skippable: false,
  },
];

export const WIZARD_STEP_SEQUENCE = [
  ...WIZARD_FORM_STEPS,
  ...WIZARD_SYSTEM_STEPS,
].map((step) => step.id);
