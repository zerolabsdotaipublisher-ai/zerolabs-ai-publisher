import type {
  ManualOverrideParsedInput,
  ManualOverrideRequestInput,
  ManualOverrideScenario,
  ManualOverrideTargetType,
} from "./types";

const VALID_SCENARIOS: ManualOverrideScenario[] = [
  "urgent_publish",
  "hotfix_update",
  "bypass_scheduled_time",
  "bypass_approval",
];

const VALID_TARGET_TYPES: ManualOverrideTargetType[] = [
  "website",
  "website_page",
  "blog_post",
  "article",
  "social_post",
];

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

export function parseManualOverrideBody(input: unknown): ManualOverrideParsedInput {
  const body = (input ?? {}) as ManualOverrideRequestInput;

  const reason = normalizeOptionalString(body.reason);
  if (!reason) {
    throw new Error("override reason is required.");
  }

  if (reason.length < 8) {
    throw new Error("override reason must be at least 8 characters.");
  }

  const scenario = normalizeOptionalString(body.scenario) as ManualOverrideScenario | undefined;
  if (!scenario || !VALID_SCENARIOS.includes(scenario)) {
    throw new Error("override scenario is invalid.");
  }

  const targetContentType = normalizeOptionalString(body.targetContentType) as ManualOverrideTargetType | undefined;
  if (targetContentType && !VALID_TARGET_TYPES.includes(targetContentType)) {
    throw new Error("targetContentType is invalid.");
  }

  const parsed: ManualOverrideParsedInput = {
    structureId: normalizeOptionalString(body.structureId),
    contentId: normalizeOptionalString(body.contentId),
    socialPostId: normalizeOptionalString(body.socialPostId),
    targetContentId: normalizeOptionalString(body.targetContentId),
    targetContentType,
    reason,
    scenario,
    bypassApproval: Boolean(body.bypassApproval),
  };

  if (!parsed.structureId && !parsed.contentId && !parsed.socialPostId) {
    throw new Error("Provide structureId, contentId, or socialPostId.");
  }

  if (parsed.targetContentType === "social_post" && !parsed.socialPostId && !parsed.contentId) {
    throw new Error("social overrides require socialPostId or contentId.");
  }

  return parsed;
}
