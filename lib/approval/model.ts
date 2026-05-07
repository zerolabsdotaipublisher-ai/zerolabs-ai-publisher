import "server-only";

import { routes } from "@/config/routes";
import type { ContentLibraryItem } from "@/lib/content/library";
import { listOwnedContentLibraryPage } from "@/lib/content/library";
import { canViewApproval } from "./permissions";
import { mapPersistedDecisionToApprovalState } from "./schema";
import { APPROVAL_MVP_BOUNDARIES, approvalScenarios } from "./scenarios";
import {
  getOwnedApprovalDecisionRecord,
  listOwnedApprovalAuditEntries,
  listOwnedApprovalComments,
  listOwnedApprovalDecisionRecords,
} from "./storage";
import type { ApprovalDetail, ApprovalListItem, ApprovalListPage, ApprovalQuery, ApprovalState } from "./types";

const MAX_SOURCE_SCAN = 5000;

function resolveApprovalState(item: ContentLibraryItem, decisionState?: "pending_review" | "approved" | "rejected" | "needs_changes"): ApprovalState {
  if (item.status === "published") {
    return "published";
  }

  if (!decisionState) {
    return "draft";
  }

  return mapPersistedDecisionToApprovalState(decisionState);
}

function toApprovalListItem(
  item: ContentLibraryItem,
  decisionState?: "pending_review" | "approved" | "rejected" | "needs_changes",
): ApprovalListItem {
  const approvalState = resolveApprovalState(item, decisionState);
  return {
    contentId: item.id,
    item,
    approvalState,
    publishReady: approvalState === "approved" || approvalState === "published",
    submitReady: approvalState === "draft" || approvalState === "rejected" || approvalState === "needs_changes",
  };
}

function paginate<T>(items: T[], page: number, perPage: number): { items: T[]; total: number; hasMore: boolean } {
  const total = items.length;
  const start = (page - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    total,
    hasMore: start + perPage < total,
  };
}

async function listAllLibraryItems(userId: string, query: Pick<ApprovalQuery, "search" | "sort" | "type">): Promise<ContentLibraryItem[]> {
  const page = await listOwnedContentLibraryPage(userId, {
    page: 1,
    perPage: MAX_SOURCE_SCAN,
    search: query.search,
    sort: query.sort,
    type: query.type,
    status: "all",
    websiteId: "all",
  });

  return page.items;
}

export async function listOwnedApprovalPage(userId: string, query: ApprovalQuery): Promise<ApprovalListPage> {
  const [items, records] = await Promise.all([
    listAllLibraryItems(userId, query),
    listOwnedApprovalDecisionRecords(userId),
  ]);

  const stateByContentId = new Map(records.map((record) => [record.contentId, record.state]));
  const withApproval = items
    .map((item) => toApprovalListItem(item, stateByContentId.get(item.id)))
    .filter((item) => query.approvalState === "all" || item.approvalState === query.approvalState);

  const paged = paginate(withApproval, query.page, query.perPage);

  return {
    items: paged.items,
    total: paged.total,
    page: query.page,
    perPage: query.perPage,
    hasMore: paged.hasMore,
    scenarios: approvalScenarios.map((scenario) => scenario.id),
    mvpBoundaries: [...APPROVAL_MVP_BOUNDARIES],
  };
}

export async function getOwnedApprovalDetail(userId: string, contentId: string): Promise<ApprovalDetail | null> {
  const [items, decision, comments, auditTrail] = await Promise.all([
    listAllLibraryItems(userId, { search: undefined, sort: "updated_desc", type: "all" }),
    getOwnedApprovalDecisionRecord(userId, contentId),
    listOwnedApprovalComments(userId, contentId),
    listOwnedApprovalAuditEntries(userId, contentId),
  ]);

  const item = items.find((candidate) => candidate.id === contentId);
  const permission = canViewApproval(item ?? null);
  if (!permission.allowed || !item) {
    return null;
  }

  const approvalState = resolveApprovalState(item, decision?.state);

  return {
    contentId,
    item,
    approvalState,
    publishReady: approvalState === "approved" || approvalState === "published",
    submitReady: approvalState === "draft" || approvalState === "rejected" || approvalState === "needs_changes",
    linkedStructureId: item.linkedWebsite?.structureId,
    reviewHref: routes.reviewItem(contentId),
    editHref: item.quickActions.editHref,
    previewHref: item.quickActions.viewHref,
    comments,
    auditTrail,
    notes: {
      workflow: "Approval workflow reuses review, editing, and publishing systems with owner-scoped enforcement.",
      multilevel: "Multi-step/multi-level approval is future-ready via role metadata and audit trail expansion.",
    },
  };
}
