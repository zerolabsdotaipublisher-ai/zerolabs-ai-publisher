export type EditableProfileUpdate = {
  full_name?: string | null;
  avatar_url?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  suffix?: string | null;
  username?: string | null;
  country?: string | null;
  date_of_birth?: string | null;
};

export type EditableProfileFieldErrors = Partial<Record<keyof EditableProfileUpdate, string>>;

export const PROFILE_FULL_NAME_MAX_LENGTH = 120;
export const PROFILE_AVATAR_URL_MAX_LENGTH = 2048;
export const PROFILE_NAME_MAX_LENGTH = 120;
export const PROFILE_USERNAME_MAX_LENGTH = 64;
export const PROFILE_COUNTRY_MAX_LENGTH = 120;

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


  if ("first_name" in input) normalized.first_name = normalizeOptionalField(input.first_name);
  if ("middle_name" in input) normalized.middle_name = normalizeOptionalField(input.middle_name);
  if ("last_name" in input) normalized.last_name = normalizeOptionalField(input.last_name);
  if ("suffix" in input) normalized.suffix = normalizeOptionalField(input.suffix);
  if ("username" in input) normalized.username = normalizeOptionalField(input.username);
  if ("country" in input) normalized.country = normalizeOptionalField(input.country);
  if ("date_of_birth" in input) normalized.date_of_birth = normalizeOptionalField(input.date_of_birth);

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


  if (input.first_name !== undefined && input.first_name !== null) {
    if (input.first_name.length > PROFILE_NAME_MAX_LENGTH) {
      errors.first_name = `First name must be ${PROFILE_NAME_MAX_LENGTH} characters or fewer.`;
    }
  }

  if (input.middle_name !== undefined && input.middle_name !== null) {
    if (input.middle_name.length > PROFILE_NAME_MAX_LENGTH) {
      errors.middle_name = `Middle name must be ${PROFILE_NAME_MAX_LENGTH} characters or fewer.`;
    }
  }

  if (input.last_name !== undefined && input.last_name !== null) {
    if (input.last_name.length > PROFILE_NAME_MAX_LENGTH) {
      errors.last_name = `Last name must be ${PROFILE_NAME_MAX_LENGTH} characters or fewer.`;
    }
  }

  if (input.suffix !== undefined && input.suffix !== null) {
    if (input.suffix.length > PROFILE_NAME_MAX_LENGTH) {
      errors.suffix = `Suffix must be ${PROFILE_NAME_MAX_LENGTH} characters or fewer.`;
    }
  }

  if (input.username !== undefined && input.username !== null) {
    if (input.username.length > PROFILE_USERNAME_MAX_LENGTH) {
      errors.username = `Username must be ${PROFILE_USERNAME_MAX_LENGTH} characters or fewer.`;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(input.username)) {
      errors.username = `Username can only contain letters, numbers, underscores, dots, and hyphens.`;
    }
  }

  if (input.country !== undefined && input.country !== null) {
    if (input.country.length > PROFILE_COUNTRY_MAX_LENGTH) {
      errors.country = `Country must be ${PROFILE_COUNTRY_MAX_LENGTH} characters or fewer.`;
    }
  }

  if (input.date_of_birth !== undefined && input.date_of_birth !== null) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date_of_birth)) {
      errors.date_of_birth = "Date of birth must be in YYYY-MM-DD format.";
    } else {
      const parsed = new Date(input.date_of_birth);
      if (isNaN(parsed.getTime())) {
        errors.date_of_birth = "Invalid date of birth.";
      }
    }
  }

  return errors;
}
