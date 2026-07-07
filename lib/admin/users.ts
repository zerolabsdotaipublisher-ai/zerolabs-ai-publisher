import "server-only";

import type { User } from "@supabase/supabase-js";
import type { AdminUserRecord } from "@/lib/admin/data";
import { getProfile, syncProfileFromAuthUser, type ProfileRole } from "@/lib/supabase/profile";
import { logger } from "@/lib/observability";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

const AUTH_USERS_PAGE_SIZE = 200;
const AUTH_USERS_MAX_PAGES = 25;

type ProfileRow = {
  id: string;
  email: string;
  role: ProfileRole;
  full_name: string | null;
  created_at: string;
};

export type AdminUserPromotionResult =
  | { status: "promoted"; email: string; userId: string }
  | { status: "already_admin"; email: string; userId: string }
  | { status: "no_user"; email: string };

export interface AdminUserLookupRecord extends AdminUserRecord {
  fullName: string | null;
}

export function normalizeAdminUserEmailInput(value: string | null | undefined): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function getAuthUserFullName(user: User | null): string | null {
  if (!user?.user_metadata || typeof user.user_metadata !== "object") {
    return null;
  }

  return normalizeOptionalText((user.user_metadata as Record<string, unknown>).full_name);
}

function getAuthUserAvatarUrl(user: User): string | null {
  if (!user.user_metadata || typeof user.user_metadata !== "object") {
    return null;
  }

  return normalizeOptionalText((user.user_metadata as Record<string, unknown>).avatar_url);
}

function normalizeEmailAddress(value: string): string {
  return normalizeAdminUserEmailInput(value);
}

function summarizeUserStatus(user: User): string {
  if (user.banned_until) {
    const bannedUntil = Date.parse(user.banned_until);
    if (!Number.isNaN(bannedUntil) && bannedUntil > Date.now()) {
      return "Suspended";
    }
  }

  if (!user.email_confirmed_at) {
    return "Pending confirmation";
  }

  return "Active";
}

async function findAuthUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = normalizeEmailAddress(email);
  const supabase = getSupabaseServiceClient();

  for (let page = 1; page <= AUTH_USERS_MAX_PAGES; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: AUTH_USERS_PAGE_SIZE,
    });

    if (error) {
      logger.warn("Admin auth user lookup fell back to a safe not-found state", {
        category: "error",
        service: "supabase",
        error: {
          message: error.message,
          name: "AdminAuthUserLookupWarning",
        },
      });
      return null;
    }

    const users = data.users ?? [];
    const matchedUser = users.find((user) => normalizeEmailAddress(user.email ?? "") === normalizedEmail);

    if (matchedUser) {
      return matchedUser;
    }

    if (users.length < AUTH_USERS_PAGE_SIZE) {
      break;
    }
  }

  return null;
}

async function findAuthUserById(userId: string): Promise<User | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error) {
    logger.warn("Admin auth user lookup by id fell back to a safe null state", {
      category: "error",
      service: "supabase",
      userId,
      error: {
        message: error.message,
        name: "AdminAuthUserLookupWarning",
      },
    });
    return null;
  }

  return data.user ?? null;
}

async function getProfileRow(userId: string): Promise<ProfileRow | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, full_name, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    logger.warn("Admin profile lookup fell back to a safe null state", {
      category: "error",
      service: "supabase",
      userId,
      error: {
        message: error.message,
        name: "AdminProfileLookupWarning",
      },
    });
    return null;
  }

  return data as ProfileRow | null;
}

async function findProfileRowByEmail(email: string): Promise<ProfileRow | null> {
  const normalizedEmail = normalizeEmailAddress(email);

  if (!normalizedEmail) {
    return null;
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, full_name, created_at")
    .ilike("email", normalizedEmail)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    logger.warn("Admin profile lookup by email fell back to a safe null state", {
      category: "error",
      service: "supabase",
      error: {
        message: error.message,
        name: "AdminProfileLookupWarning",
      },
    });
    return null;
  }

  return (data?.[0] as ProfileRow | undefined) ?? null;
}

function buildAdminUserRecord(user: User | null, profile: ProfileRow | null, fallbackEmail: string): AdminUserLookupRecord {
  const email = normalizeOptionalText(user?.email) ?? normalizeOptionalText(profile?.email) ?? fallbackEmail;

  return {
    id: user?.id ?? profile?.id ?? fallbackEmail,
    email,
    role: profile?.role ?? "user",
    fullName: profile?.full_name ?? getAuthUserFullName(user),
    createdAt: user?.created_at ?? profile?.created_at ?? null,
    status: user ? summarizeUserStatus(user) : "Profile available",
  };
}

