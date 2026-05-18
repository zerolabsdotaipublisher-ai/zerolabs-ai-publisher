import type { User } from "@supabase/supabase-js";
import { logger } from "@/lib/observability";
import { getSupabaseServiceClient } from "./server";

export type ProfileRole = "user" | "admin";

export type Profile = {
  id: string;
  email: string;
  role: ProfileRole;
  full_name: string | null;
  avatar_url: string | null;
  preferences: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type ProfileUpdateData = {
  full_name?: string | null;
  avatar_url?: string | null;
};

type AuthUserMetadata = {
  full_name?: string;
  avatar_url?: string;
};

const ADMIN_PROFILE_EMAILS = new Set(["zerolabsaipublisher@gmail.com"]);

function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

function getErrorField(error: unknown, field: "code" | "message"): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const record = error as Record<string, unknown>;
  return typeof record[field] === "string" ? record[field] : undefined;
}

// 42P01 = undefined_table, 42703 = undefined_column.
function isRecoverableProfileSchemaError(error: unknown): boolean {
  const code = getErrorField(error, "code");
  const message = (getErrorField(error, "message") ?? "").toLowerCase();

  return (
    code === "42P01" ||
    code === "42703" ||
    message.includes("relation \"public.profiles\" does not exist") ||
    message.includes("could not find the 'role' column of 'profiles'") ||
    message.includes("column \"role\" of relation \"profiles\" does not exist")
  );
}

function normalizeProfileRole(role: unknown): ProfileRole {
  return role === "admin" ? "admin" : "user";
}

function createFallbackProfileRecord(id: string, email: string, createdAt?: string | null): Profile {
  const timestamp = createdAt ?? getCurrentTimestamp();

  return {
    id,
    email,
    role: "user",
    full_name: null,
    avatar_url: null,
    preferences: null,
    metadata: null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function normalizeProfileRow(data: Partial<Profile>): Profile {
  const timestamp = typeof data.created_at === "string" ? data.created_at : getCurrentTimestamp();

  return {
    id: typeof data.id === "string" ? data.id : "",
    email: typeof data.email === "string" ? data.email : "",
    role: normalizeProfileRole(data.role),
    full_name: typeof data.full_name === "string" ? data.full_name : null,
    avatar_url: typeof data.avatar_url === "string" ? data.avatar_url : null,
    preferences: data.preferences && typeof data.preferences === "object" ? data.preferences : null,
    metadata: data.metadata && typeof data.metadata === "object" ? data.metadata : null,
    created_at: timestamp,
    updated_at: typeof data.updated_at === "string" ? data.updated_at : timestamp,
  };
}

function extractUserMetadataFromAuth(user: User): AuthUserMetadata {
  if (!user.user_metadata || typeof user.user_metadata !== "object") {
    return {};
  }

  const metadata = user.user_metadata as Record<string, unknown>;

  return {
    full_name: typeof metadata.full_name === "string" ? metadata.full_name : undefined,
    avatar_url: typeof metadata.avatar_url === "string" ? metadata.avatar_url : undefined,
  };
}

function resolveSeededProfileRole(email: string): ProfileRole | null {
  return ADMIN_PROFILE_EMAILS.has(email.trim().toLowerCase()) ? "admin" : null;
}

export function createFallbackProfile(user: User): Profile {
  return createFallbackProfileRecord(user.id, user.email ?? "", user.created_at ?? getCurrentTimestamp());
}

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }

      if (isRecoverableProfileSchemaError(error)) {
        logger.warn("getProfile skipped because the profile schema is unavailable", {
          category: "error",
          service: "supabase",
          userId,
          error: { message: error.message, name: "SupabaseProfileSchemaWarning" },
        });
        return null;
      }

      logger.error("getProfile failed; returning null", {
        category: "error",
        service: "supabase",
        userId,
        error: { message: error.message, name: "SupabaseProfileError" },
      });
      return null;
    }

    return normalizeProfileRow(data as Partial<Profile>);
  } catch (error) {
    logger.error("getProfile threw unexpectedly; returning null", {
      category: "error",
      service: "supabase",
      userId,
      error: { message: error instanceof Error ? error.message : String(error), name: "SupabaseProfileError" },
    });
    return null;
  }
}

