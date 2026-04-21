import type { WebsiteStructure } from "@/lib/ai/structure";
import { validateWebsiteStructure } from "@/lib/ai/structure";
import { buildPublicationFingerprint, type PublicationStructureFingerprint } from "@/lib/publish";
import type { WebsiteVersionSnapshot, WebsiteVersionSummary } from "./types";

export interface WebsiteVersionSnapshotBundle {
  snapshot: WebsiteVersionSnapshot;
  fingerprint: PublicationStructureFingerprint;
  summary: WebsiteVersionSummary;
}

function cloneStructure(structure: WebsiteStructure): WebsiteStructure {
  return structuredClone(structure);
}

export function createWebsiteVersionSnapshot(structure: WebsiteStructure): WebsiteVersionSnapshotBundle {
  const validationErrors = validateWebsiteStructure(structure);
  if (validationErrors.length > 0) {
    throw new Error(`Version snapshot is invalid: ${validationErrors.join("; ")}`);
  }

  const structureClone = cloneStructure(structure);
  const fingerprint = buildPublicationFingerprint(structureClone);

  return {
    snapshot: {
      schemaVersion: 1,
      capturedAt: structureClone.updatedAt,
      structure: structureClone,
    },
    fingerprint,
    summary: {
      pageCount: structureClone.pages.length,
      routeCount: fingerprint.routePaths.length,
      assetCount: fingerprint.assetPaths.length,
      pageIds: structureClone.pages.map((page) => page.id),
      routePaths: fingerprint.routePaths,
      assetPaths: fingerprint.assetPaths,
    },
  };
}

export function assertWebsiteVersionSnapshot(snapshot: WebsiteVersionSnapshot): WebsiteStructure {
  if (snapshot.schemaVersion !== 1) {
    throw new Error(`Unsupported website version snapshot schema: ${snapshot.schemaVersion}`);
  }

  const validationErrors = validateWebsiteStructure(snapshot.structure);
  if (validationErrors.length > 0) {
    throw new Error(`Stored website version snapshot is invalid: ${validationErrors.join("; ")}`);
  }

  return snapshot.structure;
}
