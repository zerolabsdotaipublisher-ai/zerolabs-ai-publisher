import "server-only";

import { logger } from "@/lib/observability";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type ProfileSocialStats = {
  followersCount: number;
  followingCount: number;
};

const EMPTY_PROFILE_SOCIAL_STATS: ProfileSocialStats = {
  followersCount: 0,
  followingCount: 0,
};

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
