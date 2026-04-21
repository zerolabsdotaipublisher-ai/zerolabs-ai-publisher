import type { GeneratedBlogPost } from "./types";

export const BLOG_REQUIRED_SECTION_FIELDS = [
  "heading",
  "summary",
  "paragraphs",
] as const;

export const BLOG_OUTPUT_EXAMPLE: Omit<
  GeneratedBlogPost,
  "id" | "structureId" | "generatedAt" | "updatedAt" | "version"
> = {
  siteTitle: "AI Publisher Journal",
  title: "How AI Blog Generation Improves Content Velocity Without Losing Quality",
  slug: "ai-blog-generation-improves-content-velocity",
  excerpt:
    "A practical guide to producing search-friendly blog posts with structured AI workflows, human review, and reusable publishing infrastructure.",
  introduction:
    "AI blog generation works best when teams define clear structure, SEO intent, and editorial guardrails before asking a model to draft content.",
  sections: [
    {
      id: "section_strategy",
      heading: "Start with a clear topic, audience, and SEO angle",
      summary: "Strong inputs produce stronger drafts.",
      paragraphs: [
        "Define the primary reader, the business goal, and the core keyword before generation begins.",
        "This keeps the output focused, useful, and aligned with the publishing workflow.",
      ],
      h3Headings: ["Clarify the search intent", "Limit the topic scope"],
      focusKeyword: "AI blog generation",
    },
  ],
  conclusion:
    "With the right schema, prompts, and validation rules, AI can accelerate blog production while keeping the final output ready for editing, preview, and publishing.",
  callToAction: "Review the draft, refine the sections that matter most, and publish with confidence.",
  seo: {
    metaTitle: "AI Blog Generation Guide | Faster Content Workflows",
    metaDescription:
      "Learn how structured AI blog generation improves SEO, content quality, and publishing speed without sacrificing editorial control.",
    canonicalPath: "/ai-blog-generation-improves-content-velocity",
    focusKeyword: "AI blog generation",
    secondaryKeywords: ["SEO blog workflow", "AI content publishing"],
    tags: ["AI", "SEO", "Content Ops"],
    headingOutline: {
      h1: "How AI Blog Generation Improves Content Velocity Without Losing Quality",
      h2: ["Start with a clear topic, audience, and SEO angle"],
      h3: ["Clarify the search intent", "Limit the topic scope"],
    },
  },
  metadata: {
    authorName: "Zero Labs Editorial",
    createdAt: "2026-04-21T00:00:00.000Z",
    updatedAt: "2026-04-21T00:00:00.000Z",
    versionId: "wver_ws_123_generate_20260421000000_abc123",
    readingTimeMinutes: 5,
    wordCount: 780,
    tags: ["AI", "SEO", "Content Ops"],
    qualityStatus: "ready",
    qualityNotes: ["No filler phrases detected", "SEO metadata present"],
  },
  requirements: {
    tone: "professional",
    style: "editorial",
    length: "medium",
    targetWordCount: 900,
    sectionCount: 4,
  },
  sourceInput: {
    siteTitle: "AI Publisher Journal",
    topic: "AI blog generation",
    keywords: ["AI blog generation", "SEO blog workflow"],
    targetAudience: "Content marketers and publishing teams",
    tone: "professional",
    length: "medium",
    style: "editorial",
    authorName: "Zero Labs Editorial",
    brandName: "Zero Labs",
    summary: "Explain how structured AI blog workflows improve publishing.",
    callToAction: "Preview the generated draft.",
    tags: ["AI", "SEO"],
    sectionCount: 4,
  },
  scheduledPublishAt: "2026-04-22T09:00:00.000Z",
  publishedAt: undefined,
};

export function blogOutputContractJson(): string {
  return JSON.stringify(BLOG_OUTPUT_EXAMPLE, null, 2);
}
