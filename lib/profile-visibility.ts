export type ProfileVisibility = {
  showAge: boolean;
  showLocation: boolean;
};

export type ProfileVisibilityFieldErrors = Partial<Record<keyof ProfileVisibility, string>>;

export const DEFAULT_PROFILE_VISIBILITY: ProfileVisibility = {
  showAge: false,
  showLocation: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Legacy profiles are private by default. A field is public only when the
 * owner has explicitly saved its visibility setting as true.
 */
export function getProfileVisibility(preferences: Record<string, unknown> | null | undefined): ProfileVisibility {
  const stored = isRecord(preferences?.profileVisibility) ? preferences.profileVisibility : null;

  return {
    showAge: stored?.showAge === true,
    showLocation: stored?.showLocation === true,
  };
}

export function validateProfileVisibility(value: unknown): ProfileVisibilityFieldErrors {
  if (!isRecord(value)) {
    return { showAge: "Profile visibility settings must be an object." };
  }

  const errors: ProfileVisibilityFieldErrors = {};
  if (typeof value.showAge !== "boolean") errors.showAge = "Choose whether to show your age.";
  if (typeof value.showLocation !== "boolean") errors.showLocation = "Choose whether to show your location.";
  return errors;
}

export function toProfileVisibility(value: unknown): ProfileVisibility | null {
  if (Object.keys(validateProfileVisibility(value)).length > 0 || !isRecord(value)) return null;

  return {
    showAge: value.showAge as boolean,
    showLocation: value.showLocation as boolean,
  };
}

export function mergeProfileVisibility(
  preferences: Record<string, unknown> | null | undefined,
  visibility: ProfileVisibility,
): Record<string, unknown> {
  return {
    ...(preferences ?? {}),
    profileVisibility: visibility,
  };
}

/** Returns a safe age value from an ISO date without exposing the date itself. */
export function getProfileAge(dateOfBirth: string | null | undefined, now = new Date()): number | null {
  if (!dateOfBirth) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth);
  if (!match) return null;

  const birthYear = Number(match[1]);
  const birthMonth = Number(match[2]);
  const birthDay = Number(match[3]);
  const birthDate = new Date(Date.UTC(birthYear, birthMonth - 1, birthDay));

  if (
    birthDate.getUTCFullYear() !== birthYear ||
    birthDate.getUTCMonth() !== birthMonth - 1 ||
    birthDate.getUTCDate() !== birthDay
  ) {
    return null;
  }

  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;
  const currentDay = now.getUTCDate();
  let age = currentYear - birthYear;

  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age -= 1;
  }

  return age >= 0 && age <= 130 ? age : null;
}
