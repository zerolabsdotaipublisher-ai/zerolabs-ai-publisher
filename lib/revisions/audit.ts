import "server-only";

import { appendRevisionAuditEntry } from "./storage";
import type { RevisionAuditAction } from "./types";

export async function logRevisionAuditEvent(input: {
  userId: string;
  contentId: string;
  actorUserId: string;
  action: RevisionAuditAction;
  revisionId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await appendRevisionAuditEntry(input);
}
