import { NextResponse } from "next/server";
import type { StorageAccessDecision } from "./types";

export class StorageAccessError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "StorageAccessError";
  }
}

export class StorageAccessDeniedError extends StorageAccessError {
  constructor(decision: StorageAccessDecision) {
    super(decision.reason ?? "Storage access denied.", 403, decision.code ?? "storage_access_denied", {
      operation: decision.operation,
      resourceType: decision.resourceType,
      resourceId: decision.resourceId,
    });
    this.name = "StorageAccessDeniedError";
  }
}

export class StorageResourceNotFoundError extends StorageAccessError {
  constructor(resourceType: string, resourceId: string) {
    super(`${resourceType} resource was not found.`, 404, "storage_resource_not_found", { resourceType, resourceId });
    this.name = "StorageResourceNotFoundError";
  }
}

export function toStorageErrorResponse(error: unknown, fallbackMessage: string): NextResponse {
  if (error instanceof StorageAccessError) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.status },
    );
  }

  return NextResponse.json(
    { ok: false, error: error instanceof Error ? error.message : fallbackMessage },
    { status: 400 },
  );
}
