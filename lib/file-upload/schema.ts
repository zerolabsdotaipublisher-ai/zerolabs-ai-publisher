import { parseUsageContext } from "@/lib/media/schema";
import {
  FILE_UPLOAD_ASSOCIATION_TYPES,
  FILE_UPLOAD_SOURCES,
  type FileUploadAssociationInput,
  type FileUploadAssociationType,
  type FileUploadSignedUrlQuery,
  type FileUploadSource,
  type ParsedFileUploadBody,
} from "./types";

function parseIntSafe(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function parseJsonRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== "string") return toRecord(value);
  try {
    const parsed = JSON.parse(value) as unknown;
    return toRecord(parsed);
  } catch {
    return undefined;
  }
}

function parseAssociations(value: unknown): FileUploadAssociationInput[] | undefined {
  const raw = typeof value === "string"
    ? (() => {
        try {
          return JSON.parse(value) as unknown;
        } catch {
          return undefined;
        }
      })()
    : value;

  if (!Array.isArray(raw)) return undefined;

  return raw.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    const associationType = typeof record.associationType === "string" && FILE_UPLOAD_ASSOCIATION_TYPES.includes(record.associationType as FileUploadAssociationType)
      ? (record.associationType as FileUploadAssociationType)
      : undefined;
    const associationId = typeof record.associationId === "string" ? record.associationId.trim() : "";
    if (!associationType || !associationId) return [];
    return [{
      associationType,
      associationId,
      contentId: typeof record.contentId === "string" ? record.contentId.trim() || undefined : undefined,
      contentType: typeof record.contentType === "string" ? record.contentType.trim() || undefined : undefined,
      metadata: toRecord(record.metadata),
    }];
  });
}

export function parseFileUploadSource(value: string | null | undefined): FileUploadSource | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase() as FileUploadSource;
  return FILE_UPLOAD_SOURCES.includes(normalized) ? normalized : undefined;
}

export function parseFileUploadSignedUrlQuery(searchParams: URLSearchParams): FileUploadSignedUrlQuery {
  const parsed = parseIntSafe(searchParams.get("expiresInSeconds"));
  if (!parsed) return {};
  return { expiresInSeconds: Math.max(60, Math.min(60 * 60, parsed)) };
}

export function parseFileUploadBody(value: FormData | Record<string, unknown>): ParsedFileUploadBody {
  const getter = (key: string): unknown => (value instanceof FormData ? value.get(key) : value[key]);

  return {
    tenantId: typeof getter("tenantId") === "string" ? String(getter("tenantId")).trim() || undefined : undefined,
    retryUploadId: typeof getter("retryUploadId") === "string" ? String(getter("retryUploadId")).trim() || undefined : undefined,
    source: parseFileUploadSource(typeof getter("source") === "string" ? String(getter("source")) : undefined),
    linkedContentId: typeof getter("linkedContentId") === "string" ? String(getter("linkedContentId")).trim() || undefined : undefined,
    linkedContentType: typeof getter("linkedContentType") === "string" ? String(getter("linkedContentType")).trim() || undefined : undefined,
    usageContext: typeof getter("usageContext") === "string" ? parseUsageContext(String(getter("usageContext"))) : undefined,
    associations: parseAssociations(getter("associations")),
    metadata: parseJsonRecord(getter("metadata")),
  };
}
