import type { GeneratedArticle } from "./types";

export const ARTICLE_REQUIRED_SECTION_FIELDS = [
  "heading",
  "summary",
  "paragraphs",
] as const;

export const ARTICLE_OUTPUT_EXAMPLE: Omit<
  GeneratedArticle,
  "id" | "structureId" | "generatedAt" | "updatedAt" | "version"
> = {
  siteTitle: "Zero Labs Insights",
  articleType: "guide",
  title: "How AI Article Generation Helps Content Teams Publish Long-Form Pages Faster",
  subtitle:
    "A structured workflow for building SEO-aware articles that stay editable, previewable, and ready for website publishing.",
  slug: "ai-article-generation-content-teams",
  excerpt:
    "Learn how AI article generation can produce long-form pages with strong structure, SEO metadata, and product-owned publishing controls.",
  introduction:
    "The strongest AI article workflows start with clear topic scope, audience intent, outline guidance, and product-owned validation before the model writes a single paragraph.",
  sections: [
    {
      id: "section_strategy",
      heading: "Start with a topic, audience, and editorial angle",
      summary: "Strong article inputs reduce generic output and improve structure.",
      paragraphs: [
        "Capture the target audience, the primary keyword, and the business outcome before generation begins.",
        "This gives the model enough context to write a useful draft without drifting away from the article purpose.",
      ],
      h3Headings: ["Clarify the search intent", "Set the article scope"],
      takeaways: ["Define the audience early", "Keep the topic narrow enough to be useful"],
      focusKeyword: "AI article generation",
    },
  ],
  conclusion:
    "When article prompts, schema validation, preview, editing, and publishing live in one product workflow, teams can publish faster without creating a disconnected content system.",
  callToAction: "Preview the draft, refine sections, and publish when the article is ready.",
  references: [
    {
      title: "Editorial brief for AI article generation",
      source: "Zero Labs",
      note: "Internal product positioning and editorial guidelines.",
    },
  ],
  seo: {
    metaTitle: "AI Article Generation Guide | Long-Form Content Workflow",
    metaDescription:
      "See how structured AI article generation improves long-form SEO workflows while keeping preview, editing, and publishing in one product-owned system.",
    canonicalPath: "/ai-article-generation-content-teams",
    focusKeyword: "AI article generation",
    secondaryKeywords: ["long-form content workflow", "SEO article generation"],
    tags: ["AI", "SEO", "Content Ops"],
    headingOutline: {
      h1: "How AI Article Generation Helps Content Teams Publish Long-Form Pages Faster",
      h2: ["Start with a topic, audience, and editorial angle"],
      h3: ["Clarify the search intent", "Set the article scope"],
    },
    suggestedInternalLinks: ["/", "/ai-article-generation-content-teams"],
  },
  metadata: {
    authorName: "Zero Labs Editorial",
    createdAt: "2026-04-22T00:00:00.000Z",
    updatedAt: "2026-04-22T00:00:00.000Z",
    versionId: "wver_ws_123_generate_20260422000000_abc123",
    readingTimeMinutes: 7,
    wordCount: 1420,
    tags: ["AI", "SEO", "Content Ops"],
    qualityStatus: "ready",
    qualityNotes: ["Outline preserved", "Heading hierarchy valid"],
    targetAudience: "Content marketing and publishing teams",
    articleType: "guide",
    usedOutline: true,
    referenceCount: 1,
  },
  requirements: {
    articleType: "guide",
    tone: "professional",
    style: "editorial",
    depth: "strategic",
    length: "medium",
    targetWordCount: 1400,
    sectionCount: 5,
    citationsEnabled: true,
  },
  sourceInput: {
    siteTitle: "Zero Labs Insights",
    topic: "AI article generation",
    keywords: ["AI article generation", "SEO article generation"],
    targetAudience: "Content marketing and publishing teams",
    articleType: "guide",
    tone: "professional",
    depth: "strategic",
    length: "medium",
    style: "editorial",
    authorName: "Zero Labs Editorial",
    brandName: "Zero Labs",
    summary: "Explain how AI article workflows support long-form content publishing.",
    callToAction: "Preview the generated article.",
    tags: ["AI", "SEO"],
    outline: [
      "Start with a topic, audience, and editorial angle",
      "Generate a structured outline before drafting sections",
    ],
    userContext: "Align article generation with existing website publishing workflows.",
    references: [
      {
        title: "Editorial brief for AI article generation",
        source: "Zero Labs",
        note: "Internal product positioning and editorial guidelines.",
      },
    ],
    includeReferences: true,
    sectionCount: 5,
  },
  scheduledPublishAt: "2026-04-22T09:00:00.000Z",
  publishedAt: undefined,
};

export function articleOutputContractJson(): string {
  return JSON.stringify(ARTICLE_OUTPUT_EXAMPLE, null, 2);
}
