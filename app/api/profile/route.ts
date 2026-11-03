/**
 * Profile API — GET /api/profile · PATCH /api/profile
 *
 * GET  — return the authenticated user's profile row.
 * PATCH — update editable identity fields and the controlled public-profile appearance.
 *
 * Both methods require an active session.  The service-role client is used
 * internally but the route itself gates access on the session user ID, so
 * only the authenticated user can read or modify their own profile.
 */

import { normalizeEditableProfileUpdate, validateEditableProfileUpdate } from "@/lib/profile-validation";
import { mergeProfileAppearance, toProfileAppearance, validateProfileAppearance } from "@/lib/profile-appearance";
import { isProfileMediaReference } from "@/lib/profile-media";
import { assertOwnedProfileMediaReference } from "@/lib/profile-media-server";
import { mergeProfileVisibility, toProfileVisibility, validateProfileVisibility } from "@/lib/profile-visibility";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ensureProfile, updateProfile, type ProfileUpdateData } from "@/lib/supabase/profile";
import { logger } from "@/lib/observability";

type ProfileApiErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_REQUEST"
  | "VALIDATION_ERROR"
  | "PROFILE_LOAD_FAILED"
  | "PROFILE_UPDATE_FAILED"
  | "PROFILE_PREFERENCES_FALLBACK_FAILED";

function failure(
  status: number,
  code: ProfileApiErrorCode,
  message: string,
  details: Record<string, unknown> = {},
): Response {
  return Response.json({ ok: false, error: { code, message }, ...details }, { status });
}

function profileFailureCode(error: unknown): Extract<ProfileApiErrorCode, "PROFILE_UPDATE_FAILED" | "PROFILE_PREFERENCES_FALLBACK_FAILED"> {
  if (
    error &&
    typeof error === "object" &&
    "profileErrorCode" in error &&
    error.profileErrorCode === "PROFILE_PREFERENCES_FALLBACK_FAILED"
  ) {
    return "PROFILE_PREFERENCES_FALLBACK_FAILED";
  }

  return "PROFILE_UPDATE_FAILED";
}

export async function GET(): Promise<Response> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return failure(401, "UNAUTHORIZED", "Sign in to view your profile.");
  }

  try {
    const profile = await ensureProfile(user);
    return Response.json({ ok: true, profile });
  } catch (err) {
    logger.error("GET /api/profile failed", {
      category: "error",
      service: "supabase",
      userId: user.id,
      error: { message: err instanceof Error ? err.message : String(err), name: "ProfileApiError" },
    });
    return failure(500, "PROFILE_LOAD_FAILED", "We couldn't load your profile. Please refresh and try again.");
  }
}

