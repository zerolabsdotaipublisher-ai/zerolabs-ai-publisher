import "server-only";

import type { User } from "@supabase/supabase-js";
import type { AdminUserRecord } from "@/lib/admin/data";
import type { ProfileRole } from "@/lib/supabase/profile";
import { logger } from "@/lib/observability";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

const AUTH_USERS_PAGE_SIZE = 200;
const AUTH_USERS_MAX_PAGES = 25;

type ProfileRow = {
  id: string;
  email: string;
  role: ProfileRole;
  created_at: string;
};

export type AdminUserPromotionResult =
  | { status: "promoted"; email: string; userId: string }
  | { status: "already_admin"; email: string; userId: string }
  | { status: "not_found"; email: string };

function normalizeEmailAddress(value: string): string {
  return value.trim().toLowerCase();
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

async function getProfileRow(userId: string): Promise<ProfileRow | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, created_at")
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

function buildAdminUserRecord(user: User, profile: ProfileRow | null): AdminUserRecord {
  return {
    id: user.id,
    email: user.email ?? profile?.email ?? "Unavailable",
    role: profile?.role ?? "user",
    createdAt: user.created_at ?? profile?.created_at ?? null,
    status: summarizeUserStatus(user),
  };
}

export async function findAdminUserRecordByEmail(email: string): Promise<AdminUserRecord | null> {
  const authUser = await findAuthUserByEmail(email);

  if (!authUser) {
    return null;
  }

  const profile = await getProfileRow(authUser.id);
  return buildAdminUserRecord(authUser, profile);
}

export async function listCurrentAdminUsers(limit = 12): Promise<AdminUserRecord[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, created_at")
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
  const normalizedEmail = normalizeEmailAddress(email);
  const authUser = await findAuthUserByEmail(normalizedEmail);

  if (!authUser || !authUser.email) {
    return {
      status: "not_found",
      email: normalizedEmail,
    };
  }

  const supabase = getSupabaseServiceClient();
  const profile = await getProfileRow(authUser.id);

  if (profile?.role === "admin") {
    return {
      status: "already_admin",
      email: authUser.email,
      userId: authUser.id,
    };
  }

  if (profile) {
    const { error } = await supabase
      .from("profiles")
      .update({
        email: authUser.email,
        role: "admin",
      })
      .eq("id", authUser.id);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase.from("profiles").insert({
      id: authUser.id,
      email: authUser.email,
      role: "admin",
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  return {
    status: "promoted",
    email: authUser.email,
    userId: authUser.id,
  };
}
