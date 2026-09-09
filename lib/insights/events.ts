import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/server";

type WebsiteViewEventInput = {
  ownerUserId: string;
  structureId: string;
  viewerUserId?: string | null;
  source: string;
  pathname?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
};

function optionalText(value: string | null | undefined): string | null {
  const text = value?.trim();
  return text ? text : null;
}

/**
 * Records a public website view without relying on client-provided ownership.
 * website_view_events uses the UUID website_projects identifier while live
 * routes use the legacy text website_structures identifier, so the project is
 * resolved on the server before the event is inserted.
 */
export async function recordWebsiteView(input: WebsiteViewEventInput): Promise<void> {
  try {
    const supabase = getSupabaseServiceClient();
    const { data: project, error: projectError } = await supabase
      .from("website_projects")
      .select("id")
      .eq("source_structure_id", input.structureId)
      .eq("user_id", input.ownerUserId)
      .maybeSingle();

    if (projectError || !project?.id) {
      return;
    }

    await supabase.from("website_view_events").insert({
      owner_user_id: input.ownerUserId,
      viewer_user_id: input.viewerUserId ?? null,
      website_id: project.id,
      source: optionalText(input.source),
      pathname: optionalText(input.pathname),
      referrer: optionalText(input.referrer),
      user_agent: optionalText(input.userAgent),
    });
  } catch {
    // Analytics must never interrupt the public website render. A missing
    // optional table is reported as setup-required in Insights instead.
  }
}
