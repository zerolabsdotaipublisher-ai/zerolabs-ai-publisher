export interface ContentEvaluationCriterion {
  name:
    | "readability"
    | "relevance"
    | "tone-alignment"
    | "completeness"
    | "section-fit"
    | "conversion-clarity"
    | "non-repetition"
    | "renderability";
  weight: number;
  description: string;
}

export const WEBSITE_CONTENT_EVALUATION_CRITERIA: ContentEvaluationCriterion[] = [
  {
    name: "readability",
    weight: 15,
    description: "Copy is scannable, concise, and easy to understand.",
  },
  {
    name: "relevance",
    weight: 15,
    description: "Messaging is aligned with brand, audience, and services.",
  },
  {
    name: "tone-alignment",
    weight: 12,
    description: "Voice consistently matches selected tone and style.",
  },
  {
    name: "completeness",
    weight: 14,
    description: "Each required page and section has meaningful content.",
  },
  {
    name: "section-fit",
    weight: 12,
    description: "Section-level content matches the purpose of each section type.",
  },
  {
    name: "conversion-clarity",
    weight: 12,
    description: "CTA and microcopy provide clear, action-oriented direction.",
  },
  {
    name: "non-repetition",
    weight: 10,
    description: "Content avoids repetitive phrasing across sections/pages.",
  },
  {
    name: "renderability",
    weight: 10,
    description: "Output structure is renderer-compatible and storable.",
  },
];
