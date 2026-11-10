import { redirect } from "next/navigation";
import { getPublicCommunityPostsForAuthor, getPublicWebsitesForOwner } from "@/app/(app)/feed/queries";
import { ProfileView } from "@/components/profile/profile-view";
import { routes } from "@/config/routes";
import { ensureProfile } from "@/lib/supabase/profile";
import { getServerUser } from "@/lib/supabase/server";
import { resolveProfileMediaDisplayUrls } from "@/lib/profile-media-server";
import { getProfileAppearance } from "@/lib/profile-appearance";

export default async function ProfilePage() {
  const user = await getServerUser();

  if (!user) {
    redirect(routes.login);
  }

  const [profile, websites, posts] = await Promise.all([
    ensureProfile(user),
    getPublicWebsitesForOwner(user.id),
    getPublicCommunityPostsForAuthor(user.id),
  ]);
  const appearance = getProfileAppearance(profile.preferences);
  const mediaUrls = await resolveProfileMediaDisplayUrls({
    userId: user.id,
    avatarReference: profile.avatar_url,
    coverReference: appearance.coverUrl,
    backgroundReference: appearance.background.imageUrl,
  });

  return (
    <ProfileView
      profile={profile}
      layoutVariant={profile.role === "admin" ? "admin" : "default"}
      websites={websites}
      posts={posts}
      mediaUrls={mediaUrls}
    />
  );
}