export async function updateProfile(userId: string, data: ProfileUpdateData): Promise<Profile> {
  try {
    const supabase = getSupabaseServiceClient();
    const { data: updated, error } = await supabase.from("profiles").update(data).eq("id", userId).select().single();

    if (error) {
      logger.error("updateProfile failed; returning fallback profile", {
        category: "error",
        service: "supabase",
        userId,
        error: { message: error.message, name: "SupabaseProfileError" },
      });
      return createFallbackProfileRecord(userId, "");
    }

    return normalizeProfileRow(updated as Partial<Profile>);
  } catch (error) {
    logger.error("updateProfile threw unexpectedly; returning fallback profile", {
      category: "error",
      service: "supabase",
      userId,
      error: { message: error instanceof Error ? error.message : String(error), name: "SupabaseProfileError" },
    });
    return createFallbackProfileRecord(userId, "");
  }
}

export async function syncProfileFromAuthUser(user: User): Promise<void> {
  if (!user.email) {
    logger.warn("profile sync skipped because the authenticated user has no email", {
      category: "security",
      service: "supabase",
      userId: user.id,
    });
    return;
  }

  try {
    const supabase = getSupabaseServiceClient();
    const metadata = extractUserMetadataFromAuth(user);
    const seededRole = resolveSeededProfileRole(user.email);

    const profileRow: {
      id: string;
      email: string;
      full_name: string | null;
      avatar_url: string | null;
      role?: ProfileRole;
    } = {
      id: user.id,
      email: user.email,
      full_name: metadata.full_name ?? null,
      avatar_url: metadata.avatar_url ?? null,
    };

    if (seededRole) {
      profileRow.role = seededRole;
    }

    const { error } = await supabase.from("profiles").upsert(profileRow, { onConflict: "id" });

    if (!error) {
      return;
    }

    if (profileRow.role && isRecoverableProfileSchemaError(error)) {
      const fallbackProfileRow = {
        id: profileRow.id,
        email: profileRow.email,
        full_name: profileRow.full_name,
        avatar_url: profileRow.avatar_url,
      };
      const { error: fallbackError } = await supabase.from("profiles").upsert(fallbackProfileRow, { onConflict: "id" });

      if (!fallbackError || isRecoverableProfileSchemaError(fallbackError)) {
        return;
      }
    }

    if (isRecoverableProfileSchemaError(error)) {
      logger.warn("profile sync skipped because the profile schema is unavailable", {
        category: "error",
        service: "supabase",
        userId: user.id,
        error: { message: error.message, name: "SupabaseProfileSchemaWarning" },
      });
      return;
    }

    logger.error("profile sync failed; continuing with fallback profile behavior", {
      category: "error",
      service: "supabase",
      userId: user.id,
      error: { message: error.message, name: "SupabaseProfileSyncError" },
    });
  } catch (error) {
    logger.error("profile sync threw unexpectedly; continuing with fallback profile behavior", {
      category: "error",
      service: "supabase",
      userId: user.id,
      error: { message: error instanceof Error ? error.message : String(error), name: "SupabaseProfileSyncError" },
    });
  }
}

export async function ensureProfile(user: User): Promise<Profile> {
  const existingProfile = await getProfile(user.id);

  if (existingProfile) {
    return existingProfile;
  }

  await syncProfileFromAuthUser(user);

  const syncedProfile = await getProfile(user.id);
  return syncedProfile ?? createFallbackProfile(user);
}

export async function getSafeProfile(user: User): Promise<Profile> {
  try {
    return await ensureProfile(user);
  } catch (error) {
    logger.error("getSafeProfile fell back to an in-memory profile", {
      category: "error",
      service: "supabase",
      userId: user.id,
      error: { message: error instanceof Error ? error.message : String(error), name: "SupabaseProfileError" },
    });
    return createFallbackProfile(user);
  }
}
