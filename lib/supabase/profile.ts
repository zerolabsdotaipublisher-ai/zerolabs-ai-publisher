import type { User } from "@supabase/supabase-js";
import { logger } from "@/lib/observability";
import { getSupabaseServiceClient } from "./server";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Full profile row as stored in public.profiles.
 *
 * System-managed fields (id, created_at, updated_at) must never be set by the
 * caller.  Only editable fields (full_name, avatar_url) may be supplied to
 * updateProfile().
 */
export type Profile = {
  /** UUID — matches auth.users.id. System-managed. */
  id: string;
  /** Cached from auth identity. System-managed. */
  email: string;
  /** User-editable display name. */
  full_name: string | null;
  /** User-editable avatar URL. */
  avatar_url: string | null;
  /** Optional app-level preferences (future use). */
  preferences: Record<string, unknown> | null;
  /** Optional extensible metadata (future use). */
  metadata: Record<string, unknown> | null;
  /** ISO 8601. System-managed. */
  created_at: string;
  /** ISO 8601. System-managed; auto-updated via trigger. */
  updated_at: string;
};

/**
 * Fields that callers are allowed to update.
 * System fields (id, email, created_at, updated_at) are intentionally excluded.
 */
export type ProfileUpdateData = {
  full_name?: string | null;
  avatar_url?: string | null;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type AuthUserMetadata = {
  full_name?: string;
  avatar_url?: string;
};

function extractUserMetadataFromAuth(user: User): AuthUserMetadata {
  const raw = user.user_metadata;

  if (!raw || typeof raw !== "object") {
    return {};
  }

  const metadata: AuthUserMetadata = {};

  if ("full_name" in raw && typeof raw.full_name === "string") {
    metadata.full_name = raw.full_name;
  }

  if ("avatar_url" in raw && typeof raw.avatar_url === "string") {
    metadata.avatar_url = raw.avatar_url;
  }

  return metadata;
}

// ---------------------------------------------------------------------------
// Service layer
// ---------------------------------------------------------------------------

/**
 * Retrieve a profile row by user ID.
 * Returns null when no profile exists for the given ID.
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    // PGRST116 = "no rows returned" — not an error, simply absent
    if (error.code === "PGRST116") return null;

    logger.error("getProfile failed", {
      category: "error",
      service: "supabase",
      userId,
      error: { message: error.message, name: "SupabaseProfileError" },
    });
    throw error;
  }

  return data as Profile;
}

/**
 * Update the editable fields of a profile.
 * Only full_name and avatar_url are permitted; system fields are ignored.
 * Returns the updated profile row.
 */
export async function updateProfile(userId: string, data: ProfileUpdateData): Promise<Profile> {
  const supabase = getSupabaseServiceClient();
  const { data: updated, error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    logger.error("updateProfile failed", {
      category: "error",
      service: "supabase",
      userId,
      error: { message: error.message, name: "SupabaseProfileError" },
    });
    throw error;
  }

  return updated as Profile;
}

/**
 * Ensure a profile row exists for the given auth user.
 * If one already exists it is left unchanged; if not it is created from the
 * user's auth metadata.  Returns the current (or newly created) profile.
 *
 * Use this instead of createProfile() when you only need a guarantee of
 * existence — it avoids an unnecessary write on every login.
 */
export async function ensureProfile(user: User): Promise<Profile> {
  const existing = await getProfile(user.id);
  if (existing) return existing;

  // First-time sign-in: create via the sync path so metadata is captured.
  await syncProfileFromAuthUser(user);

  const created = await getProfile(user.id);
  if (!created) {
    throw new Error(`Profile not found after sync for user ${user.id}`);
  }
  return created;
}

/**
 * Upsert a profile row from Supabase auth user metadata.
 *
 * Called during:
 *  - Email-confirmation callback (app/auth/callback)
 *  - auth state change events (providers/auth-provider.tsx → /api/auth/profile-sync)
 *
 * This always writes so that auth metadata changes (e.g. Google display name
 * updates) are reflected in the profile on the next sign-in.
 */
export async function syncProfileFromAuthUser(user: User): Promise<void> {
  if (!user.email) {
    logger.warn("profile sync skipped due to missing email", {
      category: "security",
      service: "supabase",
      userId: user.id,
    });
    throw new Error("Auth user is missing an email address");
  }

  const supabase = getSupabaseServiceClient();
  const metadata = extractUserMetadataFromAuth(user);

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      full_name: metadata.full_name ?? null,
      avatar_url: metadata.avatar_url ?? null,
    },
    { onConflict: "id" },
  );

  if (error) {
    logger.error("profile sync failed", {
      category: "error",
      service: "supabase",
      userId: user.id,
      error: { message: error.message, name: "SupabaseProfileSyncError" },
    });
    throw error;
  }
}
