import "server-only";

import type { User } from "@supabase/supabase-js";
import type { AdminUserRecord } from "@/lib/admin/data";
import { getProfile, syncProfileFromAuthUser, type ProfileRole } from "@/lib/supabase/profile";
import { logger } from "@/lib/observability";
import {
  getSupabaseServiceClient,
  inspectSupabaseServiceRoleConfiguration,
  type SupabaseServiceRoleInspection,
} from "@/lib/supabase/server";

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
  | { status: "already-admin"; email: string; userId: string }
  | { status: "no-user"; email: string }
  | { status: "service-role-missing"; email: string }
  | { status: "service-role-invalid"; email: string }
  | { status: "profile-repair-failed"; email: string }
  | { status: "role-update-failed"; email: string };

export interface AdminUserLookupRecord extends AdminUserRecord {
  fullName: string | null;
}

export interface AdminUsersDiagnostics {
  requestId: string;
  serviceRole: {
    status: SupabaseServiceRoleInspection["status"];
    configuredProjectRef: string | null;
    keyProjectRef: string | null;
    roleClaim: string | null;
  };
  authReads: {
    status: "ok" | "failed" | "unknown";
  };
  profileReads: {
    status: "ok" | "empty" | "failed" | "unknown";
    totalUsers: number | null;
    currentAdmins: number | null;
  };
  targetUser: {
    email: string | null;
    existsInAuth: boolean | null;
    existsInProfile: boolean | null;
  } | null;
  suspectedIssue: "none" | "service-role-missing" | "service-role-invalid" | "wrong-project" | "profiles-empty";
}

