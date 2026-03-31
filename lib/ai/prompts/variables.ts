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

  return input.customStyleNotes
    ? `${base} Notes: ${input.customStyleNotes}`
    : base;
}
