import type { WebsiteStructure } from "@/lib/ai/structure";
import type { EditorDocument } from "./document";
import type { EditorProjectionIssue } from "./document";

/** Request shape reserved for the future atomic canonical Save Draft endpoint. */
export interface AtomicEditorSaveRequest {
  structureId: string;
  expectedRevision: number;
  document: EditorDocument;
  mutation?: {
    clientMutationId?: string;
    baseSavedAt?: string;
  };
}

export interface AtomicEditorSaveSuccess {
  kind: "success";
  structure: WebsiteStructure;
  document: EditorDocument;
  revision: number;
  version: number;
  versionId: string;
  savedAt: string;
}

export interface AtomicEditorSaveMalformed {
  kind: "malformed";
  code: "invalid_request" | "identity_mismatch";
  message: string;
}

export interface AtomicEditorSaveUnauthenticated {
  kind: "unauthenticated";
  code: "unauthenticated";
  message: string;
}

/** Missing and non-owned records deliberately share this public result. */
export interface AtomicEditorSaveNotFound {
  kind: "not_found";
  code: "not_found";
  message: string;
}

export interface AtomicEditorSaveConflict {
  kind: "stale_revision";
  code: "stale_revision";
  message: string;
  current: {
    revision: number;
    version: number;
    updatedAt: string;
  };
}

export interface AtomicEditorSaveValidationFailure {
  kind: "validation_failed";
  code: "validation_failed" | "unprojectable_document";
  message: string;
  issues: EditorProjectionIssue[];
}

export interface AtomicEditorSaveRetryableFailure {
  kind: "persistence_unavailable";
  code: "persistence_unavailable";
  message: string;
  retryable: true;
  requestId?: string;
}

export interface AtomicEditorSaveUnexpectedFailure {
  kind: "persistence_failed";
  code: "persistence_failed";
  message: string;
  retryable: false;
  requestId?: string;
}

export type AtomicEditorSaveOutcome =
  | AtomicEditorSaveSuccess
  | AtomicEditorSaveMalformed
  | AtomicEditorSaveUnauthenticated
  | AtomicEditorSaveNotFound
  | AtomicEditorSaveConflict
  | AtomicEditorSaveValidationFailure
  | AtomicEditorSaveRetryableFailure
  | AtomicEditorSaveUnexpectedFailure;

/** Pure status mapping for the later route; Slice 3A does not invoke it. */
export function atomicEditorSaveHttpStatus(outcome: AtomicEditorSaveOutcome): number {
  switch (outcome.kind) {
    case "success":
      return 200;
    case "malformed":
      return 400;
    case "unauthenticated":
      return 401;
    case "not_found":
      return 404;
    case "stale_revision":
      return 409;
    case "validation_failed":
      return 422;
    case "persistence_unavailable":
      return 503;
    case "persistence_failed":
      return 500;
  }
}
