import { buildPromptBundle } from "../prompts";
import type { WebsiteGenerationInput } from "../prompts/types";
import { getSeoStrategyForPageType } from "./strategy";
import type { SeoGenerationContextPage } from "./types";

interface SeoPromptArgs {
  input: WebsiteGenerationInput;
  pages: SeoGenerationContextPage[];
}

function buildPageInstruction(page: SeoGenerationContextPage): string {
  const strategy = getSeoStrategyForPageType(page.pageType);
  return [
    `- pageSlug: ${page.pageSlug}`,
    `  pageType: ${page.pageType}`,
    `  pageTitle: ${page.pageTitle}`,
    `  intent: ${strategy.intent}`,
    `  keywordHints: ${strategy.keywordHints.join(" | ")}`,
    `  sectionHeadlines: ${page.sectionHeadlines.join(" | ") || "none"}`,
  ].join("\n");
}

export function seoOutputContractJson(): string {
  return JSON.stringify(
    {
      site: {
        title: "string",
        description: "string",
        keywords: ["string"],
      },
      pages: [
        {
          pageSlug: "/",
          title: "string",
          description: "string",
          keywords: ["string"],
        },
      ],
    },
    null,
    2,
  );
}

export function buildWebsiteSeoPrompt({ input, pages }: SeoPromptArgs): string {
  const promptBundle = buildPromptBundle(input, { compact: true });

  return [
    "You are generating SEO metadata for Zero Labs AI Publisher.",
    "Use the existing website meaning and produce metadata only.",
    "",
    "PROMPT FOUNDATION:",
    promptBundle.corePrompt,
    "",
    "SEO REQUIREMENTS:",
    "- Titles should generally be <= 60 characters.",
    "- Descriptions should generally be <= 160 characters.",
    "- Keywords should be concise, de-duplicated, and practical.",
    "- Preserve page intent by page type.",
    "",
    "PAGE CONTEXTS:",
    ...pages.map((page) => buildPageInstruction(page)),
    "",
    "OUTPUT CONTRACT (strict JSON):",
    seoOutputContractJson(),
    "",
    "Return JSON only. No markdown fences.",
  ].join("\n");
}
