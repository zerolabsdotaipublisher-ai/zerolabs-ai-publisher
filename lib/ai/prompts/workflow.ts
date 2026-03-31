import type { WebsiteSectionName } from "./types";

export interface PromptWorkflowStep {
  id: "outline" | "sections" | "normalize";
  objective: string;
  output: string;
}

export const WEBSITE_PROMPT_WORKFLOW: PromptWorkflowStep[] = [
  {
    id: "outline",
    objective:
      "Generate a section plan and key messaging anchors from user input.",
    output: "Ordered section outline with one-line intent for each section.",
  },
  {
    id: "sections",
    objective: "Generate section-level copy using modular prompts.",
    output: "Section JSON payloads for hero/about/services/testimonials/cta/contact/footer.",
  },
  {
    id: "normalize",
    objective:
      "Assemble sections into the final WebsiteGenerationOutput JSON contract.",
    output: "Validated and render-friendly output object.",
  },
];

export function defaultSectionsForWorkflow(): WebsiteSectionName[] {
  return ["hero", "about", "services", "testimonials", "cta", "contact", "footer"];
}
