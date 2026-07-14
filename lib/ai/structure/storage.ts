/**
 * Website structure persistence layer.
 *
 * Reads and writes `WebsiteStructure` records to the
 * `public.website_structures` Supabase table. Uses the service role client
 * (which bypasses RLS) and applies explicit `user_id` filters to enforce
 * ownership at the application layer.
 *
 * Import the Supabase client from @/lib/supabase/server and logger from
 * @/lib/observability - never access config or process.env directly here.
 */

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/observability";
import type { WebsiteStructure, WebsiteStructureRow } from "./types";

type WebsiteStructureStorageStatus =
  | WebsiteStructure["status"]
  | "draft"
  | "published"
  | "archived";

interface WebsiteStructureWriteOptions {
  useLegacyStatus: boolean;
}

interface WebsiteStructureErrorDetails {
  code?: string;
  message: string;
  searchable: string;
}

type WebsiteStructureAuditColumnSupport = "unknown" | "supported" | "unsupported";

let websiteStructureAuditColumnSupport: WebsiteStructureAuditColumnSupport = "unknown";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getWebsiteStructureErrorDetails(error: unknown): WebsiteStructureErrorDetails {
  const code = readString((error as { code?: unknown } | null)?.code);
  const message =
    error instanceof Error
      ? error.message
      : readString((error as { message?: unknown } | null)?.message) ?? "Unknown error";
  const details = readString((error as { details?: unknown } | null)?.details);
  const hint = readString((error as { hint?: unknown } | null)?.hint);

  return {
    code,
    message,
    searchable: [message, details, hint].filter(Boolean).join(" ").toLowerCase(),
  };
}

function normalizeLegacyStorageStatus(
  status: WebsiteStructure["status"],
): WebsiteStructureStorageStatus {
  switch (status) {
    case "generated":
    case "edited":
    case "scheduled":
      return "draft";
    case "deleted":
      return "archived";
    default:
      return status;
  }
}

function hasLegacyStatusFallback(status: WebsiteStructure["status"]): boolean {
  return normalizeLegacyStorageStatus(status) !== status;
}

function getStoredStatus(
  structure: WebsiteStructure,
  options: WebsiteStructureWriteOptions,
): WebsiteStructureStorageStatus {
  return options.useLegacyStatus
    ? normalizeLegacyStorageStatus(structure.status)
    : structure.status;
}

function isMissingWebsiteStructureAuditColumnError(error: unknown): boolean {
  const details = getWebsiteStructureErrorDetails(error);
  const mentionsAuditColumn =
    details.searchable.includes("created_by") ||
    details.searchable.includes("updated_by") ||
    details.searchable.includes("deleted_at");

  return (
    details.code === "PGRST204" ||
    details.code === "42703" ||
    mentionsAuditColumn ||
    details.searchable.includes("schema cache") ||
    details.searchable.includes("could not find the column") ||
    (details.searchable.includes("column") && details.searchable.includes("does not exist"))
  );
}

function isWebsiteStructureSchemaCacheError(error: unknown): boolean {
  const details = getWebsiteStructureErrorDetails(error);

  return (
    details.code === "PGRST204" ||
    details.code === "PGRST205" ||
    details.code === "42703" ||
    details.code === "42P01" ||
    details.searchable.includes("schema cache") ||
    details.searchable.includes("could not find the column") ||
    details.searchable.includes("could not find the table") ||
    (details.searchable.includes("column") && details.searchable.includes("does not exist")) ||
    (details.searchable.includes("relation") && details.searchable.includes("does not exist"))
  );
}

function isWebsiteStructureStatusConstraintError(error: unknown): boolean {
  const details = getWebsiteStructureErrorDetails(error);

  return (
    details.code === "23514" ||
    details.searchable.includes("website_structures_status_check") ||
    (details.searchable.includes("status") && details.searchable.includes("check constraint"))
  );
}

function logWebsiteStructureCompatibilityFallback(args: {
  operation: "insert" | "update";
  structure: WebsiteStructure;
  fallbacks: string[];
  options: WebsiteStructureWriteOptions;
}): void {
  logger.warn("website_structures persistence used compatibility fallback", {
    category: "error",
    service: "supabase",
    structureId: args.structure.id,
    userId: args.structure.userId,
    operation: args.operation,
    compatibilityFallbacks: args.fallbacks,
    originalStatus: args.structure.status,
    storedStatus: getStoredStatus(args.structure, args.options),
  });
}

function toInsertRow(
  structure: WebsiteStructure,
  options: WebsiteStructureWriteOptions,
): Omit<WebsiteStructureRow, "structure" | "source_input"> & {
  structure: WebsiteStructure;
  source_input: WebsiteStructure["sourceInput"];
} {
  const row: Omit<WebsiteStructureRow, "structure" | "source_input"> & {
    structure: WebsiteStructure;
    source_input: WebsiteStructure["sourceInput"];
  } = {
    id: structure.id,
    user_id: structure.userId,
    website_type: structure.websiteType,
    site_title: structure.siteTitle,
    tagline: structure.tagline,
    structure,
    source_input: structure.sourceInput,
    status: getStoredStatus(structure, options),
    version: structure.version,
    generated_at: structure.generatedAt,
    updated_at: structure.updatedAt,
  };

  return row;
}

function toUpdateRow(
  structure: WebsiteStructure,
  options: WebsiteStructureWriteOptions,
): Omit<
  WebsiteStructureRow,
  "id" | "user_id" | "website_type" | "generated_at" | "created_by"
