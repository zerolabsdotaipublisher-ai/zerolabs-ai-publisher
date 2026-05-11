import type { User } from "@supabase/supabase-js";

export interface MediaPermissionResult {
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

export function canManageOwnedMedia(user: User): MediaPermissionResult {
  const roles = getRoles(user);
  if (roles.includes("suspended") || roles.includes("blocked")) {
    return {
      allowed: false,
      roles,
      reason: "Account does not have permission to manage media.",
    };
  }

  return {
    allowed: true,
    roles,
  };
}

export function canAccessMediaRecord(userId: string, recordOwnerId: string): MediaPermissionResult {
  if (userId !== recordOwnerId) {
    return {
      allowed: false,
      roles: [],
      reason: "Media record is not owned by the authenticated user.",
    };
  }

  return {
    allowed: true,
    roles: ["owner"],
  };
}
