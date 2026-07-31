import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import { routes } from "@/config/routes";
import { ensureProfile } from "@/lib/supabase/profile";
import { getServerUser } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const user = await getServerUser();

  if (!user) {
    redirect(routes.login);
  }

  const profile = await ensureProfile(user);

  return <ProfileForm profile={profile} layoutVariant={profile.role === "admin" ? "admin" : "default"} />;
}
