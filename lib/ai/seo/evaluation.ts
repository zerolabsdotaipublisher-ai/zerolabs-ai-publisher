export interface SeoEvaluationCriterion {
  name:
    | "title-quality"
    | "description-quality"
    | "keyword-relevance"
    | "canonical-validity"
    | "og-completeness"
    | "page-intent-fit"
    | "fallback-recovery";
  weight: number;
  description: string;
}

export const WEBSITE_SEO_EVALUATION_CRITERIA: SeoEvaluationCriterion[] = [
  {
    name: "title-quality",
    weight: 20,
    description: "Titles are specific, concise, and aligned with page intent.",
  },
  {
    name: "description-quality",
    weight: 20,
    description: "Descriptions are clear, useful, and conversion-oriented.",
  },
  {
    name: "keyword-relevance",
    weight: 15,
    description: "Keywords are relevant to website type, page, and services.",
  },
  {
    name: "canonical-validity",
    weight: 15,
    description: "Canonical URLs are absolute and deterministic per page.",
  },
  {
    name: "og-completeness",
    weight: 10,
    description: "Open Graph metadata is complete and consistent with page metadata.",
  },
  {
    name: "page-intent-fit",
    weight: 10,
    description: "Metadata reflects the goal of each page type.",
  },
  {
    name: "fallback-recovery",
    weight: 10,
    description: "Fallback metadata remains render-safe when AI output is invalid.",
  },
];
