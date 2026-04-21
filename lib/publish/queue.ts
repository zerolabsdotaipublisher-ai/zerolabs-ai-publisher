const activePublicationLocks = new Set<string>();

function randomToken(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function createPublicationRequestId(structureId: string, action: "publish" | "update", now: string): string {
  return `${action}_${structureId}_${now.replace(/[^0-9]/g, "").slice(-14)}_${randomToken()}`;
}

export function acquirePublicationLock(structureId: string): boolean {
  if (activePublicationLocks.has(structureId)) {
    return false;
  }

  activePublicationLocks.add(structureId);
  return true;
}

export function releasePublicationLock(structureId: string): void {
  activePublicationLocks.delete(structureId);
}
