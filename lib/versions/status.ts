import type { WebsiteVersionRecord, WebsiteVersionStatus } from "./types";

export const RESTORABLE_VERSION_STATUSES: WebsiteVersionStatus[] = ["draft", "published", "archived", "restored"];

export function isRestorableWebsiteVersion(version: WebsiteVersionRecord): boolean {
  return RESTORABLE_VERSION_STATUSES.includes(version.status);
}

export function getWebsiteVersionStatusLabel(status: WebsiteVersionStatus, isLive: boolean): string {
  if (isLive && status === "published") {
    return "live";
  }

  return status.replace(/_/g, " ");
}
