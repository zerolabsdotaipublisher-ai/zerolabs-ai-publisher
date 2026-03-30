import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { getServerUser } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/profile";
import { ProfileForm } from "@/components/profile/profile-form";

/**
 * Profile page — /profile
 *
 * Server component: fetches the authenticated user and their profile before
 * rendering.  Uses ensureProfile() so a row is guaranteed to exist even on
 * the first visit (e.g. edge case where callback sync was skipped).
 *
 * The page is protected by the (app) layout via requireUser(); this redirect
 * is a safety net only.
 */
export default async function ProfilePage() {
  const user = await getServerUser();

  if (!user) {
    redirect(routes.login);
  }

  const profile = await ensureProfile(user);

  return <ProfileForm profile={profile} />;
}
