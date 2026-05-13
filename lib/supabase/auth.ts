import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { ensureProfile } from "./profile";
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
  const profile = await ensureProfile(user);

  return { user, profile };
}

export async function requireAdminUser(redirectPath?: string) {
  const auth = await requireUserProfile(redirectPath);

  if (auth.profile.role !== "admin") {
    redirect(routes.dashboard);
  }

  return auth;
}
