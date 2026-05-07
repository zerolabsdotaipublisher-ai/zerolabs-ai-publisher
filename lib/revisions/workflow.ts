import "server-only";

import { loadOwnedEditingDetail, saveOwnedEditableContent } from "@/lib/editing/storage";
import { listOwnedContentLibraryPage } from "@/lib/content/library";
import { getOwnedReviewDetail } from "@/lib/review";
import { logRevisionAuditEvent } from "./audit";
import { compareRevisions } from "./compare";
import {
  AUTOSAVE_REVISION_MIN_MS,
  buildRevisionSummary,
  clampRevisionPage,
  clampRevisionPerPage,
  createRevisionChangeSummary,
  createSnapshotFromReviewDetail,
  toRevisionWorkflowIdMap,
} from "./model";
import { canAccessOwnedRevisionContent } from "./permissions";
import { REVISION_MVP_BOUNDARIES, revisionScenarios } from "./scenarios";
import {
  createContentRevision,
  getContentRevision,
  getLatestContentRevision,
  listContentRevisions,
} from "./storage";
import type {
  ContentRevisionRecord,
  ListContentRevisionsResult,
  RevisionActionType,
  RevisionCompareResult,
} from "./types";

const MAX_STRUCTURE_SCAN = 5000;

function hasMeaningfulSnapshotChange(previous: ContentRevisionRecord, next: ContentRevisionRecord["snapshot"]): boolean {
  const left = previous.snapshot.draft;
  const right = next.draft;

  if (left.title !== right.title || left.summary !== right.summary || left.body !== right.body) {
    return true;
  }

  if (
    left.reviewState !== right.reviewState
    || previous.snapshot.approvalState !== next.approvalState
    || previous.snapshot.contentStatus !== next.contentStatus
  ) {
    return true;
  }

  if (left.sections.length !== right.sections.length) {
    return true;
  }

  return JSON.stringify(left.sections) !== JSON.stringify(right.sections)
    || JSON.stringify(left.metadataSeo) !== JSON.stringify(right.metadataSeo)
    || JSON.stringify(left.media.references) !== JSON.stringify(right.media.references);
}

function shouldCheckpointAutosave(previous: ContentRevisionRecord | null, capturedAt: string): boolean {
  if (!previous) {
    return true;
  }

  const delta = new Date(capturedAt).getTime() - new Date(previous.createdAt).getTime();
  return Number.isFinite(delta) && delta >= AUTOSAVE_REVISION_MIN_MS;
}

async function resolveRevisionDraftState(userId: string, contentId: string) {
  const [reviewDetail, editingDetail] = await Promise.all([
    getOwnedReviewDetail(userId, contentId),
    loadOwnedEditingDetail(userId, contentId),
  ]);

  if (!reviewDetail || !editingDetail) {
    return null;
  }

  return {
    reviewDetail,
    draft: editingDetail.draft,
  };
}

export async function recordContentRevisionAction(input: {
  userId: string;
  contentId: string;
  actionType: RevisionActionType;
  changeSummary?: string;
  metadata?: Record<string, unknown>;
  relatedWorkflowIds?: Record<string, string>;
  restoredFromRevisionId?: string;
  ensureCreationBaseline?: boolean;
}): Promise<ContentRevisionRecord | null> {
  const context = await resolveRevisionDraftState(input.userId, input.contentId);
  if (!context) {
    return null;
  }

  const snapshot = createSnapshotFromReviewDetail(context.reviewDetail, context.draft);
  const latest = await getLatestContentRevision(input.userId, input.contentId);

  if (input.actionType === "autosave_checkpoint") {
    if (!shouldCheckpointAutosave(latest, snapshot.capturedAt)) {
      return null;
    }
  }

  if (latest && !hasMeaningfulSnapshotChange(latest, snapshot) && input.actionType !== "restore") {
    return null;
  }

  if (!latest && input.ensureCreationBaseline !== false && input.actionType !== "content_created") {
    await createContentRevision({
      userId: input.userId,
      contentId: input.contentId,
      contentType: context.reviewDetail.item.type,
      sourceId: context.reviewDetail.item.sourceId,
      structureId: context.reviewDetail.linkedStructureId,
      actionType: "content_created",
      changeSummary: createRevisionChangeSummary("content_created", context.draft),
      snapshot,
      summary: buildRevisionSummary(snapshot),
      metadata: {
        seededByAction: input.actionType,
      },
      relatedWorkflowIds: input.relatedWorkflowIds,
      createdAt: snapshot.capturedAt,
    });
  }

  const created = await createContentRevision({
    userId: input.userId,
    contentId: input.contentId,
    contentType: context.reviewDetail.item.type,
    sourceId: context.reviewDetail.item.sourceId,
    structureId: context.reviewDetail.linkedStructureId,
    actionType: input.actionType,
    changeSummary: input.changeSummary ?? createRevisionChangeSummary(input.actionType, context.draft),
    snapshot,
    summary: buildRevisionSummary(snapshot),
    metadata: input.metadata,
    relatedWorkflowIds: input.relatedWorkflowIds,
    restoredFromRevisionId: input.restoredFromRevisionId,
    createdAt: snapshot.capturedAt,
  });

  await logRevisionAuditEvent({
    userId: input.userId,
    actorUserId: input.userId,
    contentId: input.contentId,
    revisionId: created.id,
    action: input.actionType === "restore" ? "restored" : "created",
    metadata: {
      actionType: input.actionType,
      versionNumber: created.versionNumber,
      ...input.metadata,
    },
  });

  return created;
}

