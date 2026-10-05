import type { WebsiteStructure } from "@/lib/ai/structure/types";
import { validateWebsiteStructure } from "@/lib/ai/structure/schemas";
import { validateEditorDocument } from "@/lib/editor/document/validation";
import type { EditorDocument } from "@/lib/editor/document/types";
import type {
  CanonicalWebsiteVersionSnapshot,
  LegacyWebsiteVersionSnapshot,
  WebsiteVersionSnapshot,
} from "./types";

function cloneStructure(structure: WebsiteStructure): WebsiteStructure {
  return structuredClone(structure);
}

function cloneDocument(document: EditorDocument): EditorDocument {
  return structuredClone(document);
}

/** Builds the v2 snapshot payload used by the future atomic editor-save RPC. */
export function createCanonicalWebsiteVersionSnapshot(params: {
  structure: WebsiteStructure;
  canonicalDocument: EditorDocument;
  editorRevision: number;
  capturedAt: string;
}): CanonicalWebsiteVersionSnapshot {
  const structureErrors = validateWebsiteStructure(params.structure);
  if (structureErrors.length > 0) {
    throw new Error(`Canonical version snapshot structure is invalid: ${structureErrors.join("; ")}`);
  }

  const documentErrors = validateEditorDocument(params.canonicalDocument);
  if (documentErrors.length > 0) {
    throw new Error(`Canonical version snapshot document is invalid: ${documentErrors.map((error) => error.message).join("; ")}`);
  }
  if (params.canonicalDocument.compatibility.structureId !== params.structure.id) {
    throw new Error("Canonical version snapshot document does not match the compatibility structure.");
  }
  if (!Number.isInteger(params.editorRevision) || params.editorRevision < 1) {
    throw new Error("Canonical version snapshot editor revision must be a positive integer.");
  }

  return {
    schemaVersion: 2,
    capturedAt: params.capturedAt,
    structure: cloneStructure(params.structure),
    canonicalDocument: cloneDocument(params.canonicalDocument),
    canonicalDocumentSchemaVersion: params.canonicalDocument.schemaVersion,
    editorRevision: params.editorRevision,
  };
}

export function isLegacyWebsiteVersionSnapshot(
  snapshot: WebsiteVersionSnapshot,
): snapshot is LegacyWebsiteVersionSnapshot {
  return snapshot.schemaVersion === 1;
}

export function isCanonicalWebsiteVersionSnapshot(
  snapshot: WebsiteVersionSnapshot,
): snapshot is CanonicalWebsiteVersionSnapshot {
  return snapshot.schemaVersion === 2;
}

/** Reads either persisted schema without requiring a renderer or database client. */
export function assertWebsiteVersionSnapshot(snapshot: WebsiteVersionSnapshot): WebsiteStructure {
  const schemaVersion = (snapshot as { schemaVersion?: unknown }).schemaVersion;
  if (schemaVersion !== 1 && schemaVersion !== 2) {
    throw new Error(`Unsupported website version snapshot schema: ${String(schemaVersion)}`);
  }

  const structureErrors = validateWebsiteStructure(snapshot.structure);
  if (structureErrors.length > 0) {
    throw new Error(`Stored website version snapshot is invalid: ${structureErrors.join("; ")}`);
  }

  if (isCanonicalWebsiteVersionSnapshot(snapshot)) {
    if (snapshot.canonicalDocumentSchemaVersion !== snapshot.canonicalDocument.schemaVersion) {
      throw new Error("Stored canonical version snapshot has a mismatched document schema version.");
    }
    if (snapshot.canonicalDocument.compatibility.structureId !== snapshot.structure.id) {
      throw new Error("Stored canonical version snapshot document does not match the compatibility structure.");
    }
    const documentErrors = validateEditorDocument(snapshot.canonicalDocument);
    if (documentErrors.length > 0) {
      throw new Error(`Stored canonical version snapshot document is invalid: ${documentErrors.map((error) => error.message).join("; ")}`);
    }
  }

  return snapshot.structure;
}
