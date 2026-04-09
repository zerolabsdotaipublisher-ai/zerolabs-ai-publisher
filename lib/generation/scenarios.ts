export interface GenerationScenario {
  id: string;
  name: string;
  expectedBehavior: string;
}

export const generationScenarios: GenerationScenario[] = [
  {
    id: "valid-generation",
    name: "Valid generation from wizard handoff",
    expectedBehavior:
      "Inputs load from wizard, generation runs structure + content, success links to preview.",
  },
  {
    id: "validation-failure",
    name: "Validation failure before submit",
    expectedBehavior:
      "Invalid required inputs are blocked with inline interface errors and no API calls.",
  },
  {
    id: "generation-failure-retry",
    name: "Generation failure and retry",
    expectedBehavior:
      "Failure shows error state with preserved inputs, retry reruns the same pipeline.",
  },
  {
    id: "success-preview",
    name: "Success to preview handoff",
    expectedBehavior: "Success state exposes preview link to /generated-sites/{id} and tracks preview click.",
  },
  {
    id: "regenerate-flow",
    name: "Edit and regenerate flow",
    expectedBehavior:
      "User edits inputs, regenerates, and receives updated success state without leaving interface.",
  },
];