export async function PATCH(request: Request): Promise<Response> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return failure(401, "UNAUTHORIZED", "Sign in to save your profile.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return failure(400, "INVALID_REQUEST", "The profile update request was invalid.");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return failure(400, "INVALID_REQUEST", "The profile update request was invalid.");
  }

  // Extract and validate only the permitted editable fields.
  const raw = body as Record<string, unknown>;
  const data: ProfileUpdateData = {};
  let profileAppearance: ReturnType<typeof toProfileAppearance> | undefined;
  let profileVisibility: ReturnType<typeof toProfileVisibility> | undefined;

  if ("full_name" in raw) {
    if (raw.full_name !== null && typeof raw.full_name !== "string") {
      return failure(400, "INVALID_REQUEST", "The profile update request was invalid.");
    }
    data.full_name = (raw.full_name as string | null) ?? null;
  }

  if ("avatar_url" in raw) {
    if (raw.avatar_url !== null && typeof raw.avatar_url !== "string") {
      return failure(400, "INVALID_REQUEST", "The profile update request was invalid.");
    }
    data.avatar_url = (raw.avatar_url as string | null) ?? null;
  }


  const fieldsToExtract = ["first_name", "middle_name", "last_name", "suffix", "username", "country", "date_of_birth"];
  for (const field of fieldsToExtract) {
    if (field in raw) {
      if (raw[field] !== null && typeof raw[field] !== "string") {
        return failure(400, "INVALID_REQUEST", "The profile update request was invalid.");
      }
      Object.assign(data, { [field]: (raw[field] as string | null) ?? null });
    }
  }

  if ("profileAppearance" in raw) {
    const appearanceErrors = validateProfileAppearance(raw.profileAppearance);
    const parsedAppearance = toProfileAppearance(raw.profileAppearance);

    if (!parsedAppearance) {
      return failure(
        400,
        "VALIDATION_ERROR",
        "Please fix the profile appearance settings and try again.",
        {
          fieldErrors: { profileAppearance: Object.values(appearanceErrors)[0] ?? "Invalid profile appearance." },
          appearanceErrors,
        },
      );
    }

    profileAppearance = parsedAppearance;
  }

  if ("profileVisibility" in raw) {
    const visibilityErrors = validateProfileVisibility(raw.profileVisibility);
    const parsedVisibility = toProfileVisibility(raw.profileVisibility);

    if (!parsedVisibility) {
      return failure(
        400,
        "VALIDATION_ERROR",
        "Please fix the profile visibility settings and try again.",
        {
          fieldErrors: { profileVisibility: Object.values(visibilityErrors)[0] ?? "Invalid profile visibility." },
          visibilityErrors,
        },
      );
    }

    profileVisibility = parsedVisibility;
  }

  if (Object.keys(data).length === 0 && !profileAppearance && !profileVisibility) {
    return failure(400, "INVALID_REQUEST", "Choose at least one profile setting to save.");
  }

  try {
    const normalizedData = normalizeEditableProfileUpdate(data);
    const fieldErrors = validateEditableProfileUpdate(normalizedData);

    if (Object.keys(fieldErrors).length > 0) {
      return failure(
        400,
        "VALIDATION_ERROR",
        "Please fix the highlighted fields and try again.",
        { fieldErrors },
      );
    }

    try {
      if (isProfileMediaReference(normalizedData.avatar_url)) {
        await assertOwnedProfileMediaReference({
          userId: user.id,
          reference: normalizedData.avatar_url,
          kind: "avatar",
        });
      }
      if (profileAppearance && isProfileMediaReference(profileAppearance.coverUrl)) {
        await assertOwnedProfileMediaReference({
          userId: user.id,
          reference: profileAppearance.coverUrl,
          kind: "cover",
        });
      }
    } catch {
      return failure(
        400,
        "VALIDATION_ERROR",
        "Choose profile media uploaded to this account.",
        {
          fieldErrors: {
            ...(isProfileMediaReference(normalizedData.avatar_url) ? { avatar_url: "Choose a saved profile picture from this account." } : {}),
            ...(profileAppearance && isProfileMediaReference(profileAppearance.coverUrl) ? { profileAppearance: "Choose a saved cover photo from this account." } : {}),
          },
        },
      );
    }

    const currentProfile = await ensureProfile(user);

    // Merge only this dedicated key server-side so callers cannot overwrite
    // unrelated preferences that may be owned by another feature.
    let preferences: Record<string, unknown> = currentProfile.preferences ?? {};
    if (profileAppearance) preferences = mergeProfileAppearance(preferences, profileAppearance);
    if (profileVisibility) preferences = mergeProfileVisibility(preferences, profileVisibility);

    const updateData: ProfileUpdateData = {
      ...normalizedData,
      ...(profileAppearance || profileVisibility ? { preferences } : {}),
    };

    const profile = await updateProfile(user.id, updateData);
    return Response.json({ ok: true, profile });
  } catch (err) {
    logger.error("PATCH /api/profile failed", {
      category: "error",
      service: "supabase",
      userId: user.id,
      error: { message: err instanceof Error ? err.message : String(err), name: "ProfileApiError" },
    });
    const code = profileFailureCode(err);
    return failure(
      500,
      code,
      code === "PROFILE_PREFERENCES_FALLBACK_FAILED"
        ? "Your public profile settings could not be saved. Please try again."
        : "We couldn't save your profile. Please try again.",
    );
  }
}