async function findLookupContextByEmail(
  email: string,
): Promise<{ authUser: User | null; profile: ProfileRow | null; normalizedEmail: string }> {
  const normalizedEmail = normalizeEmailAddress(email);

  if (!normalizedEmail) {
    return {
      authUser: null,
      profile: null,
      normalizedEmail,
    };
  }

  const profileByEmail = await findProfileRowByEmail(normalizedEmail);
  let authUser = profileByEmail ? await findAuthUserById(profileByEmail.id) : null;

  if (!authUser) {
    authUser = await findAuthUserByEmail(normalizedEmail);
  }

  let profile = profileByEmail;

  if (authUser) {
    const profileByUserId = await getProfileRow(authUser.id);

    if (profileByUserId) {
      if (profileByEmail && profileByEmail.id !== profileByUserId.id) {
        logger.warn("Admin user lookup found conflicting profiles for the same email", {
          category: "security",
          service: "supabase",
          userId: authUser.id,
        });
      }

      profile = profileByUserId;
    } else if (profileByEmail && profileByEmail.id !== authUser.id) {
      logger.warn("Admin user lookup ignored an email-matched profile owned by a different user", {
        category: "security",
        service: "supabase",
        userId: authUser.id,
      });

      profile = null;
    }
  }

  return {
    authUser,
    profile,
    normalizedEmail,
  };
}

async function insertMissingProfileFromAuthUser(user: User): Promise<ProfileRow | null> {
  const email = normalizeEmailAddress(user.email ?? "");

  if (!email) {
    return null;
  }

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    email,
    full_name: getAuthUserFullName(user),
    avatar_url: getAuthUserAvatarUrl(user),
    role: "user",
  });

  if (error) {
    if (error.code !== "23505") {
      throw new Error(error.message);
    }
  }

  return getProfileRow(user.id);
}

async function ensureProfileRowForAuthUser(user: User): Promise<ProfileRow | null> {
  await syncProfileFromAuthUser(user);

  const syncedProfile = await getProfileRow(user.id);
  if (syncedProfile) {
    return syncedProfile;
  }

  const safeProfile = await getProfile(user.id);
  if (safeProfile) {
    return getProfileRow(user.id);
  }

  return insertMissingProfileFromAuthUser(user);
}

async function updateProfileRoleToAdmin(profileId: string, email: string): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      email: normalizeEmailAddress(email),
      role: "admin",
    })
    .eq("id", profileId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function findAdminUserRecordByEmail(email: string): Promise<AdminUserLookupRecord | null> {
  const { authUser, profile, normalizedEmail } = await findLookupContextByEmail(email);

  if (!authUser && !profile) {
    return null;
  }

  return buildAdminUserRecord(authUser, profile, normalizedEmail);
}

export async function listCurrentAdminUsers(limit = 12): Promise<AdminUserRecord[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, full_name, created_at")
    .eq("role", "admin")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.warn("Admin admin-user listing fell back to a safe empty state", {
      category: "error",
      service: "supabase",
      error: {
        message: error.message,
        name: "AdminListUsersWarning",
      },
    });
    return [];
  }

  return ((data as ProfileRow[] | null) ?? []).map((profile) => ({
    id: profile.id,
    email: profile.email,
    role: "admin",
    createdAt: profile.created_at,
    status: "Admin access granted",
  }));
}

export async function promoteUserToAdminByEmail(email: string): Promise<AdminUserPromotionResult> {
  let { authUser, profile, normalizedEmail } = await findLookupContextByEmail(email);
  let resolvedEmail = normalizeOptionalText(authUser?.email) ?? normalizeOptionalText(profile?.email) ?? normalizedEmail;

  if (authUser && (!profile || profile.id !== authUser.id)) {
    profile = await ensureProfileRowForAuthUser(authUser);

    if (!profile) {
      throw new Error("Profile repair did not create a profile row for the target user.");
    }

    resolvedEmail = normalizeOptionalText(authUser.email) ?? profile.email;
  }

  if (profile?.role === "admin") {
    return {
      status: "already_admin",
      email: resolvedEmail,
      userId: profile.id,
    };
  }

  if (profile) {
    await updateProfileRoleToAdmin(profile.id, resolvedEmail);
    return {
      status: "promoted",
      email: resolvedEmail,
      userId: profile.id,
    };
  }

  if (!authUser) {
    return {
      status: "no_user",
      email: normalizedEmail,
    };
  }

  throw new Error("Auth user lookup completed without a promotable profile row.");
}
