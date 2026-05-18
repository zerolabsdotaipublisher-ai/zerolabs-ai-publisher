import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { logger } from "@/lib/observability";
import { createFallbackProfile, getSafeProfile } from "./profile";
import { getServerUser } from "./server";

export async function requireUser(redirectPath?: string) {
  const user = await getServerUser();

  if (!user) {
    const destination = redirectPath ? `${routes.login}?next=${encodeURIComponent(redirectPath)}` : routes.login;
    redirect(destination);
  }

  return user;
}

export async function requireUserProfile(redirectPath?: string) {
  const user = await requireUser(redirectPath);
  let profile = createFallbackProfile(user);

  try {
    profile = await getSafeProfile(user);
  } catch (error) {
    logger.error("requireUserProfile fell back to regular user profile", {
      category: "error",
      service: "supabase",
      userId: user.id,
      error: { message: error instanceof Error ? error.message : String(error), name: "SupabaseProfileError" },
    });
  }

  return { user, profile };
}

export async function requireAdminUser(redirectPath?: string) {
  const auth = await requireUserProfile(redirectPath);

  if (auth.profile.role !== "admin") {
    redirect(routes.dashboard);
  }

  return auth;
}
