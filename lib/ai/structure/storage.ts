/**
 * Website structure persistence layer.
 *
 * Reads and writes `WebsiteStructure` records to the
 * `public.website_structures` Supabase table.  Uses the service role client
 * (which bypasses RLS) and applies explicit `user_id` filters to enforce
 * ownership at the application layer.
 *
 * Import the Supabase client from @/lib/supabase/server and logger from
 * @/lib/observability — never access config or process.env directly here.
 */

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/observability";
import type { WebsiteStructure, WebsiteStructureRow } from "./types";

// ---------------------------------------------------------------------------
// Row ↔ model conversion
// ---------------------------------------------------------------------------

function toRow(
  structure: WebsiteStructure,
): Omit<WebsiteStructureRow, "structure" | "source_input"> & {
  structure: WebsiteStructure;
  source_input: WebsiteStructure["sourceInput"];
} {
  return {
    id: structure.id,
    user_id: structure.userId,
    website_type: structure.websiteType,
    site_title: structure.siteTitle,
    tagline: structure.tagline,
    structure,
    source_input: structure.sourceInput,
    status: structure.status,
    version: structure.version,
    generated_at: structure.generatedAt,
    updated_at: structure.updatedAt,
  };
}

function fromRow(row: WebsiteStructureRow): WebsiteStructure {
  return row.structure as WebsiteStructure;
}

// ---------------------------------------------------------------------------
// CRUD helpers
// ---------------------------------------------------------------------------

/**
 * Insert a new website structure record.
 * Throws on Supabase error.
 */
export async function storeWebsiteStructure(
  structure: WebsiteStructure,
): Promise<WebsiteStructure> {
  const supabase = getSupabaseServiceClient();
  const row = toRow(structure);

  const { error } = await supabase.from("website_structures").insert(row);

  if (error) {
    logger.error("Failed to store website structure", {
      category: "error",
      service: "supabase",
      structureId: structure.id,
      error: { message: error.message, name: "SupabaseStructureError" },
    });
    throw error;
  }

  return structure;
}

/**
 * Update an existing website structure record (version + content columns only).
 * Applies `user_id` ownership filter.
 * Throws on Supabase error.
 */
export async function updateWebsiteStructure(
  structure: WebsiteStructure,
): Promise<WebsiteStructure> {
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
    logger.error("Failed to update website structure", {
      category: "error",
      service: "supabase",
      structureId: structure.id,
      error: { message: error.message, name: "SupabaseStructureError" },
    });
    throw error;
  }

  return structure;
}

/**
 * Fetch a single structure by ID, scoped to the given user.
 * Returns null when no matching record exists.
 * Throws on unexpected Supabase errors.
 */
export async function getWebsiteStructure(
  id: string,
  userId: string,
): Promise<WebsiteStructure | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("website_structures")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) {
    // PGRST116 = no rows — not an error, simply absent.
    if (error.code === "PGRST116") return null;

    logger.error("Failed to fetch website structure", {
      category: "error",
      service: "supabase",
      structureId: id,
      error: { message: error.message, name: "SupabaseStructureError" },
    });
    throw error;
  }

  return fromRow(data as WebsiteStructureRow);
}

/**
 * List all structures owned by the given user, ordered newest-first.
 */
export async function listWebsiteStructures(
  userId: string,
): Promise<WebsiteStructure[]> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("website_structures")
    .select("*")
    .eq("user_id", userId)
    .order("generated_at", { ascending: false });

  if (error) {
    logger.error("Failed to list website structures", {
      category: "error",
      service: "supabase",
      userId,
      error: { message: error.message, name: "SupabaseStructureError" },
    });
    throw error;
  }

  return (data as WebsiteStructureRow[]).map(fromRow);
}

/**
 * Fetch a structure by id without user scoping.
 * Intended for public live-route resolution where publication state is checked separately.
 */
export async function getWebsiteStructureById(
  id: string,
): Promise<WebsiteStructure | null> {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("website_structures")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;

    logger.error("Failed to fetch website structure by id", {
      category: "error",
      service: "supabase",
      structureId: id,
      error: { message: error.message, name: "SupabaseStructureError" },
    });
    throw error;
  }

  return fromRow(data as WebsiteStructureRow);
}
