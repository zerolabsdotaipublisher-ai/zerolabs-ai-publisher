import type { WizardStepDefinition } from "./types";

export const WIZARD_FORM_STEPS: WizardStepDefinition[] = [
  {
    id: "website-type",
    title: "Website type",
    purpose: "Choose the website category and intent.",
    required: true,
    skippable: false,
  },
  {
    id: "business-info",
    title: "Business info",
    purpose: "Capture core brand details and goals.",
    required: true,
    skippable: false,
  },
  {
    id: "style-theme",
    title: "Style and theme",
    purpose: "Choose voice and visual direction.",
    required: true,
    skippable: false,
  },
  {
    id: "content-input",
    title: "Content inputs",
    purpose: "Add optional depth and customization.",
    required: false,
    skippable: true,
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
