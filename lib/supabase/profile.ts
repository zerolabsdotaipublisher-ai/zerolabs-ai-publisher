import type { User } from "@supabase/supabase-js";
import { logger } from "@/lib/observability";
import { getSupabaseServiceClient } from "./server";

type ProfileMetadata = {
  full_name?: string;
  avatar_url?: string;
};

function getMetadata(user: User): ProfileMetadata {
  const raw = user.user_metadata;

  if (!raw || typeof raw !== "object") {
    return {};
  }

  const metadata: ProfileMetadata = {};

  if ("full_name" in raw && typeof raw.full_name === "string") {
    metadata.full_name = raw.full_name;
  }

  if ("avatar_url" in raw && typeof raw.avatar_url === "string") {
    metadata.avatar_url = raw.avatar_url;
  }

  return metadata;
}

export async function syncProfileFromAuthUser(user: User): Promise<void> {
  if (!user.email) {
    logger.warn("profile sync skipped due to missing email", {
      category: "security",
      service: "supabase",
      userId: user.id,
    });
    throw new Error("Auth user is missing an email address");
  }

  const supabase = getSupabaseServiceClient();
  const metadata = getMetadata(user);

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      full_name: metadata.full_name ?? null,
      avatar_url: metadata.avatar_url ?? null,
    },
    { onConflict: "id" }
  );

  if (error) {
    logger.error("profile sync failed", {
      category: "error",
      service: "supabase",
      userId: user.id,
      error: { message: error.message, name: "SupabaseProfileSyncError" },
    });
    throw error;
  }
}
