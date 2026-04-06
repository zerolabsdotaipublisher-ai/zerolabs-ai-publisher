import type {
  ColorStrategyHook,
  EmphasisPattern,
  LayoutMetadata,
  LayoutStyleTag,
  SpacingScale,
} from "./types";

function mapStyleTag(stylePreset: string): LayoutStyleTag {
  if (stylePreset === "editorial") return "editorial";
  if (stylePreset === "corporate") return "corporate";
  if (stylePreset === "minimalist") return "minimal";
  return "modern";
}

function mapEmphasisPattern(tone: string): EmphasisPattern {
  if (tone === "bold" || tone === "premium") return "hero-contrast";
  if (tone === "friendly") return "alternating";
  return "uniform";
}

function mapColorStrategy(stylePreset: string): ColorStrategyHook {
  if (stylePreset === "corporate") return "brand-primary";
  if (stylePreset === "playful") return "high-contrast";
  return "neutral-accent";
}

export function generateLayoutMetadata(
  styleTone: string,
  stylePreset: string,
  spacingScale: SpacingScale,
  typographyMood: string,
): LayoutMetadata {
  return {
    themeMode: styleTone === "premium" ? "dark" : "light",
    layoutStyleTag: mapStyleTag(stylePreset),
    spacingScale,
    emphasisPattern: mapEmphasisPattern(styleTone),
    typographyMood,
    colorStrategy: mapColorStrategy(stylePreset),
  };
}
