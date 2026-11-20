import { redirect } from "next/navigation";
import { getPublicCommunityPostsForAuthor, getPublicWebsitesForOwner } from "@/app/(app)/feed/queries";
import { ProfileView } from "@/components/profile/profile-view";
import { routes } from "@/config/routes";
import { getProfileAppearance } from "@/lib/profile-appearance";
import { resolveProfileMediaDisplayUrls } from "@/lib/profile-media-server";
import { getProfileRelationship, getProfileSocialStats } from "@/lib/profile-social";
import type { PublicProfile } from "@/lib/supabase/profile";
import { getServerUser } from "@/lib/supabase/server";

/** Shared authenticated visitor presentation for username and ID profile routes. */
export async function PublicProfilePage({ profile }: { profile: PublicProfile }) {
  const user = await getServerUser();
  if (!user) redirect(routes.login);

  // The route resolves this profile first. Every visitor-facing query below
  // must use that resolved identity, never the signed-in viewer's identity.
  const profileUserId = profile.id;

  // Preserve `/profile` as the signed-in owner experience and avoid rendering
  // a visitor action state for the current user through a public URL.
  if (profileUserId === user.id) redirect(routes.profile);

  const appearance = getProfileAppearance(profile.preferences);
  const [websites, posts, socialStats, relationship, mediaUrls] = await Promise.all([
    getPublicWebsitesForOwner(profileUserId),
    getPublicCommunityPostsForAuthor(profileUserId),
    getProfileSocialStats(profileUserId),
    getProfileRelationship(user.id, profileUserId),
    resolveProfileMediaDisplayUrls({
      userId: profileUserId,
      avatarReference: profile.avatar_url,
      coverReference: appearance.coverUrl,
      backgroundReference: appearance.background.imageUrl,
    }),
  ]);

  return (
    <ProfileView
      profile={profile}
      websites={websites}
      posts={posts}
      mediaUrls={mediaUrls}
      socialStats={socialStats}
      viewerUserId={user.id}
      isFollowing={relationship.isFollowing}
    />
  );
}
