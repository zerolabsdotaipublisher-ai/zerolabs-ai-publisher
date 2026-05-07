import type { ArticleGenerationInput } from "@/lib/article";
import type { BlogGenerationInput } from "@/lib/blog";
import type { SocialGenerationInput } from "@/lib/social";
import type { WebsiteGenerationInput } from "@/lib/ai/prompts/types";
import type { RegenerationRequest } from "./types";

const MODE_CONSTRAINTS: Record<RegenerationRequest["mode"], string> = {
  rewrite: "Rewrite content while preserving factual meaning and intent.",
  improve: "Improve clarity, flow, and specificity without changing core intent.",
  expand: "Expand detail and examples while staying on-topic.",
  shorten: "Shorten content while preserving key message and CTA.",
  simplify: "Simplify language for faster scanning and broader readability.",
  adjust_tone: "Adjust the tone while preserving intent and factual meaning.",
};
const MAX_EXISTING_CONSTRAINTS = 4;
const MAX_TOTAL_CONSTRAINTS = 5;

function trimInstruction(value: string | undefined): string | undefined {
  return value?.trim() ? value.trim() : undefined;
}

export function buildRegenerationConstraint(request: RegenerationRequest): string {
  const parts = [MODE_CONSTRAINTS[request.mode]];
  if (request.level === "section" && request.target.sectionId) {
    parts.push(`Only target section ${request.target.sectionId}.`);
  }
  if (request.level === "field" && request.target.fieldKey) {
    parts.push(`Only target field ${request.target.fieldKey}.`);
  }
  if (request.mode === "adjust_tone" && request.tone) {
    parts.push(`Use ${request.tone} tone.`);
  }
  const extra = trimInstruction(request.instructions);
  if (extra) {
    parts.push(extra);
  }
  return parts.join(" ");
}

export function applyModeToWebsiteInput(input: WebsiteGenerationInput, request: RegenerationRequest): Partial<WebsiteGenerationInput> {
  const constraints = Array.isArray(input.constraints) ? input.constraints.slice(0, MAX_EXISTING_CONSTRAINTS) : [];
  constraints.push(buildRegenerationConstraint(request));

  return {
    tone: request.mode === "adjust_tone" && request.tone ? request.tone : input.tone,
    constraints: constraints.slice(-MAX_TOTAL_CONSTRAINTS),
  };
}

export function applyModeToBlogInput(input: BlogGenerationInput, request: RegenerationRequest): Partial<BlogGenerationInput> {
  return {
    tone: request.mode === "adjust_tone" && request.tone ? request.tone : input.tone,
    length: request.mode === "expand" ? "long" : request.mode === "shorten" || request.mode === "simplify" ? "short" : input.length,
    summary: request.instructions ? `${input.summary ?? input.topic}\n${request.instructions}` : input.summary,
  };
}

export function applyModeToArticleInput(input: ArticleGenerationInput, request: RegenerationRequest): Partial<ArticleGenerationInput> {
  return {
    tone: request.mode === "adjust_tone" && request.tone ? request.tone : input.tone,
    length: request.mode === "expand"
      ? "extended"
      : request.mode === "shorten" || request.mode === "simplify"
        ? "short"
        : input.length,
    depth: request.mode === "simplify" ? "overview" : input.depth,
    userContext: [input.userContext, request.instructions].filter(Boolean).join("\n").trim() || input.userContext,
  };
}

export function applyModeToSocialInput(input: SocialGenerationInput, request: RegenerationRequest): Partial<SocialGenerationInput> {
  return {
    tone: request.mode === "adjust_tone" && request.tone ? request.tone : input.tone,
    includeEmoji: request.mode === "simplify" ? false : input.includeEmoji,
    callToActionHint: request.instructions || input.callToActionHint,
  };
}
