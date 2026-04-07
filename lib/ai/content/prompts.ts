import {
  buildPromptBundle,
  resolveStyleGuidance,
  resolveToneGuidance,
} from "../prompts";
import { contentOutputContractJson } from "./schemas";
import { contentGuardrailPrompt } from "./guardrails";
import type {
  ContentDensityPreset,
  ContentLengthPreset,
  PageGenerationContext,
} from "./types";

export interface ContentPromptArgs {
  input: Parameters<typeof buildPromptBundle>[0];
  pages: PageGenerationContext[];
  lengthPreset: ContentLengthPreset;
  densityPreset: ContentDensityPreset;
}

function sectionInstruction(sections: string[]): string {
  return sections.map((section) => `- ${section}`).join("\n");
}

function pageInstruction(page: PageGenerationContext): string {
  return [
    `Page slug: ${page.pageSlug}`,
    `Page type: ${page.pageType}`,
    `Required sections:`,
    sectionInstruction(page.sections),
  ].join("\n");
}

function lengthInstruction(lengthPreset: ContentLengthPreset): string {
  if (lengthPreset === "concise") {
    return "Prefer short headlines and concise paragraphs; avoid long-form blocks.";
  }

  if (lengthPreset === "detailed") {
    return "Provide richer detail while staying scannable and conversion-focused.";
  }

  return "Balance clarity and detail with website-ready readability.";
}

function densityInstruction(densityPreset: ContentDensityPreset): string {
  if (densityPreset === "light") {
    return "Keep copy airy, minimal, and highly skimmable.";
  }

  if (densityPreset === "high") {
    return "Increase information density without sounding verbose.";
  }

  return "Use medium density appropriate for product websites.";
}

export function buildWebsiteContentPrompt({
  input,
  pages,
  lengthPreset,
  densityPreset,
}: ContentPromptArgs): string {
  const promptBundle = buildPromptBundle(input, { compact: true });

  return [
    "You are generating website content for Zero Labs AI Publisher.",
    "Reuse the same product meaning and constraints as the existing prompt foundation.",
    "",
    "BASE PROMPT FOUNDATION (Story 3-1):",
    promptBundle.corePrompt,
    "",
    "TONE AND STYLE OVERRIDES:",
    `- ${resolveToneGuidance(input)}`,
    `- ${resolveStyleGuidance(input)}`,
    `- ${lengthInstruction(lengthPreset)}`,
    `- ${densityInstruction(densityPreset)}`,
    "",
    "CONTENT GUARDRAILS:",
    contentGuardrailPrompt(input),
    "",
    "MULTI-PAGE REQUIREMENTS:",
    ...pages.map((page, index) => `Page ${index + 1}\n${pageInstruction(page)}`),
    "",
    "OUTPUT CONTRACT (strict JSON):",
    contentOutputContractJson(),
    "",
    "Return JSON only. No markdown fences. Do not include unsupported sections.",
  ].join("\n");
}
