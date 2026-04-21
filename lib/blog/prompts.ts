import { blogOutputContractJson } from "./schema";
import type { BlogGenerationInput, BlogRegenerationOptions, GeneratedBlogPost } from "./types";

const BLOG_GUARDRAILS = [
  "Return valid JSON only.",
  "Do not mention being an AI model.",
  "Avoid filler phrases such as 'in conclusion', 'unlock', 'revolutionary', or 'game-changing'.",
  "Keep headings descriptive and SEO-aligned.",
  "Use concrete, readable language for business audiences.",
  "Write original copy and do not fabricate quotes, statistics, or citations.",
];

export function buildBlogSystemPrompt(): string {
  return [
    "You generate structured blog posts for a website publishing product.",
    "Produce editorial-quality output that is ready for preview, human editing, and website publishing.",
    ...BLOG_GUARDRAILS.map((rule) => `- ${rule}`),
  ].join("\n");
}

export function buildBlogGenerationPrompt(input: BlogGenerationInput): string {
  return [
    "Generate a single structured blog post using the following JSON contract.",
    "Honor tone, SEO intent, topic scope, and length requirements.",
    "",
    "Input:",
    JSON.stringify(input, null, 2),
    "",
    "Required output contract:",
    blogOutputContractJson(),
    "",
    "Additional rules:",
    "- Use one H1-equivalent title and section headings that map to H2 items.",
    "- Add optional H3 headings only when they help scannability.",
    "- Ensure the focus keyword appears naturally in the title, introduction, one section heading, and meta title.",
    "- Meta description should be concise and search-friendly.",
    "- Tags must be short and deduplicated.",
    "- Keep the structure compact enough for website preview and editing.",
  ].join("\n");
}

export function buildBlogSectionPrompt(
  blog: GeneratedBlogPost,
  options: BlogRegenerationOptions,
): string {
  const section = blog.sections.find((entry) => entry.id === options.sectionId);

  return [
    "Regenerate only the requested blog section and return JSON with shape:",
    JSON.stringify(
      {
        section: {
          id: section?.id ?? options.sectionId ?? "section_id",
          heading: "Section heading",
          summary: "One-sentence summary",
          paragraphs: ["Paragraph 1", "Paragraph 2"],
          h3Headings: ["Optional subheading"],
          focusKeyword: blog.seo.focusKeyword,
        },
      },
      null,
      2,
    ),
    "",
    "Current blog context:",
    JSON.stringify(
      {
        title: blog.title,
        topic: blog.sourceInput.topic,
        targetAudience: blog.sourceInput.targetAudience,
        tone: options.updatedInput?.tone ?? blog.requirements.tone,
        length: options.updatedInput?.length ?? blog.requirements.length,
        keywords: options.updatedInput?.keywords ?? blog.sourceInput.keywords,
        currentSection: section,
      },
      null,
      2,
    ),
    "",
    "Rules:",
    "- Keep the section aligned with the existing title and SEO focus.",
    "- Do not regenerate any other section.",
    "- Return valid JSON only.",
  ].join("\n");
}
