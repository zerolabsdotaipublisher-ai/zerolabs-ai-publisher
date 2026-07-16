import "server-only";

import { getWebsiteStructure, hasMinimumRenderableStructure, type WebsiteStructure } from "@/lib/ai/structure";
import { logger } from "@/lib/observability";
import { listWebsiteVersions } from "@/lib/versions";
import { verifyPreviewShareToken } from "./sharing";

function isPreviewRenderableStructure(structure: WebsiteStructure | null | undefined): structure is WebsiteStructure {
  if (!structure || structure.management?.deletedAt) {
    return false;
  }

  return hasMinimumRenderableStructure(structure);
}

interface PreviewVersionCandidate {
  structure: WebsiteStructure;
  versionId: string;
  versionNumber: number;
}

interface PreviewVersionSelection {
  candidate: PreviewVersionCandidate | null;
  inspectedCount: number;
}

async function getPreviewStructureFromVersions(
  structureId: string,
  userId: string,
): Promise<PreviewVersionSelection> {
  const versions = await listWebsiteVersions(structureId, userId, { limit: 10 });
  const orderedVersions = [
    ...versions.filter((version) => version.isCurrentDraft),
    ...versions.filter((version) => !version.isCurrentDraft),
  ];

  for (const version of orderedVersions) {
    const candidate = version.snapshot?.structure;
    if (!isPreviewRenderableStructure(candidate)) {
      continue;
    }

    return {
      candidate: {
        structure: candidate,
        versionId: version.id,
        versionNumber: version.versionNumber,
      },
      inspectedCount: orderedVersions.length,
    };
  }

  return {
    candidate: null,
    inspectedCount: orderedVersions.length,
  };
}

async function resolvePreviewStructureCandidate(args: {
  structureId: string;
  userId: string;
  versionFallbackFailureMessage: string;
  versionFallbackFailureName: string;
  requestId?: string;
}): Promise<WebsiteStructure | null> {
  const structure = await getWebsiteStructure(args.structureId, args.userId).catch((error) => {
    logger.warn("Preview failed to read website_structures", {
      category: "error",
      service: "preview",
      failedStage: "database-read",
      safeErrorCategory: "database-read-failed",
      requestId: args.requestId,
      structureId: args.structureId,
      userId: args.userId,
      error: {
        name: "PreviewStructureReadError",
        message: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  });
  if (structure?.management?.deletedAt) {
    return null;
  }

  const structureIsRenderable = isPreviewRenderableStructure(structure);
  const versionSelection = await getPreviewStructureFromVersions(args.structureId, args.userId).catch((error) => {
    logger.warn(args.versionFallbackFailureMessage, {
      category: "error",
      service: "preview",
      failedStage: "database-read",
      safeErrorCategory: "database-read-failed",
      requestId: args.requestId,
      structureId: args.structureId,
      userId: args.userId,
      error: {
        name: args.versionFallbackFailureName,
        message: error instanceof Error ? error.message : String(error),
      },
    });
    return {
      candidate: null,
      inspectedCount: 0,
    } satisfies PreviewVersionSelection;
  });

  if (versionSelection.candidate) {
    if (!structureIsRenderable) {
      logger.warn("Preview recovered structure from website_versions snapshot", {
        category: "error",
        service: "preview",
        failedStage: "database-read",
        safeErrorCategory: "preview-version-fallback-recovered",
        requestId: args.requestId,
        structureId: args.structureId,
        userId: args.userId,
        versionId: versionSelection.candidate.versionId,
        versionNumber: versionSelection.candidate.versionNumber,
      });
    }

    return versionSelection.candidate.structure;
  }

  if (structure) {
    if (!structureIsRenderable || versionSelection.inspectedCount > 0) {
      logger.warn("Preview is using website_structures fallback after unusable or missing preferred website_versions data", {
        category: "error",
        service: "preview",
        failedStage: "preview-parse",
        safeErrorCategory: "preview-fallback-structure-used",
        requestId: args.requestId,
        structureId: args.structureId,
        userId: args.userId,
        inspectedVersionCount: versionSelection.inspectedCount,
      });
    }

    return structure;
  }

  return null;
}

export async function getOwnedPreviewStructure(
  structureId: string,
  userId: string,
  requestId?: string,
): Promise<WebsiteStructure | null> {
  return resolvePreviewStructureCandidate({
    structureId,
    userId,
    versionFallbackFailureMessage: "Preview failed to read website_versions fallback",
    versionFallbackFailureName: "PreviewVersionFallbackError",
    requestId,
  });
}

export interface SharedPreviewAccess {
  structure: WebsiteStructure;
  token: string;
  expiresAt: string;
}

export async function resolveSharedPreviewAccess(token: string, requestId?: string): Promise<SharedPreviewAccess | null> {
  const payload = verifyPreviewShareToken(token);
  if (!payload) {
    return null;
  }

  const previewStructure = await resolvePreviewStructureCandidate({
    structureId: payload.sid,
    userId: payload.uid,
    versionFallbackFailureMessage: "Shared preview failed to read website_versions fallback",
    versionFallbackFailureName: "SharedPreviewVersionFallbackError",
    requestId,
  });

  if (!previewStructure) {
    return null;
  }

  return {
    structure: previewStructure,
    token,
    expiresAt: new Date(payload.exp).toISOString(),
  };
}
