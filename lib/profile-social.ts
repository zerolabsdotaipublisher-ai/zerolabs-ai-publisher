import "server-only";

import { logger } from "@/lib/observability";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type ProfileSocialStats = {
  followersCount: number;
  followingCount: number;
};

export type ProfileRelationship = {
  isSelf: boolean;
  isFollowing: boolean;
};

const EMPTY_PROFILE_SOCIAL_STATS: ProfileSocialStats = {
  followersCount: 0,
  followingCount: 0,
};

/**
 * Resolves outgoing follows for a viewer in one query. Feed callers should
 * pass their de-duplicated author IDs to avoid querying once per post.
 */
export async function getFollowingProfileIds(
  viewerUserId: string | null | undefined,
  profileUserIds: Iterable<string>,
): Promise<Set<string>> {
  const viewerId = viewerUserId?.trim();
  const uniqueProfileIds = [...new Set([...profileUserIds].map((id) => id.trim()).filter(Boolean))]
    .filter((profileUserId) => profileUserId !== viewerId);
  if (!viewerId || uniqueProfileIds.length === 0) return new Set();

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("profile_follows")
      .select("followed_user_id")
      .eq("follower_user_id", viewerId)
      .in("followed_user_id", uniqueProfileIds);

    if (error) {
      logger.warn("Profile follow relationships are unavailable", {
        category: "error",
        service: "supabase",
        userId: viewerId,
        error: { name: "ProfileRelationshipError", message: error.message },
      });
      return new Set();
    }

    return new Set(
      (data ?? [])
        .map((row) => row.followed_user_id)
        .filter((profileUserId): profileUserId is string => typeof profileUserId === "string"),
    );
  } catch (error) {
    logger.warn("Profile follow relationships could not be loaded", {
      category: "error",
      service: "supabase",
      userId: viewerId,
      error: { name: "ProfileRelationshipError", message: error instanceof Error ? error.message : "Unknown relationship query error" },
    });
    return new Set();
  }
}

export async function getProfileRelationship(
  viewerUserId: string | null | undefined,
  profileUserId: string,
): Promise<ProfileRelationship> {
  const viewerId = viewerUserId?.trim();
  const viewedProfileUserId = profileUserId.trim();
  const isSelf = Boolean(viewerId && viewerId === viewedProfileUserId);
  if (!viewerId || !viewedProfileUserId || isSelf) return { isSelf, isFollowing: false };

  const followingProfileUserIds = await getFollowingProfileIds(viewerId, [viewedProfileUserId]);
  return { isSelf: false, isFollowing: followingProfileUserIds.has(viewedProfileUserId) };
}

/**
 * Counts the public follow relationships for the profile being viewed.
 *
 * `profileUserId` is intentionally distinct from any signed-in viewer ID: a
 * profile's follower/following totals must never use the viewer's relationships.
 */
export async function getProfileSocialStats(profileUserId: string): Promise<ProfileSocialStats> {
  if (!profileUserId) {
    return EMPTY_PROFILE_SOCIAL_STATS;
  }

  try {
    const supabase = await getSupabaseServerClient();
    const [followers, following] = await Promise.all([
      supabase
        .from("profile_follows")
        .select("id", { count: "exact", head: true })
        .eq("followed_user_id", profileUserId),
      supabase
        .from("profile_follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_user_id", profileUserId),
    ]);

    if (followers.error || following.error) {
      logger.warn("Profile social stats are unavailable", {
        category: "error",
        service: "supabase",
        profileUserId,
        error: {
          name: "ProfileSocialStatsError",
          message: followers.error?.message ?? following.error?.message ?? "Unknown count query error",
        },
      });
      return EMPTY_PROFILE_SOCIAL_STATS;
    }

    return {
      followersCount: followers.count ?? 0,
      followingCount: following.count ?? 0,
    };
  } catch (error) {
    logger.warn("Profile social stats could not be loaded", {
      category: "error",
      service: "supabase",
      profileUserId,
      error: {
        name: "ProfileSocialStatsError",
        message: error instanceof Error ? error.message : "Unknown count query error",
      },
    });
    return EMPTY_PROFILE_SOCIAL_STATS;
  }
}
