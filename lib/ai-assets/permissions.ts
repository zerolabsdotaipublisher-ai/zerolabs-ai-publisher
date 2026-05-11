import type { User } from "@supabase/supabase-js";

export interface AiAssetPermissionResult {
  allowed: boolean;
  roles: string[];
  reason?: string;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string").map((entry) => entry.trim().toLowerCase());
}

function getRoles(user: User): string[] {
  const appMetadata = user.app_metadata ?? {};
  const userMetadata = user.user_metadata ?? {};

  return Array.from(new Set([
    ...toStringArray(appMetadata.roles),
    ...toStringArray(userMetadata.roles),
    ...toStringArray(appMetadata.permissions),
    ...toStringArray(userMetadata.permissions),
  ]));
}

export function canManageOwnedAiAssets(user: User): AiAssetPermissionResult {
  const roles = getRoles(user);
  if (roles.includes("suspended") || roles.includes("blocked")) {
    return {
      allowed: false,
      roles,
      reason: "Account does not have permission to manage AI assets.",
    };
  }

  return { allowed: true, roles };
}

export function canAccessAiAssetRecord(userId: string, recordOwnerId: string): AiAssetPermissionResult {
  if (userId !== recordOwnerId) {
    return {
      allowed: false,
      roles: [],
      reason: "AI asset record is not owned by the authenticated user.",
    };
  }

  return {
    allowed: true,
    roles: ["owner"],
  };
}
