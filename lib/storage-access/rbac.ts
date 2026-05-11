import "server-only";

import type { User } from "@supabase/supabase-js";
import { env } from "@/config";
import type { StorageAccessActorContext, StorageServiceRole } from "./types";

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function getStorageRoles(user: User): string[] {
  const appMetadata = user.app_metadata ?? {};
  const userMetadata = user.user_metadata ?? {};

  const roleLike = [
    typeof appMetadata.role === "string" ? appMetadata.role : undefined,
    typeof userMetadata.role === "string" ? userMetadata.role : undefined,
  ].filter((entry): entry is string => Boolean(entry));

  return Array.from(
    new Set([
      ...roleLike.map((entry) => entry.toLowerCase()),
      ...toStringArray(appMetadata.roles),
      ...toStringArray(userMetadata.roles),
      ...toStringArray(appMetadata.permissions),
      ...toStringArray(userMetadata.permissions),
    ]),
  );
}

export function createUserStorageActor(user: User, tenantId?: string): StorageAccessActorContext {
  return {
    actorType: "user",
    userId: user.id,
    tenantId: tenantId?.trim() || user.id,
    roles: getStorageRoles(user),
    environmentStage: env.runtime.stage,
  };
}


export function createScopedUserStorageActor(userId: string, tenantId?: string, roles: string[] = []): StorageAccessActorContext {
  return {
    actorType: "user",
    userId,
    tenantId: tenantId?.trim() || userId,
    roles,
    environmentStage: env.runtime.stage,
  };
}

export function createAnonymousStorageActor(): StorageAccessActorContext {
  return {
    actorType: "anonymous",
    roles: [],
    environmentStage: env.runtime.stage,
  };
}

export function createServiceStorageActor(serviceRole: StorageServiceRole, tenantId?: string): StorageAccessActorContext {
  return {
    actorType: "service",
    tenantId: tenantId?.trim() || undefined,
    roles: [serviceRole],
    serviceRole,
    environmentStage: env.runtime.stage,
  };
}
