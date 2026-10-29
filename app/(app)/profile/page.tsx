import { redirect } from "next/navigation";
import { getPublicCommunityPostsForAuthor, getPublicWebsitesForOwner } from "@/app/(app)/feed/queries";
import { ProfileView } from "@/components/profile/profile-view";
import { routes } from "@/config/routes";
import { ensureProfile } from "@/lib/supabase/profile";
import { getServerUser } from "@/lib/supabase/server";

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

  return (
    <ProfileView
      profile={profile}
      layoutVariant={profile.role === "admin" ? "admin" : "default"}
      websites={websites}
      posts={posts}
    />
  );
}
