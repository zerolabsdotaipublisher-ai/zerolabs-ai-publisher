import type { WizardScenario } from "./types";

export const wizardScenarios: WizardScenario[] = [
  {
    id: "business-full-input",
    name: "Business website with full inputs",
    goal: "Validate all required fields and optional customizations feed generation.",
    notes: "Covers required flow plus testimonials/contact info and review confirmation.",
  },
  {
    id: "portfolio-light-input",
    name: "Portfolio low-input path",
    goal: "Validate optional content step can be skipped with only required inputs.",
    notes: "Ensures required/optional separation and reduced-friction completion.",
  },
  {
    id: "personal-brand-backtracking",
    name: "Backtracking and edits",
    goal: "Confirm users can move backward, edit fields, and keep previous data.",
    notes: "Validates state persistence and editable review flow.",
  },
  {
    id: "mobile-wizard-flow",
    name: "Mobile responsive flow",
    goal: "Confirm stepper, forms, and navigation controls remain usable on mobile.",
    notes: "Covers stacked layout and touch-friendly controls.",
  },
];
