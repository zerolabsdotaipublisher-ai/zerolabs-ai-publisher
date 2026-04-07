import type { StylePreset, TonePreset } from "../prompts/types";

const TONE_KEYWORDS: Record<TonePreset, string[]> = {
  professional: ["clear", "credible", "precise"],
  casual: ["conversational", "simple", "relaxed"],
  premium: ["elevated", "polished", "exclusive"],
  friendly: ["warm", "approachable", "helpful"],
  bold: ["decisive", "energetic", "direct"],
  custom: ["customized", "on-brand", "intentional"],
};

const STYLE_KEYWORDS: Record<StylePreset, string[]> = {
  minimalist: ["clean", "focused", "short"],
  modern: ["scannable", "contemporary", "benefit-first"],
  corporate: ["structured", "formal", "trust-signaling"],
  editorial: ["narrative", "flowing", "polished"],
  playful: ["light", "vivid", "engaging"],
  custom: ["tailored", "specific", "consistent"],
};

export interface ToneStyleProfile {
  tone: TonePreset;
  style: StylePreset;
  keywords: string[];
  guidance: string;
}

export function resolveToneStyleProfile(
  tone: TonePreset,
  style: StylePreset,
  customToneNotes?: string,
  customStyleNotes?: string,
): ToneStyleProfile {
  const keywords = [...TONE_KEYWORDS[tone], ...STYLE_KEYWORDS[style]];
  const customBits = [customToneNotes?.trim(), customStyleNotes?.trim()].filter(Boolean);

  return {
    tone,
    style,
    keywords,
    guidance: [
      `Tone keywords: ${TONE_KEYWORDS[tone].join(", ")}`,
      `Style keywords: ${STYLE_KEYWORDS[style].join(", ")}`,
      customBits.length > 0 ? `Custom notes: ${customBits.join(" | ")}` : undefined,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}