export async function listOwnedRevisionHistory(
  userId: string,
  contentId: string,
  options?: { page?: number; perPage?: number },
): Promise<
  | {
      ok: false;
    }
  | {
      ok: true;
      revisions: ListContentRevisionsResult;
      scenarios: string[];
      mvpBoundaries: string[];
    }
> {
  const allowed = await canAccessOwnedRevisionContent(userId, contentId);
  if (!allowed) {
    return { ok: false };
  }

  await recordContentRevisionAction({
    userId,
    contentId,
    actionType: "content_created",
    ensureCreationBaseline: false,
    metadata: { lazyBootstrap: true },
  });

  const revisions = await listContentRevisions(userId, contentId, {
    page: clampRevisionPage(options?.page),
    perPage: clampRevisionPerPage(options?.perPage),
  });

  await logRevisionAuditEvent({
    userId,
    actorUserId: userId,
    contentId,
    action: "listed",
    metadata: {
      page: revisions.page,
      perPage: revisions.perPage,
    },
  });

  return {
    ok: true,
    revisions,
    scenarios: revisionScenarios.map((scenario) => scenario.id),
    mvpBoundaries: [...REVISION_MVP_BOUNDARIES],
  };
}

export async function getOwnedRevisionDetail(
  userId: string,
  contentId: string,
  revisionId: string,
): Promise<ContentRevisionRecord | null> {
  const allowed = await canAccessOwnedRevisionContent(userId, contentId);
  if (!allowed) {
    return null;
  }

  const revision = await getContentRevision(userId, contentId, revisionId);
  if (!revision) {
    return null;
  }

  await logRevisionAuditEvent({
    userId,
    actorUserId: userId,
    contentId,
    revisionId,
    action: "viewed",
    metadata: {
      versionNumber: revision.versionNumber,
    },
  });

  return revision;
}

export async function compareOwnedRevisions(input: {
  userId: string;
  contentId: string;
  leftRevisionId: string;
  rightRevisionId: string;
}): Promise<RevisionCompareResult | null> {
  const allowed = await canAccessOwnedRevisionContent(input.userId, input.contentId);
  if (!allowed) {
    return null;
  }

  const [left, right] = await Promise.all([
    getContentRevision(input.userId, input.contentId, input.leftRevisionId),
    getContentRevision(input.userId, input.contentId, input.rightRevisionId),
  ]);

  if (!left || !right) {
    return null;
  }

  const comparison = compareRevisions(left, right);

  await logRevisionAuditEvent({
    userId: input.userId,
    actorUserId: input.userId,
    contentId: input.contentId,
    action: "compared",
    metadata: {
      leftRevisionId: input.leftRevisionId,
      rightRevisionId: input.rightRevisionId,
      changedFields: comparison.changedFields,
      changedSections: comparison.changedSections,
    },
  });

  return comparison;
}

export async function restoreOwnedRevision(input: {
  userId: string;
  contentId: string;
  revisionId: string;
}): Promise<ContentRevisionRecord | null> {
  const allowed = await canAccessOwnedRevisionContent(input.userId, input.contentId);
  if (!allowed) {
    return null;
  }

  const revision = await getContentRevision(input.userId, input.contentId, input.revisionId);
  if (!revision) {
    return null;
  }

  const result = await saveOwnedEditableContent(input.userId, revision.snapshot.draft);
  if (!result.ok) {
    throw new Error(result.error || "Unable to restore revision");
  }

  return recordContentRevisionAction({
    userId: input.userId,
    contentId: input.contentId,
    actionType: "restore",
    restoredFromRevisionId: input.revisionId,
    relatedWorkflowIds: toRevisionWorkflowIdMap({
      restoreFromRevisionId: input.revisionId,
    }),
    metadata: {
      restoredFromVersionNumber: revision.versionNumber,
      approvalReentry: true,
    },
  });
}

export async function recordPublishRevisionsForStructure(input: {
  userId: string;
  structureId: string;
  action: "publish" | "update";
  requestId?: string;
}): Promise<void> {
  const page = await listOwnedContentLibraryPage(input.userId, {
    page: 1,
    perPage: MAX_STRUCTURE_SCAN,
    search: undefined,
    sort: "updated_desc",
    type: "all",
    status: "all",
    websiteId: input.structureId,
  });

  const linked = page.items.filter((item) => item.linkedWebsite?.structureId === input.structureId);
  await Promise.all(
    linked.map((item) =>
      recordContentRevisionAction({
        userId: input.userId,
        contentId: item.id,
        actionType: input.action === "publish" ? "publish" : "publish_update",
        relatedWorkflowIds: toRevisionWorkflowIdMap({ publishRequestId: input.requestId }),
        metadata: {
          structureId: input.structureId,
          publishAction: input.action,
        },
      }),
    ),
  );
}
