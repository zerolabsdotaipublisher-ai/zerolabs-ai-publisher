import type { ArticleGenerationInput } from "./types";

export interface ArticleScenario {
  id: string;
  label: string;
  input: ArticleGenerationInput;
}

export const articleGenerationScenarios: ArticleScenario[] = [
  {
    id: "saas-guide",
    label: "SaaS guide article",
    input: {
      siteTitle: "Zero Labs AI Publisher",
      topic: "AI article generation for SaaS teams",
      keywords: ["AI article generation", "SaaS SEO workflow", "content operations"],
      targetAudience: "SaaS marketing teams",
      articleType: "guide",
      tone: "professional",
      depth: "strategic",
      length: "medium",
      style: "editorial",
      authorName: "Zero Labs Editorial",
      brandName: "Zero Labs",
      summary: "Explain how structured AI article workflows help SaaS teams publish long-form content faster.",
      callToAction: "Preview the generated article.",
      tags: ["AI", "SaaS", "SEO"],
      outline: [
        "Define the article strategy before drafting",
        "Generate a structured outline that mirrors search intent",
        "Draft sections with quality and SEO guardrails",
        "Preview, edit, and publish inside the website pipeline",
      ],
      includeReferences: true,
      sectionCount: 4,
      publishAt: "2026-04-22T09:00:00.000Z",
      seo: {
        primaryKeyword: "AI article generation",
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
      topic: "How founders scale thought leadership with AI drafting",
      keywords: ["founder thought leadership", "AI drafting", "editorial workflows"],
      targetAudience: "Startup founders and content leads",
      articleType: "thought-leadership",
      tone: "friendly",
      depth: "expert",
      length: "long",
      style: "editorial",
      authorName: "Founder Office",
      summary: "Discuss how AI-assisted writing supports consistent publishing without losing voice.",
      callToAction: "Edit the sections before publishing.",
      tags: ["Founder", "AI", "Publishing"],
      sectionCount: 5,
    },
  },
  {
    id: "industry-news-brief",
    label: "News-style industry article",
    input: {
      siteTitle: "Industry Monitor",
      topic: "Recent AI publishing workflow updates",
      keywords: ["AI publishing workflow", "content automation news", "editorial ops"],
      targetAudience: "Editorial operations leaders",
      articleType: "news-style",
      tone: "professional",
      depth: "overview",
      length: "short",
      style: "modern",
      summary: "Summarize recent shifts in AI publishing infrastructure for operations leaders.",
      includeReferences: false,
      sectionCount: 3,
    },
  },
  {
    id: "extended-b2b-explainer",
    label: "Extended long-form explainer",
    input: {
      siteTitle: "B2B Growth Library",
      topic: "Designing product-owned AI article systems",
      keywords: ["AI article system", "product-owned content", "website publishing pipeline"],
      targetAudience: "B2B content platform teams",
      articleType: "long-form-article",
      tone: "premium",
      depth: "expert",
      length: "extended",
      style: "editorial",
      summary: "Explain why AI article systems should remain inside the product-owned publishing layer.",
      callToAction: "Review the full draft and regenerate weak sections.",
      outline: [
        "Why product ownership matters for article generation",
        "Where shared platform boundaries should stop",
        "How schema, storage, and website pages stay aligned",
        "Why preview, editing, and versioning belong in the same workflow",
        "How to scale performance without creating a second content system",
      ],
      includeReferences: true,
      references: [
        {
          title: "Internal publishing architecture brief",
          source: "Zero Labs",
          note: "Used as input context for the article.",
        },
      ],
      sectionCount: 6,
    },
  },
];
