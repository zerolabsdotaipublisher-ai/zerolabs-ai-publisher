import "server-only";

import type { ApprovalRole } from "./types";
import { appendOwnedApprovalAuditEntry } from "./storage";

export async function logOwnedApprovalAction(input: {
  userId: string;
  contentId: string;
  action: string;
  actorRole: ApprovalRole;
  note?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await appendOwnedApprovalAuditEntry({
    userId: input.userId,
    contentId: input.contentId,
    action: input.action,
    actorRole: input.actorRole,
    note: input.note,
    metadata: input.metadata,
  });
}
