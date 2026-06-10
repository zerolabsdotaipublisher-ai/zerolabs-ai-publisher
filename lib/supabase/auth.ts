import type { User } from "@supabase/supabase-js";
import type { Profile } from "./profile";
import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { logger } from "@/lib/observability";
import { createFallbackProfile, getSafeProfile } from "./profile";
import { getServerUser } from "./server";

export interface UserProfileResult {
  user: User;
  profile: Profile;
}

export interface AdminUserResult {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
}

export async function requireUser(redirectPath?: string): Promise<User> {
  const user = await getServerUser();

  if (!user) {
    const destination = redirectPath ? `${routes.login}?next=${encodeURIComponent(redirectPath)}` : routes.login;
    redirect(destination);
  }

  return user;
}

export async function requireUserProfile(redirectPath?: string): Promise<UserProfileResult> {
  const user = await requireUser(redirectPath);

  try {
    const profile = await getSafeProfile(user);
    return { user, profile };
  } catch (error) {
    logger.error("requireUserProfile fell back to a safe in-memory profile", {
      category: "error",
      service: "supabase",
      userId: user.id,
      error: { message: error instanceof Error ? error.message : String(error), name: "SupabaseProfileError" },
    });

    return {
      user,
      profile: createFallbackProfile(user),
    };
  }
}

export async function requireAdminAccess(redirectPath = routes.admin): Promise<UserProfileResult> {
  const { user, profile } = await requireUserProfile(redirectPath);

  if (profile.role !== "admin") {
    redirect(routes.dashboard);
  }

  return { user, profile };
}

export async function requireAdminUser(): Promise<AdminUserResult> {
  const user = await getServerUser();

  if (!user) {
    return {
      user: null,
      profile: null,
      isAdmin: false,
    };
  }

  try {
    const profile = await getSafeProfile(user);

    return {
      user,
      profile,
      isAdmin: profile.role === "admin",
    };
  } catch (error) {
    logger.warn("requireAdminUser fell back to a safe profile", {
      category: "error",
      service: "supabase",
      userId: user.id,
      error: { message: error instanceof Error ? error.message : String(error), name: "SupabaseProfileError" },
    });

    const profile = createFallbackProfile(user);

    return {
      user,
      profile,
      isAdmin: profile.role === "admin",
    };
  }
}
