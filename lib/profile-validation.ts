export type EditableProfileUpdate = {
  full_name?: string | null;
  avatar_url?: string | null;
};

export type EditableProfileFieldErrors = Partial<Record<keyof EditableProfileUpdate, string>>;

export const PROFILE_FULL_NAME_MAX_LENGTH = 120;
export const PROFILE_AVATAR_URL_MAX_LENGTH = 2048;

const PROFILE_URL_PROTOCOLS = new Set(["http:", "https:"]);

function normalizeOptionalField(value: string | null | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function normalizeEditableProfileUpdate(input: EditableProfileUpdate): EditableProfileUpdate {
  const normalized: EditableProfileUpdate = {};

  if ("full_name" in input) {
    normalized.full_name = normalizeOptionalField(input.full_name);
  }

  if ("avatar_url" in input) {
    normalized.avatar_url = normalizeOptionalField(input.avatar_url);
  }

  return normalized;
}

export function validateEditableProfileUpdate(input: EditableProfileUpdate): EditableProfileFieldErrors {
  const errors: EditableProfileFieldErrors = {};

  if (input.full_name !== undefined && input.full_name !== null) {
    if (input.full_name.length > PROFILE_FULL_NAME_MAX_LENGTH) {
      errors.full_name = `Full name must be ${PROFILE_FULL_NAME_MAX_LENGTH} characters or fewer.`;
    }
  }

  if (input.avatar_url !== undefined && input.avatar_url !== null) {
    if (input.avatar_url.length > PROFILE_AVATAR_URL_MAX_LENGTH) {
      errors.avatar_url = `Avatar URL must be ${PROFILE_AVATAR_URL_MAX_LENGTH} characters or fewer.`;
      return errors;
    }

    try {
      const parsed = new URL(input.avatar_url);

      if (!PROFILE_URL_PROTOCOLS.has(parsed.protocol)) {
        errors.avatar_url = "Avatar URL must start with http:// or https://.";
      }
    } catch {
      errors.avatar_url = "Enter a valid avatar URL.";
    }
  }

  return errors;
}
