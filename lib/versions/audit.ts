import type { WebsiteVersionAuditEntry, WebsiteVersionSource, WebsiteVersionStatus } from "./types";

export function createVersionAuditEntry(params: {
  at: string;
  actorUserId: string;
  source: WebsiteVersionSource;
  action: WebsiteVersionAuditEntry["action"];
  message: string;
  requestId?: string;
  details?: Record<string, unknown>;
}): WebsiteVersionAuditEntry {
  return {
    at: params.at,
    actorUserId: params.actorUserId,
    source: params.source,
    action: params.action,
    message: params.message,
    requestId: params.requestId,
    details: params.details,
  };
}

export function createVersionStatusAuditEntry(params: {
  at: string;
  actorUserId: string;
  source: WebsiteVersionSource;
  previousStatus?: WebsiteVersionStatus;
  nextStatus: WebsiteVersionStatus;
  requestId?: string;
}): WebsiteVersionAuditEntry {
  return createVersionAuditEntry({
    at: params.at,
    actorUserId: params.actorUserId,
    source: params.source,
    action: "status_changed",
    requestId: params.requestId,
    message: params.previousStatus
      ? `Version status changed from ${params.previousStatus} to ${params.nextStatus}.`
      : `Version status set to ${params.nextStatus}.`,
    details: {
      previousStatus: params.previousStatus,
      nextStatus: params.nextStatus,
    },
  });
}
