import "server-only";

import { config } from "@/config";
import type { StorageAccessActorContext, StorageAccessResourceRecord } from "./types";

// Public/anonymous website asset access uses a shorter 5 minute max TTL to limit link reuse risk.
const PUBLIC_SIGNED_URL_MAX_SECONDS = 300;

export function resolveSignedUrlTtl(input: {
  actor: StorageAccessActorContext;
  resource: StorageAccessResourceRecord;
  requestedExpiresInSeconds?: number;
}): number {
  const configured = config.services.media.signedUrlTtlSeconds;
  const requested = input.requestedExpiresInSeconds ?? configured;
  const upperBound = input.actor.actorType === "anonymous" || input.resource.visibility === "public"
    ? Math.min(configured, PUBLIC_SIGNED_URL_MAX_SECONDS)
    : configured;
  return Math.max(30, Math.min(requested, upperBound));
}
