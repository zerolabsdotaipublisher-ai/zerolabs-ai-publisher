import { buildSeoPromptGuidance, resolveSeoKeywordStrategy } from "@/lib/seo";
import { articleOutputContractJson } from "./schema";
import type { ArticleGenerationInput, ArticleRegenerationOptions, GeneratedArticle } from "./types";

const ARTICLE_GUARDRAILS = [
  "Return valid JSON only.",
  "Do not mention being an AI model.",
  "Avoid filler phrases such as 'in conclusion', 'unlock', 'revolutionary', or 'game-changing'.",
  "Keep headings descriptive, specific, and aligned to the primary keyword cluster.",
  "Use an outline-first structure even when the outline is implied from the input.",
  "Write in a credible editorial voice for the requested audience and depth.",
  "Do not fabricate statistics, quotations, or external references.",
  "If references are requested, include only clearly labeled suggested references or user-provided references.",
];

export function buildArticleSystemPrompt(): string {
  return [
    "You generate structured long-form website articles for a product-owned publishing system.",
    "Produce editorial-quality output that is ready for preview, editing, regeneration, versioning, and website publishing.",
    ...ARTICLE_GUARDRAILS.map((rule) => `- ${rule}`),
  ].join("\n");
}

export function buildArticleGenerationPrompt(input: ArticleGenerationInput): string {
  const seoGuidance = buildSeoPromptGuidance(
    resolveSeoKeywordStrategy({
      title: input.topic,
      keywords: input.keywords,
      keywordInput: input.seo,
      targetAudience: input.targetAudience,
      searchIntent: input.seo?.searchIntent,
    }),
  );

  return [
    "Generate one structured article using the JSON contract below.",
    "Honor article type, tone, depth, length, SEO intent, and outline guidance.",
    "Prefer a coherent long-form article over shallow keyword stuffing.",
    "If the user supplied an outline, preserve its sequence as the H2 structure unless a small editorial improvement is required.",
    "When includeReferences is false, omit the references array or return an empty array.",
    "When includeReferences is true, return only suggested references grounded in the provided context.",
    "Target predictable length by matching the requested section count and target word count.",
    "Use H1 for the article title, H2 for main sections, and H3 only where scannability improves.",
    "Ensure the focus keyword appears naturally in the title, subtitle, introduction, one H2, and meta title.",
    "Return a strong subtitle that sharpens the article promise.",
    "Return section takeaways only when they improve usability.",
    ...seoGuidance.map((line) => `- ${line}`),
    "Input:",
    JSON.stringify(input, null, 2),
    "",
    "Required output contract:",
    articleOutputContractJson(),
  ].join("\n");
}

export function buildArticleSectionPrompt(
  article: GeneratedArticle,
  options: ArticleRegenerationOptions,
): string {
  const section = article.sections.find((entry) => entry.id === options.sectionId);

  return [
    "Regenerate only the requested article section and return JSON with this shape:",
    JSON.stringify(
      {
        section: {
          id: section?.id ?? options.sectionId ?? "section_id",
          heading: "Section heading",
          summary: "One-sentence summary",
          paragraphs: ["Paragraph 1", "Paragraph 2"],
          h3Headings: ["Optional subheading"],
          takeaways: ["Optional takeaway"],
          focusKeyword: article.seo.focusKeyword,
        },
      },
      null,
      2,
    ),
    "",
    "Current article context:",
    JSON.stringify(
      {
        title: article.title,
        subtitle: article.subtitle,
        articleType: options.updatedInput?.articleType ?? article.articleType,
        topic: article.sourceInput.topic,
        targetAudience: article.sourceInput.targetAudience,
        tone: options.updatedInput?.tone ?? article.requirements.tone,
        depth: options.updatedInput?.depth ?? article.requirements.depth,
        length: options.updatedInput?.length ?? article.requirements.length,
        keywords: options.updatedInput?.keywords ?? article.sourceInput.keywords,
        outline: options.updatedInput?.outline ?? article.sourceInput.outline,
        currentSection: section,
      },
      null,
      2,
    ),
    "",
    "Rules:",
    "- Keep the regenerated section aligned with the existing title, subtitle, and SEO focus.",
    "- Preserve the current article flow and avoid changing any other section.",
    "- Return valid JSON only.",
  ].join("\n");
}
