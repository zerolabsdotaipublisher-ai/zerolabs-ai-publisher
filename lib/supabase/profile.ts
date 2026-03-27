import type { User } from "@supabase/supabase-js";
import { logger } from "@/lib/observability";
import { getSupabaseServiceClient } from "./server";

export async function syncProfileFromAuthUser(user: User): Promise<void> {
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      full_name: (user.user_metadata.full_name as string | undefined) ?? null,
      avatar_url: (user.user_metadata.avatar_url as string | undefined) ?? null,
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
