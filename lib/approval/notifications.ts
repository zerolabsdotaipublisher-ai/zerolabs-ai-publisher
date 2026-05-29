import "server-only";

import { logger } from "@/lib/observability";
import type { ApprovalState } from "./types";

export async function emitApprovalNotificationEvent(input: {
  event: "submitted" | "approved" | "rejected" | "changes_requested";
  userId: string;
  contentId: string;
  nextState: ApprovalState;
  note?: string;
}): Promise<void> {
  logger.info("approval workflow event", {
    category: "request",
    service: "approval",
    event: input.event,
    userId: input.userId,
    contentId: input.contentId,
    nextState: input.nextState,
    note: input.note,
  });
}
