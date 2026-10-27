export const PROFILE_BACKGROUND_TYPES = ["solid", "gradient", "image"] as const;
export const PROFILE_BACKGROUND_PRESETS = ["default", "forest", "midnight", "aurora", "sunset", "image"] as const;
export const PROFILE_VISUAL_STYLES = ["minimal", "soft", "glass", "bold"] as const;
export const PROFILE_CARD_SHAPES = ["square", "rounded", "pill-soft"] as const;
export const PROFILE_ACCENTS = ["mint", "emerald", "blue", "violet", "amber", "neutral"] as const;
export const PROFILE_TEXT_ALIGNMENTS = ["left", "center"] as const;
export const PROFILE_CONTENT_WIDTHS = ["compact", "standard", "wide"] as const;
export const PROFILE_COVER_FOCAL_POINTS = ["top", "center", "bottom"] as const;

export type ProfileBackgroundType = (typeof PROFILE_BACKGROUND_TYPES)[number];
export type ProfileBackgroundPreset = (typeof PROFILE_BACKGROUND_PRESETS)[number];
export type ProfileVisualStyle = (typeof PROFILE_VISUAL_STYLES)[number];
export type ProfileCardShape = (typeof PROFILE_CARD_SHAPES)[number];
export type ProfileAccent = (typeof PROFILE_ACCENTS)[number];
export type ProfileTextAlignment = (typeof PROFILE_TEXT_ALIGNMENTS)[number];
export type ProfileContentWidth = (typeof PROFILE_CONTENT_WIDTHS)[number];
export type ProfileCoverFocalPoint = (typeof PROFILE_COVER_FOCAL_POINTS)[number];

export type ProfileAppearance = {
  coverUrl: string | null;
  coverFocalPoint: ProfileCoverFocalPoint;
  background: {
    type: ProfileBackgroundType;
    preset: ProfileBackgroundPreset;
    imageUrl: string | null;
  };
  visualStyle: ProfileVisualStyle;
  cardShape: ProfileCardShape;
  accent: ProfileAccent;
  textAlignment: ProfileTextAlignment;
  contentWidth: ProfileContentWidth;
};

export type ProfileAppearanceFieldErrors = Partial<Record<
  | "coverUrl"
  | "coverFocalPoint"
  | "background.type"
  | "background.preset"
  | "background.imageUrl"
  | "visualStyle"
  | "cardShape"
  | "accent"
  | "textAlignment"
  | "contentWidth",
  string
>>;

export const DEFAULT_PROFILE_APPEARANCE: ProfileAppearance = {
  coverUrl: null,
  coverFocalPoint: "center",
  background: {
    type: "gradient",
    preset: "default",
    imageUrl: null,
  },
  visualStyle: "soft",
  cardShape: "rounded",
  accent: "mint",
  textAlignment: "left",
  contentWidth: "standard",
};

