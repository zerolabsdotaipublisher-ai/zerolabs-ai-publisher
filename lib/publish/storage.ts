import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/observability";
import { getWebsiteStructure } from "@/lib/ai/structure";
import type { WebsiteStructure } from "@/lib/ai/structure";

export class PublishStorageConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublishStorageConflictError";
  }
}

export async function getOwnedPublishStructure(structureId: string, userId: string): Promise<WebsiteStructure | null> {
  const structure = await getWebsiteStructure(structureId, userId);
  if (!structure || structure.management?.deletedAt) {
    return null;
  }

  return structure;
}

export async function savePublishStructure(
  structure: WebsiteStructure,
  options?: { expectedUpdatedAt?: string },
): Promise<WebsiteStructure> {
  if (!options?.expectedUpdatedAt) {
    const supabase = getSupabaseServiceClient();
    const { error } = await supabase
      .from("website_structures")
      .update({
        site_title: structure.siteTitle,
        tagline: structure.tagline,
        structure,
        source_input: structure.sourceInput,
        status: structure.status,
        version: structure.version,
        updated_at: structure.updatedAt,
      })
      .eq("id", structure.id)
      .eq("user_id", structure.userId);

    if (error) {
      logger.error("Failed to update website structure for publication", {
        category: "error",
        service: "supabase",
        structureId: structure.id,
        error: { message: error.message, name: "SupabaseStructureError" },
      });
      throw error;
    }

    return structure;
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("website_structures")
    .update({
      site_title: structure.siteTitle,
      tagline: structure.tagline,
      structure,
      source_input: structure.sourceInput,
      status: structure.status,
      version: structure.version,
      updated_at: structure.updatedAt,
    })
    .eq("id", structure.id)
    .eq("user_id", structure.userId)
    .eq("updated_at", options.expectedUpdatedAt)
    .select("id")
    .maybeSingle();

  if (error) {
    logger.error("Failed to update website structure for publication", {
      category: "error",
      service: "supabase",
      structureId: structure.id,
      error: { message: error.message, name: "SupabaseStructureError" },
    });
    throw error;
  }

  if (!data) {
    throw new PublishStorageConflictError(
      "Another deployment update request modified this website before the current request could continue.",
    );
  }

  return structure;
}
