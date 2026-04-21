const activePublicationLocks = new Set<string>();

export function createPublicationRequestId(structureId: string, action: "publish" | "update", now: string): string {
  return `${action}_${structureId}_${now.replace(/[^0-9]/g, "").slice(-14)}_${crypto.randomUUID()}`;
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
