"use client";

type PreviewFailedStage =
  | "database-read"
  | "preview-load"
  | "preview-parse"
  | "preview-render";

type PreviewSafeErrorCategory =
  | "database-read-failed"
  | "preview-version-fallback-recovered"
  | "preview-fallback-structure-used"
  | "preview-structure-unavailable"
  | "preview-model-invalid"
  | "preview-render-failed";

interface PreviewClientDiagnosticInput {
  message: string;
  requestId?: string;
  structureId?: string;
  failedStage: PreviewFailedStage;
  safeErrorCategory: PreviewSafeErrorCategory;
  routeKind?: "owner" | "shared";
  boundaryName?: string;
  digest?: string;
  error?: unknown;
}

interface PreviewClientDiagnosticPayload {
  failedStage: PreviewFailedStage;
  safeErrorCategory: PreviewSafeErrorCategory;
  requestId?: string;
  structureId?: string;
  routeKind?: "owner" | "shared";
  boundaryName?: string;
  digest?: string;
  errorName?: string;
}

function getSafeErrorName(error: unknown): string | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }

  const normalized = error.name.trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.length > 80 ? normalized.slice(0, 80) : normalized;
}

export function logPreviewClientDiagnostic({
  message,
  error,
  ...meta
}: PreviewClientDiagnosticInput): void {
  const payload: PreviewClientDiagnosticPayload = {
    ...meta,
    errorName: getSafeErrorName(error),
  };

  if (!payload.errorName) {
    delete payload.errorName;
  }

  console.error(message, payload);
}