const PROFILE_MEDIA_URL_MAX_LENGTH = 2048;
const SAFE_URL_PROTOCOLS = new Set(["http:", "https:"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isOneOf<T extends readonly string[]>(value: unknown, values: T): value is T[number] {
  return typeof value === "string" && values.includes(value);
}

function isSafeImageUrl(value: unknown): value is string | null {
  if (value === null) return true;
  if (typeof value !== "string" || value.length > PROFILE_MEDIA_URL_MAX_LENGTH) return false;

  try {
    return SAFE_URL_PROTOCOLS.has(new URL(value).protocol);
  } catch {
    return false;
  }
}

function cloneDefaultAppearance(): ProfileAppearance {
  return {
    ...DEFAULT_PROFILE_APPEARANCE,
    background: { ...DEFAULT_PROFILE_APPEARANCE.background },
  };
}

/**
 * Returns safe defaults for missing or legacy preferences. Invalid persisted
 * values are ignored instead of reaching the renderer as arbitrary CSS.
 */
export function getProfileAppearance(preferences: Record<string, unknown> | null | undefined): ProfileAppearance {
  const result = cloneDefaultAppearance();
  const stored = isRecord(preferences?.profileAppearance) ? preferences.profileAppearance : null;
  if (!stored) return result;

  if (isSafeImageUrl(stored.coverUrl)) result.coverUrl = stored.coverUrl;
  if (isOneOf(stored.coverFocalPoint, PROFILE_COVER_FOCAL_POINTS)) result.coverFocalPoint = stored.coverFocalPoint;
  if (isOneOf(stored.visualStyle, PROFILE_VISUAL_STYLES)) result.visualStyle = stored.visualStyle;
  if (isOneOf(stored.cardShape, PROFILE_CARD_SHAPES)) result.cardShape = stored.cardShape;
  if (isOneOf(stored.accent, PROFILE_ACCENTS)) result.accent = stored.accent;
  if (isOneOf(stored.textAlignment, PROFILE_TEXT_ALIGNMENTS)) result.textAlignment = stored.textAlignment;
  if (isOneOf(stored.contentWidth, PROFILE_CONTENT_WIDTHS)) result.contentWidth = stored.contentWidth;

  if (isRecord(stored.background)) {
    if (isOneOf(stored.background.type, PROFILE_BACKGROUND_TYPES)) result.background.type = stored.background.type;
    if (isOneOf(stored.background.preset, PROFILE_BACKGROUND_PRESETS)) result.background.preset = stored.background.preset;
    if (isSafeImageUrl(stored.background.imageUrl)) result.background.imageUrl = stored.background.imageUrl;
  }

  return result;
}

export function validateProfileAppearance(value: unknown): ProfileAppearanceFieldErrors {
  const errors: ProfileAppearanceFieldErrors = {};
  if (!isRecord(value)) {
    return { visualStyle: "Profile appearance must be an object." };
  }

  if (!isSafeImageUrl(value.coverUrl)) {
    errors.coverUrl = `Cover URL must be a valid http or https URL with at most ${PROFILE_MEDIA_URL_MAX_LENGTH} characters.`;
  }
  if (!isOneOf(value.coverFocalPoint, PROFILE_COVER_FOCAL_POINTS)) {
    errors.coverFocalPoint = "Choose a valid cover focal point.";
  }
  if (!isOneOf(value.visualStyle, PROFILE_VISUAL_STYLES)) errors.visualStyle = "Choose a valid visual style.";
  if (!isOneOf(value.cardShape, PROFILE_CARD_SHAPES)) errors.cardShape = "Choose a valid card shape.";
  if (!isOneOf(value.accent, PROFILE_ACCENTS)) errors.accent = "Choose a valid accent treatment.";
  if (!isOneOf(value.textAlignment, PROFILE_TEXT_ALIGNMENTS)) errors.textAlignment = "Choose a valid text alignment.";
  if (!isOneOf(value.contentWidth, PROFILE_CONTENT_WIDTHS)) errors.contentWidth = "Choose a valid content width.";

  if (!isRecord(value.background)) {
    errors["background.type"] = "Choose a valid background.";
  } else {
    if (!isOneOf(value.background.type, PROFILE_BACKGROUND_TYPES)) {
      errors["background.type"] = "Choose a valid background type.";
    }
    if (!isOneOf(value.background.preset, PROFILE_BACKGROUND_PRESETS)) {
      errors["background.preset"] = "Choose a valid background preset.";
    }
    if (!isSafeImageUrl(value.background.imageUrl)) {
      errors["background.imageUrl"] = `Background image URL must be a valid http or https URL with at most ${PROFILE_MEDIA_URL_MAX_LENGTH} characters.`;
    }
  }

  return errors;
}

export function toProfileAppearance(value: unknown): ProfileAppearance | null {
  if (Object.keys(validateProfileAppearance(value)).length > 0 || !isRecord(value) || !isRecord(value.background)) {
    return null;
  }

  return {
    coverUrl: value.coverUrl as string | null,
    coverFocalPoint: value.coverFocalPoint as ProfileCoverFocalPoint,
    background: {
      type: value.background.type as ProfileBackgroundType,
      preset: value.background.preset as ProfileBackgroundPreset,
      imageUrl: value.background.imageUrl as string | null,
    },
    visualStyle: value.visualStyle as ProfileVisualStyle,
    cardShape: value.cardShape as ProfileCardShape,
    accent: value.accent as ProfileAccent,
    textAlignment: value.textAlignment as ProfileTextAlignment,
    contentWidth: value.contentWidth as ProfileContentWidth,
  };
}

export function mergeProfileAppearance(
  preferences: Record<string, unknown> | null | undefined,
  appearance: ProfileAppearance,
): Record<string, unknown> {
  return {
    ...(preferences ?? {}),
    profileAppearance: appearance,
  };
}
