import { storeWebsiteGeneratedContent, type WebsiteContentPackage } from "@/lib/ai/content";
import { storeWebsiteNavigation } from "@/lib/ai/navigation";
import { storeWebsiteSeoMetadata, type WebsiteSeoPackage } from "@/lib/ai/seo";
import type { WebsiteStructure } from "@/lib/ai/structure";
import { logger } from "@/lib/observability";
import { createWebsiteVersionLabel } from "@/lib/versions/model";
import { createWebsiteVersion } from "@/lib/versions/storage";

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isLikelySupabaseSchemaError(error: unknown): boolean {
  const code = readString((error as { code?: unknown } | null)?.code);
  const details = readString((error as { details?: unknown } | null)?.details);
  const hint = readString((error as { hint?: unknown } | null)?.hint);
  const message =
    error instanceof Error
      ? error.message
      : readString((error as { message?: unknown } | null)?.message) ?? "";
  const searchable = [message, details, hint].filter(Boolean).join(" ").toLowerCase();

  return (
    code === "PGRST205" ||
    code === "42P01" ||
    searchable.includes("schema cache") ||
    searchable.includes("could not find the table") ||
    (searchable.includes("relation") && searchable.includes("does not exist"))
  );
}

function logOptionalArtifactFailure(args: {
  artifact: "website_navigation" | "website_seo_metadata" | "website_generated_content";
  structureId: string;
  requestId?: string;
  error: unknown;
}): void {
  const message = args.error instanceof Error ? args.error.message : "Unknown error";

  logger.warn("generation artifact persistence skipped", {
    category: "error",
    service: "supabase",
    structureId: args.structureId,
    requestId: args.requestId,
    failedStage: "database-save",
    safeErrorCategory: "database-save-failed",
    artifact: args.artifact,
    schemaMissing: isLikelySupabaseSchemaError(args.error),
    error: {
      name: "GenerationArtifactPersistenceWarning",
      message,
    },
  });
}

export async function persistNonCriticalGenerationArtifacts(args: {
  structure: WebsiteStructure;
  userId: string;
  requestId?: string;
  seo?: WebsiteSeoPackage;
  content?: WebsiteContentPackage;
}): Promise<void> {
  try {
    await storeWebsiteNavigation({
      structureId: args.structure.id,
      userId: args.userId,
      navigation: args.structure.navigation,
      version: args.structure.version,
      createdAt: args.structure.generatedAt,
      updatedAt: args.structure.updatedAt,
    });
  } catch (error) {
    logOptionalArtifactFailure({
      artifact: "website_navigation",
      structureId: args.structure.id,
      requestId: args.requestId,
      error,
    });
  }

  if (args.seo) {
    try {
      await storeWebsiteSeoMetadata(args.seo);
    } catch (error) {
      logOptionalArtifactFailure({
        artifact: "website_seo_metadata",
        structureId: args.structure.id,
        requestId: args.requestId,
        error,
      });
    }
  }

  if (args.content) {
    try {
      await storeWebsiteGeneratedContent(args.content);
    } catch (error) {
      logOptionalArtifactFailure({
        artifact: "website_generated_content",
        structureId: args.structure.id,
        requestId: args.requestId,
        error,
      });
    }
  }
}

export async function createGenerationVersionSnapshot(args: {
  structure: WebsiteStructure;
  userId: string;
  requestId?: string;
}): Promise<string> {
  const versionRecord = await createWebsiteVersion({
    structure: args.structure,
    userId: args.userId,
    source: "generate",
    status: "draft",
    label: createWebsiteVersionLabel("generate", args.structure),
    requestId: args.requestId,
  });

  return versionRecord.id;
}
