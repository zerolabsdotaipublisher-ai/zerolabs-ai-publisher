import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import { routes } from "@/config/routes";
import { ensureProfile } from "@/lib/supabase/profile";
import { getServerUser } from "@/lib/supabase/server";
import { resolveProfileMediaDisplayUrls } from "@/lib/profile-media-server";
import { getProfileAppearance } from "@/lib/profile-appearance";

export default async function CustomizeProfilePage() {
  const user = await getServerUser();

  if (!user) {
    redirect(routes.login);
  }

  const profile = await ensureProfile(user);
  const mediaUrls = await resolveProfileMediaDisplayUrls({
    userId: user.id,
    avatarReference: profile.avatar_url,
    coverReference: getProfileAppearance(profile.preferences).coverUrl,
  });

  return <ProfileForm profile={profile} mediaUrls={mediaUrls} layoutVariant={profile.role === "admin" ? "admin" : "default"} />;
}