> & {
  structure: WebsiteStructure;
  source_input: WebsiteStructure["sourceInput"];
} {
  const row: Omit<
    WebsiteStructureRow,
    "id" | "user_id" | "website_type" | "generated_at" | "created_by"
  > & {
    structure: WebsiteStructure;
    source_input: WebsiteStructure["sourceInput"];
  } = {
    site_title: structure.siteTitle,
    tagline: structure.tagline,
    structure,
    source_input: structure.sourceInput,
    status: getStoredStatus(structure, options),
    version: structure.version,
    updated_at: structure.updatedAt,
  };

  return row;
}

function fromRow(row: WebsiteStructureRow): WebsiteStructure {
  return row.structure as WebsiteStructure;
}

async function syncWebsiteStructureAuditColumnsBestEffort(args: {
  operation: "insert" | "update";
  structure: WebsiteStructure;
}): Promise<void> {
  if (websiteStructureAuditColumnSupport === "unsupported") {
    return;
  }

  const supabase = getSupabaseServiceClient();
  const auditRow: {
    created_by?: string;
    updated_by: string;
    deleted_at: string | null;
  } = {
    updated_by: args.structure.userId,
    deleted_at: args.structure.management?.deletedAt ?? null,
  };

  if (args.operation === "insert") {
    auditRow.created_by = args.structure.userId;
  }

  const { error } = await supabase
    .from("website_structures")
    .update(auditRow)
    .eq("id", args.structure.id)
    .eq("user_id", args.structure.userId);

  if (!error) {
    websiteStructureAuditColumnSupport = "supported";
    return;
  }

  const details = getWebsiteStructureErrorDetails(error);

  if (
    isMissingWebsiteStructureAuditColumnError(error) ||
    isWebsiteStructureSchemaCacheError(error)
  ) {
    websiteStructureAuditColumnSupport = "unsupported";
    logger.warn("website_structures audit sync skipped for minimum schema compatibility", {
      category: "error",
      service: "supabase",
      structureId: args.structure.id,
      userId: args.structure.userId,
      operation: args.operation,
      error: {
        message: details.message,
        name: "SupabaseStructureAuditCompatibilityWarning",
      },
    });
    return;
  }

  logger.warn("website_structures audit sync failed after primary write", {
    category: "error",
    service: "supabase",
    structureId: args.structure.id,
    userId: args.structure.userId,
    operation: args.operation,
    error: {
      message: details.message,
      name: "SupabaseStructureAuditSyncWarning",
    },
  });
}

async function writeWebsiteStructureWithCompatibility(args: {
  operation: "insert" | "update";
  structure: WebsiteStructure;
  execute: (
    options: WebsiteStructureWriteOptions,
  ) => Promise<{ error: { message: string } | null }>;
}): Promise<void> {
  const options: WebsiteStructureWriteOptions = {
    useLegacyStatus: false,
  };
  const fallbacks: string[] = [];
  let lastError: { message: string } | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { error } = await args.execute(options);
    if (!error) {
      if (fallbacks.length > 0) {
        logWebsiteStructureCompatibilityFallback({
          operation: args.operation,
          structure: args.structure,
          fallbacks,
          options,
        });
      }
      return;
    }

    lastError = error;

    if (
      !options.useLegacyStatus &&
      hasLegacyStatusFallback(args.structure.status) &&
      isWebsiteStructureStatusConstraintError(error)
    ) {
      options.useLegacyStatus = true;
      fallbacks.push(`legacy_status:${normalizeLegacyStorageStatus(args.structure.status)}`);
      continue;
    }

    if (isWebsiteStructureSchemaCacheError(error) && attempt < 4) {
      fallbacks.push(`schema_cache_retry:${attempt + 1}`);
      await delay(250 * (attempt + 1));
      continue;
    }

    break;
  }

  throw lastError ?? new Error("Unknown website structure persistence error");
}

/**
 * Insert a new website structure record.
 * Throws on Supabase error.
 */
export async function storeWebsiteStructure(
  structure: WebsiteStructure,
): Promise<WebsiteStructure> {
  const supabase = getSupabaseServiceClient();

  try {
    await writeWebsiteStructureWithCompatibility({
      operation: "insert",
      structure,
      execute: async (options) =>
        supabase.from("website_structures").insert(toInsertRow(structure, options)),
    });
    await syncWebsiteStructureAuditColumnsBestEffort({
      operation: "insert",
      structure,
    });
  } catch (error) {
    const details = getWebsiteStructureErrorDetails(error);

    logger.error("Failed to store website structure", {
      category: "error",
      service: "supabase",
      structureId: structure.id,
      error: {
        message: details.message,
        name: "SupabaseStructureError",
      },
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

  try {
    await writeWebsiteStructureWithCompatibility({
      operation: "update",
      structure,
      execute: async (options) =>
        supabase
          .from("website_structures")
          .update(toUpdateRow(structure, options))
          .eq("id", structure.id)
          .eq("user_id", structure.userId),
    });
    await syncWebsiteStructureAuditColumnsBestEffort({
      operation: "update",
      structure,
    });
  } catch (error) {
    const details = getWebsiteStructureErrorDetails(error);

    logger.error("Failed to update website structure", {
      category: "error",
      service: "supabase",
      structureId: structure.id,
      error: {
        message: details.message,
        name: "SupabaseStructureError",
      },
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
    if (error.code === "PGRST116") {
      return null;
    }

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
    if (error.code === "PGRST116") {
      return null;
    }

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
