import "server-only";

import { getWebsiteStructure, updateWebsiteStructure, type WebsiteStructure } from "@/lib/ai/structure";
import { logger } from "@/lib/observability";
import { detectPublicationState, markDraftUpdatedForPublication } from "@/lib/publish";
import { withRegeneratedWebsiteRouting } from "@/lib/routing";
import { persistWebsiteStructureArtifacts } from "@/lib/editor/storage";
import { validateEditorDraft } from "@/lib/editor/validation";
import { createVersionAuditEntry } from "./audit";
import { summarizeWebsiteVersionComparison } from "./compare";
import { createWebsiteVersionLabel } from "./model";
import { assertWebsiteVersionSnapshot } from "./snapshots";
import { getWebsiteVersion, createWebsiteVersion, listWebsiteVersions } from "./storage";
import type { WebsiteVersionRecord } from "./types";

export interface RestoreWebsiteVersionResult {
  structure: WebsiteStructure;
  restoredVersion?: WebsiteVersionRecord;
  versions: WebsiteVersionRecord[];
}

function buildRestoredStructure(current: WebsiteStructure, snapshotStructure: WebsiteStructure, restoredAt: string): WebsiteStructure {
  let nextStatus = snapshotStructure.status;

  if (current.status === "archived") {
    nextStatus = "archived";
  } else if (snapshotStructure.status === "archived") {
    nextStatus = "draft";
  }

  const restored: WebsiteStructure = {
    ...snapshotStructure,
    id: current.id,
    userId: current.userId,
    management: current.management,
    publication: current.publication,
    generatedAt: current.generatedAt,
    version: current.version + 1,
    updatedAt: restoredAt,
    status: nextStatus,
  };

  return markDraftUpdatedForPublication(restored, restoredAt);
}

export async function restoreWebsiteVersion(params: {
  structureId: string;
  versionId: string;
  userId: string;
}): Promise<RestoreWebsiteVersionResult | null> {
  const current = await getWebsiteStructure(params.structureId, params.userId);
  if (!current || current.management?.deletedAt) {
    return null;
  }

  if (detectPublicationState(current).isPublishing) {
    throw new Error("A publish operation is already in progress. Restore is unavailable right now.");
  }

  const version = await getWebsiteVersion(params.structureId, params.versionId, params.userId);
  if (!version) {
    return null;
  }

  const comparison = summarizeWebsiteVersionComparison(current, version);
  if (comparison.sameAsCurrent) {
    throw new Error("The selected version already matches the current working draft.");
  }

  const snapshotStructure = assertWebsiteVersionSnapshot(version.snapshot);
  const restoredAt = new Date().toISOString();
  const routed = withRegeneratedWebsiteRouting(buildRestoredStructure(current, snapshotStructure, restoredAt), restoredAt);
  const validationErrors = [
    ...validateEditorDraft(routed.structure),
    ...routed.validationErrors.map((message) => ({
      field: "routing",
      message,
    })),
  ];

  if (validationErrors.length > 0) {
    throw new Error(`Unable to restore the selected version: ${validationErrors.map((error) => error.message).join("; ")}`);
  }

  const updated = await updateWebsiteStructure(routed.structure);
  await persistWebsiteStructureArtifacts(updated, params.userId);

  let restoredVersion: WebsiteVersionRecord | undefined;
  try {
    restoredVersion = await createWebsiteVersion({
      structure: updated,
      userId: params.userId,
      source: "restore",
      status: "restored",
      label: createWebsiteVersionLabel("restore", updated),
      restoredFromVersionId: version.id,
      comparison: comparison.plan,
      createAuditEntry: createVersionAuditEntry({
        at: restoredAt,
        actorUserId: params.userId,
        source: "restore",
        action: "restored",
        message: `Working draft restored from version ${version.versionNumber}.`,
        details: {
          restoredFromVersionId: version.id,
          restoredFromVersionNumber: version.versionNumber,
          comparedChangeKinds: comparison.plan.scope.changeKinds,
        },
      }),
    });
  } catch (error) {
    logger.error("Website version restore succeeded without version snapshot", {
      category: "error",
      service: "versions",
      structureId: params.structureId,
      versionId: params.versionId,
      userId: params.userId,
      error: {
        name: "WebsiteVersionRestoreAuditError",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }

  return {
    structure: updated,
    restoredVersion,
    versions: await listWebsiteVersions(params.structureId, params.userId),
  };
}
