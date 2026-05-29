import type { TonePreset } from "@/lib/ai/structure";
import type { RegenerationApplyPayload, RegenerationMode, RegenerationPreviewPayload, RegenerationRequest } from "./types";

const VALID_LEVELS = ["full", "section", "field"] as const;
const VALID_MODES = ["rewrite", "improve", "expand", "shorten", "simplify", "adjust_tone"] as const;
const VALID_FIELDS = ["headline", "title", "summary", "cta", "caption"] as const;
const VALID_TONES: TonePreset[] = ["professional", "casual", "premium", "friendly", "bold", "custom"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function asTrimmedString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function normalizeRegenerationContentIdParam(value: string): string {
  return decodeURIComponent(value).trim();
}

export function parseRegenerationRequest(value: unknown): { request?: RegenerationRequest; validationErrors: string[] } {
  const validationErrors: string[] = [];
  if (!isRecord(value)) {
    return { validationErrors: ["request payload is required"] };
  }

  const level = value.level;
  const mode = value.mode;
  const target = isRecord(value.target) ? value.target : {};
  const instructions = asTrimmedString(value.instructions);
  const tone = asTrimmedString(value.tone);

  if (!VALID_LEVELS.includes(level as (typeof VALID_LEVELS)[number])) {
    validationErrors.push("level must be full, section, or field");
  }
  if (!VALID_MODES.includes(mode as (typeof VALID_MODES)[number])) {
    validationErrors.push("mode must be rewrite, improve, expand, shorten, simplify, or adjust_tone");
  }
  if (tone && !VALID_TONES.includes(tone as TonePreset)) {
    validationErrors.push("tone must be a supported tone preset");
  }

  const sectionId = asTrimmedString(target.sectionId);
  const fieldKey = asTrimmedString(target.fieldKey);
  if (level === "section" && !sectionId) {
    validationErrors.push("target.sectionId is required for section-level regeneration");
  }
  if (level === "field" && !fieldKey) {
    validationErrors.push("target.fieldKey is required for field-level regeneration");
  }
  if (fieldKey && !VALID_FIELDS.includes(fieldKey as (typeof VALID_FIELDS)[number])) {
    validationErrors.push("target.fieldKey must be headline, title, summary, cta, or caption");
  }
  if (mode === "adjust_tone" && !tone) {
    validationErrors.push("tone is required when mode is adjust_tone");
  }

  if (validationErrors.length > 0) {
    return { validationErrors };
  }

  return {
    request: {
      level: level as RegenerationRequest["level"],
      mode: mode as RegenerationMode,
      target: {
        sectionId,
        fieldKey: fieldKey as RegenerationRequest["target"]["fieldKey"],
      },
      tone: tone as TonePreset | undefined,
      instructions,
    },
    validationErrors: [],
  };
}

export function parseRegenerationPreviewPayload(value: unknown): { payload?: RegenerationPreviewPayload; validationErrors: string[] } {
  if (!isRecord(value)) {
    return { validationErrors: ["request body must be an object"] };
  }

  const parsed = parseRegenerationRequest(value.request);
  if (!parsed.request) {
    return { validationErrors: parsed.validationErrors };
  }

  return { payload: { request: parsed.request }, validationErrors: [] };
}

export function parseRegenerationApplyPayload(value: unknown): { payload?: RegenerationApplyPayload; validationErrors: string[] } {
  if (!isRecord(value)) {
    return { validationErrors: ["request body must be an object"] };
  }

  const parsed = parseRegenerationRequest(value.request);
  if (!parsed.request) {
    return { validationErrors: parsed.validationErrors };
  }
  if (!isRecord(value.regeneratedDraft)) {
    return { validationErrors: ["regeneratedDraft is required"] };
  }
  const regeneratedDraft = value.regeneratedDraft as Record<string, unknown>;
  if (
    typeof regeneratedDraft.contentId !== "string"
    || typeof regeneratedDraft.type !== "string"
    || typeof regeneratedDraft.sourceId !== "string"
  ) {
    return { validationErrors: ["regeneratedDraft must include contentId, type, and sourceId"] };
  }

  return {
    payload: {
      request: parsed.request,
      regeneratedDraft: value.regeneratedDraft as unknown as RegenerationApplyPayload["regeneratedDraft"],
    },
    validationErrors: [],
  };
}
