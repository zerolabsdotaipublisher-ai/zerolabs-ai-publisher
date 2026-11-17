"use server";

import { revalidatePath } from "next/cache";
import { routes } from "@/config/routes";
import { logger } from "@/lib/observability";
import { getServerUser, getSupabaseServerClient } from "@/lib/supabase/server";

export type FollowProfileActionResult = { success: true } | { error: string };

function getTargetUserId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const targetUserId = value.trim();
  return targetUserId && targetUserId.length <= 128 ? targetUserId : null;
}

function logFollowMutationError(operation: "follow" | "unfollow", error: { code?: string; message?: string } | null) {
  logger.warn(`Profile ${operation} mutation failed`, {
    category: "error",
    service: "supabase",
    error: {
      name: "ProfileFollowMutationError",
      message: error?.code ? `Supabase error ${error.code}` : "Profile relationship mutation failed",
    },
  });
}

function revalidateRelationshipViews() {
  try {
    revalidatePath(routes.feed);
    revalidatePath(routes.profile);
    revalidatePath("/profile/u/[username]", "page");
  } catch (error) {
    // The relationship write already succeeded. A later refresh failure must
    // not make the client roll back a correct optimistic relationship state.
    logFollowMutationError("follow", error as { code?: string; message?: string } | null);
  }
}

/**
 * The follower ID is always derived from the authenticated server session;
 * callers may provide only the profile they intend to follow.
 */
export async function followProfile(targetUserId: string): Promise<FollowProfileActionResult> {
  const viewer = await getServerUser();
  if (!viewer) return { error: "Sign in to follow profiles." };

  const targetId = getTargetUserId(targetUserId);
  if (!targetId) return { error: "Choose a valid profile to follow." };
  if (targetId === viewer.id) return { error: "You cannot follow your own profile." };

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("profile_follows")
      .upsert(
        { follower_user_id: viewer.id, followed_user_id: targetId },
        { onConflict: "follower_user_id,followed_user_id", ignoreDuplicates: true },
      );

    // The unique pair is canonical. Treat a concurrent duplicate insert as a
    // successful, idempotent follow even when an older client reports it.
    if (error && error.code !== "23505") {
      logFollowMutationError("follow", error);
      return { error: "Unable to follow this profile. Please try again." };
    }

    revalidateRelationshipViews();
    return { success: true };
  } catch (error) {
    logFollowMutationError("follow", error as { code?: string; message?: string } | null);
    return { error: "Unable to follow this profile. Please try again." };
  }
}

/** Removes only the authenticated viewer's outgoing relationship. */
export async function unfollowProfile(targetUserId: string): Promise<FollowProfileActionResult> {
  const viewer = await getServerUser();
  if (!viewer) return { error: "Sign in to manage followed profiles." };

  const targetId = getTargetUserId(targetUserId);
  if (!targetId) return { error: "Choose a valid profile to unfollow." };
  if (targetId === viewer.id) return { error: "You cannot unfollow your own profile." };

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("profile_follows")
      .delete()
      .eq("follower_user_id", viewer.id)
      .eq("followed_user_id", targetId);

    if (error) {
      logFollowMutationError("unfollow", error);
      return { error: "Unable to unfollow this profile. Please try again." };
    }

    revalidateRelationshipViews();
    return { success: true };
  } catch (error) {
    logFollowMutationError("unfollow", error as { code?: string; message?: string } | null);
    return { error: "Unable to unfollow this profile. Please try again." };
  }
}
