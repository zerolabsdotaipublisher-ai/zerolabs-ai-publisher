import type { StylePreset, TonePreset, WebsiteGenerationInput } from "./types";

const TONE_GUIDELINES: Record<Exclude<TonePreset, "custom">, string> = {
  professional: "Confident, clear, and precise. Prioritize credibility.",
  casual: "Conversational and simple. Keep language light but purposeful.",
  premium: "Polished and elevated. Emphasize quality and exclusivity.",
  friendly: "Warm and approachable. Encourage trust and clarity.",
  bold: "Direct and energetic. Use strong verbs and decisive statements.",
};

const STYLE_GUIDELINES: Record<Exclude<StylePreset, "custom">, string> = {
  minimalist: "Short sections, low ornamentation, and clean wording.",
  modern: "Contemporary phrasing, benefit-first structure, scannable blocks.",
  corporate: "Structured, formal, and trust-signaling language.",
  editorial: "Narrative-driven copy with polished transitions.",
  playful: "Light and vivid voice while preserving readability.",
};

export const READABILITY_RULES = [
  "Use plain language and avoid jargon unless input requires it.",
  "Prefer short paragraphs and high information density.",
  "Keep headline and CTA text action-oriented.",
];

function describeBackground(
  background: NonNullable<WebsiteGenerationInput["designConfig"]>["pages"][number]["background"],
): string {
  switch (background.type) {
    case "solid":
      return `Solid ${background.primaryColor}`;
    case "blend":
      return `Blend ${background.primaryColor} with ${background.secondaryColor ?? background.primaryColor}`;
    case "gradient":
      return `Gradient ${background.gradientDirection ?? "direction"} from ${background.primaryColor} to ${background.secondaryColor ?? background.primaryColor}`;
    case "image":
      return `Image-led background`;
    case "video":
      return `Video-led background`;
    default:
      return "Background not specified";
  }
}

export function resolvePagePlanGuidance(input: WebsiteGenerationInput): string[] {
  const designConfig = input.designConfig;
  if (!designConfig?.pages?.length) {
    return [];
  }

  return designConfig.pages.map((page, index) => {
    return [
      `Page ${index + 1}: ${page.name}`,
      `layout ${page.layout}`,
      `background ${describeBackground(page.background)}`,
      `body font ${page.typography.bodyFont}`,
      `font mood ${page.typography.fontMood}`,
      `heading font ${page.headings.headingFont}`,
      `heading scale ${page.headings.headingScale}`,
      `content brief ${page.contentPrompt}`,
    ].join(", ");
  });
}

function describeDesignControls(input: WebsiteGenerationInput): string | null {
  const pageGuidance = resolvePagePlanGuidance(input);
  if (!pageGuidance.length) {
    return null;
  }

  return [
    `Planned pages: ${input.designConfig?.pages.map((page) => page.name).join(", ")}.`,
    ...pageGuidance.map((pageSummary) => `Page detail: ${pageSummary}.`),
  ]
    .filter(Boolean)
    .join(" ");
}

export function resolveToneGuidance(input: WebsiteGenerationInput): string {
  const base =
    input.tone === "custom"
      ? "Use a custom tone aligned to provided notes."
      : TONE_GUIDELINES[input.tone];

  return input.customToneNotes ? `${base} Notes: ${input.customToneNotes}` : base;
}

export function resolveStyleGuidance(input: WebsiteGenerationInput): string {
  const base =
    input.style === "custom"
      ? "Use a custom visual-writing style aligned to provided notes."
      : STYLE_GUIDELINES[input.style];
  const designControls = describeDesignControls(input);
  const styleNotes = input.customStyleNotes ? `Notes: ${input.customStyleNotes}` : null;

  return [base, styleNotes, designControls].filter(Boolean).join(" ");
}
