import type { BlogGenerationInput } from "./types";

export interface BlogScenario {
  id: string;
  label: string;
  input: BlogGenerationInput;
}

export const blogGenerationScenarios: BlogScenario[] = [
  {
    id: "saas-seo",
    label: "SaaS SEO explainer",
    input: {
      siteTitle: "Zero Labs AI Publisher",
      topic: "AI blog generation for SaaS teams",
      keywords: ["AI blog generation", "SaaS SEO workflow", "content operations"],
      targetAudience: "SaaS marketing teams",
      tone: "professional",
      length: "medium",
      style: "editorial",
      authorName: "Zero Labs Editorial",
      brandName: "Zero Labs",
      summary: "Explain how structured AI workflows help SaaS teams publish faster.",
      callToAction: "Preview the generated article.",
      tags: ["AI", "SaaS", "SEO"],
      sectionCount: 4,
      publishAt: "2026-04-22T09:00:00.000Z",
      seo: {
        primaryKeyword: "AI blog generation",
        secondaryKeywords: ["SaaS SEO workflow", "content operations"],
        targetAudience: "SaaS marketing teams",
        searchIntent: "informational",
      },
    },
  },
  {
    id: "founder-thought-leadership",
    label: "Founder thought leadership article",
    input: {
      siteTitle: "Founder Notes",
      topic: "How founders can scale thought leadership with AI drafting",
      keywords: ["founder thought leadership", "AI drafting", "editorial workflows"],
      targetAudience: "Startup founders and content leads",
      tone: "friendly",
      length: "long",
      style: "editorial",
      authorName: "Founder Office",
      summary: "Discuss how AI-assisted writing supports consistent publishing without losing voice.",
      callToAction: "Edit the sections before publishing.",
      tags: ["Founder", "AI", "Publishing"],
      sectionCount: 5,
    },
  },
];
