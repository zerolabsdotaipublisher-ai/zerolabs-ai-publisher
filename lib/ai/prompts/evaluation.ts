import type { WebsiteGenerationOutput } from "./types";

export interface EvaluationCriterion {
  name:
    | "structure-adherence"
    | "relevance"
    | "tone-alignment"
    | "readability"
    | "completeness"
    | "hallucination-avoidance"
    | "renderability";
  weight: number;
  description: string;
}

export const WEBSITE_PROMPT_EVALUATION_RUBRIC: EvaluationCriterion[] = [
  {
    name: "structure-adherence",
    weight: 20,
    description: "Output respects required JSON structure and section contracts.",
  },
  {
    name: "relevance",
    weight: 20,
    description: "Generated content reflects brand, audience, and offerings.",
  },
  {
    name: "tone-alignment",
    weight: 15,
    description: "Voice aligns with requested tone and style guidelines.",
  },
  {
    name: "readability",
    weight: 10,
    description: "Copy is concise, clear, and web-friendly.",
  },
  {
    name: "completeness",
    weight: 15,
    description: "All requested sections include meaningful, non-empty content.",
  },
  {
    name: "hallucination-avoidance",
    weight: 10,
    description: "No fabricated facts or unsupported claims.",
  },
  {
    name: "renderability",
    weight: 10,
    description: "Fields are predictable and frontend-component compatible.",
  },
];

export function hasMinimumRenderableShape(
  output: Partial<WebsiteGenerationOutput>,
): boolean {
  return Boolean(
    output.siteTitle &&
      output.tagline &&
      output.sections?.hero?.headline &&
      output.sections?.hero?.primaryCta &&
      output.seo?.title &&
      output.seo?.description,
  );
}