export interface AdminUserPromotionAttempt {
  result: AdminUserPromotionResult;
  diagnostics: AdminUsersDiagnostics;
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

function createAdminUsersDiagnostics(
  requestId: string,
  inspection: SupabaseServiceRoleInspection
): AdminUsersDiagnostics {
  return {
    requestId,
    serviceRole: {
      status: inspection.status,
      configuredProjectRef: inspection.configuredProjectRef,
      keyProjectRef: inspection.keyProjectRef,
      roleClaim: inspection.roleClaim,
    },
    authReads: {
      status: inspection.status === "ready" ? "failed" : "unknown",
    },
    profileReads: {
      status: inspection.status === "ready" ? "failed" : "unknown",
      totalUsers: null,
      currentAdmins: null,
    },
    targetUser: null,
    suspectedIssue:
      inspection.status === "missing"
        ? "service-role-missing"
        : inspection.status === "wrong-project"
          ? "wrong-project"
          : inspection.status === "invalid"
            ? "service-role-invalid"
            : "none",
  };
}

function mapServiceRoleStatusToPromotionResult(
  status: SupabaseServiceRoleInspection["status"]
): "service-role-missing" | "service-role-invalid" | null {
  if (status === "missing") {
    return "service-role-missing";
  }

  if (status === "invalid" || status === "wrong-project") {
    return "service-role-invalid";
  }

  return null;
}

function normalizeSafeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function logAdminDiagnosticWarning(
  message: string,
  diagnostics: AdminUsersDiagnostics,
  extra?: Record<string, unknown>
): void {
  logger.warn(message, {
    category: "error",
    service: "supabase",
    requestId: diagnostics.requestId,
    serviceRoleStatus: diagnostics.serviceRole.status,
    configuredProjectRef: diagnostics.serviceRole.configuredProjectRef,
    keyProjectRef: diagnostics.serviceRole.keyProjectRef,
    roleClaim: diagnostics.serviceRole.roleClaim,
    authReadsStatus: diagnostics.authReads.status,
    profileReadsStatus: diagnostics.profileReads.status,
    profileTotalUsers: diagnostics.profileReads.totalUsers,
    profileCurrentAdmins: diagnostics.profileReads.currentAdmins,
    targetEmail: diagnostics.targetUser?.email ?? undefined,
    targetExistsInAuth: diagnostics.targetUser?.existsInAuth ?? undefined,
    targetExistsInProfile: diagnostics.targetUser?.existsInProfile ?? undefined,
    suspectedIssue: diagnostics.suspectedIssue,
    ...extra,
  });
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

function resolveLookupEmail(user: User | null, profile: ProfileRow | null, fallbackEmail: string): string {
  return normalizeOptionalText(user?.email) ?? normalizeOptionalText(profile?.email) ?? fallbackEmail;
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

async function getProfileCounts(): Promise<{ totalUsers: number; currentAdmins: number }> {
  const supabase = getSupabaseServiceClient();
  const [totalUsersResult, currentAdminsResult] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
  ]);

  if (totalUsersResult.error) {
    throw new Error(totalUsersResult.error.message);
  }

  if (currentAdminsResult.error) {
    throw new Error(currentAdminsResult.error.message);
  }

  return {
    totalUsers: totalUsersResult.count ?? 0,
    currentAdmins: currentAdminsResult.count ?? 0,
  };
}

async function verifyAuthAdminReadAccess(): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getAdminUsersDiagnostics(
  email?: string,
  requestId = crypto.randomUUID()
): Promise<AdminUsersDiagnostics> {
  const inspection = inspectSupabaseServiceRoleConfiguration();
  const diagnostics = createAdminUsersDiagnostics(requestId, inspection);
  const normalizedEmail = normalizeEmailAddress(email ?? "");

  if (normalizedEmail) {
    diagnostics.targetUser = {
      email: normalizedEmail,
      existsInAuth: null,
      existsInProfile: null,
    };
  }

  const serviceRoleResult = mapServiceRoleStatusToPromotionResult(inspection.status);
  if (serviceRoleResult) {
    logAdminDiagnosticWarning("Admin users diagnostics detected a service-role configuration issue", diagnostics, {
      diagnosticCategory: "admin-service-role-diagnostics",
    });
    return diagnostics;
  }

  try {
    await verifyAuthAdminReadAccess();
    diagnostics.authReads.status = "ok";
  } catch (error) {
    diagnostics.authReads.status = "failed";
    diagnostics.suspectedIssue = "service-role-invalid";

    logAdminDiagnosticWarning("Admin auth diagnostics failed", diagnostics, {
      diagnosticCategory: "admin-auth-read-failed",
      error: {
        message: normalizeSafeErrorMessage(error),
        name: "AdminAuthDiagnosticsWarning",
      },
    });

    return diagnostics;
  }

  try {
    const counts = await getProfileCounts();
    diagnostics.profileReads.totalUsers = counts.totalUsers;
    diagnostics.profileReads.currentAdmins = counts.currentAdmins;

    if (counts.currentAdmins > counts.totalUsers) {
      diagnostics.profileReads.status = "failed";

      logAdminDiagnosticWarning("Admin users diagnostics found inconsistent profile counts", diagnostics, {
        diagnosticCategory: "admin-profile-counts-inconsistent",
      });

      return diagnostics;
    }

    diagnostics.profileReads.status = counts.totalUsers > 0 ? "ok" : "empty";

    if (diagnostics.profileReads.status === "empty") {
      diagnostics.suspectedIssue = "profiles-empty";

      logAdminDiagnosticWarning("Admin users diagnostics found empty profile counts", diagnostics, {
        diagnosticCategory: "admin-profile-counts-empty",
      });
    }
  } catch (error) {
    diagnostics.profileReads.status = "failed";

    logAdminDiagnosticWarning("Admin profile diagnostics failed", diagnostics, {
      diagnosticCategory: "admin-profile-read-failed",
      error: {
        message: normalizeSafeErrorMessage(error),
        name: "AdminProfileDiagnosticsWarning",
      },
    });

    return diagnostics;
  }

  if (!normalizedEmail) {
    return diagnostics;
  }

  try {
    const lookupContext = await findLookupContextByEmail(normalizedEmail);
    diagnostics.targetUser = {
      email: normalizedEmail,
      existsInAuth: Boolean(lookupContext.authUser),
      existsInProfile: Boolean(lookupContext.profile),
    };
  } catch (error) {
    logAdminDiagnosticWarning("Admin target-user diagnostics failed", diagnostics, {
      diagnosticCategory: "admin-target-user-read-failed",
      error: {
        message: normalizeSafeErrorMessage(error),
        name: "AdminTargetDiagnosticsWarning",
      },
    });
  }

  return diagnostics;
}

export async function findAdminUserRecordByEmail(email: string): Promise<AdminUserLookupRecord | null> {
  try {
    const { authUser, profile, normalizedEmail } = await findLookupContextByEmail(email);

    if (!authUser && !profile) {
      return null;
    }

    return buildAdminUserRecord(authUser, profile, normalizedEmail);
  } catch (error) {
    logger.warn("Admin user lookup fell back to a safe null state", {
      category: "error",
      service: "supabase",
      error: {
        message: normalizeSafeErrorMessage(error),
        name: "AdminUserLookupWarning",
      },
    });
    return null;
  }
}

export async function listCurrentAdminUsers(limit = 12): Promise<AdminUserRecord[]> {
  try {
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
  } catch (error) {
    logger.warn("Admin admin-user listing failed before the query could complete", {
      category: "error",
      service: "supabase",
      error: {
        message: normalizeSafeErrorMessage(error),
        name: "AdminListUsersWarning",
      },
    });
    return [];
  }
}

export async function promoteUserToAdminByEmail(
  email: string,
  requestId = crypto.randomUUID()
): Promise<AdminUserPromotionAttempt> {
  const diagnostics = await getAdminUsersDiagnostics(email, requestId);
  const normalizedTargetEmail = normalizeEmailAddress(email);
  const serviceRoleResult = mapServiceRoleStatusToPromotionResult(diagnostics.serviceRole.status);

  if (serviceRoleResult) {
    logAdminDiagnosticWarning("Admin promotion blocked by service-role diagnostics", diagnostics, {
      diagnosticCategory: "admin-promotion-service-role-blocked",
    });

    return {
      result: {
        status: serviceRoleResult,
        email: normalizedTargetEmail,
      },
      diagnostics,
    };
  }

  const lookupContext = await findLookupContextByEmail(email);
  const { authUser, normalizedEmail: contextEmail } = lookupContext;
  let { profile } = lookupContext;
  let resolvedEmail = resolveLookupEmail(authUser, profile, contextEmail);

  if (authUser && (!profile || profile.id !== authUser.id)) {
    try {
      profile = await ensureProfileRowForAuthUser(authUser);
    } catch (error) {
      logAdminDiagnosticWarning("Admin promotion failed while repairing a missing profile", diagnostics, {
        diagnosticCategory: "admin-promotion-profile-repair-failed",
        targetEmail: resolvedEmail,
        error: {
          message: normalizeSafeErrorMessage(error),
          name: "AdminProfileRepairWarning",
        },
      });

      return {
        result: {
          status: "profile-repair-failed",
          email: resolvedEmail,
        },
        diagnostics: {
          ...diagnostics,
          targetUser: {
            email: contextEmail,
            existsInAuth: true,
            existsInProfile: false,
          },
        },
      };
    }

    if (!profile) {
      logAdminDiagnosticWarning("Admin promotion could not load a repaired profile row", diagnostics, {
        diagnosticCategory: "admin-promotion-profile-repair-missing",
        targetEmail: resolvedEmail,
      });

      return {
        result: {
          status: "profile-repair-failed",
          email: resolvedEmail,
        },
        diagnostics: {
          ...diagnostics,
          targetUser: {
            email: contextEmail,
            existsInAuth: true,
            existsInProfile: false,
          },
        },
      };
    }

    resolvedEmail = resolveLookupEmail(authUser, profile, contextEmail);
  }

  if (profile?.role === "admin") {
    return {
      result: {
        status: "already-admin",
        email: resolvedEmail,
        userId: profile.id,
      },
      diagnostics: {
        ...diagnostics,
        targetUser: {
          email: resolvedEmail,
          existsInAuth: Boolean(authUser),
          existsInProfile: true,
        },
      },
    };
  }

  if (profile) {
    try {
      await updateProfileRoleToAdmin(profile.id, resolvedEmail);
    } catch (error) {
      logAdminDiagnosticWarning("Admin promotion failed during role update", diagnostics, {
        diagnosticCategory: "admin-promotion-role-update-failed",
        targetEmail: resolvedEmail,
        error: {
          message: normalizeSafeErrorMessage(error),
          name: "AdminRoleUpdateWarning",
        },
      });

      return {
        result: {
          status: "role-update-failed",
          email: resolvedEmail,
        },
        diagnostics: {
          ...diagnostics,
          targetUser: {
            email: resolvedEmail,
            existsInAuth: Boolean(authUser),
            existsInProfile: true,
          },
        },
      };
    }

    return {
      result: {
        status: "promoted",
        email: resolvedEmail,
        userId: profile.id,
      },
      diagnostics: {
        ...diagnostics,
        targetUser: {
          email: resolvedEmail,
          existsInAuth: Boolean(authUser),
          existsInProfile: true,
        },
      },
    };
  }

  if (!authUser) {
    return {
      result: {
        status: "no-user",
        email: contextEmail,
      },
      diagnostics: {
        ...diagnostics,
        targetUser: {
          email: contextEmail,
          existsInAuth: false,
          existsInProfile: Boolean(lookupContext.profile),
        },
      },
    };
  }

  logAdminDiagnosticWarning("Admin promotion ended without a promotable profile row", diagnostics, {
    diagnosticCategory: "admin-promotion-no-promotable-profile",
    targetEmail: resolvedEmail,
  });

  return {
    result: {
      status: "profile-repair-failed",
      email: resolvedEmail,
    },
    diagnostics: {
      ...diagnostics,
      targetUser: {
        email: resolvedEmail,
        existsInAuth: true,
        existsInProfile: false,
      },
    },
  };
}
