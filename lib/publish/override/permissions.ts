import type { User } from "@supabase/supabase-js";
import type { ManualOverridePermission, ManualOverridePrincipalRole } from "./types";

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string").map((entry) => entry.trim().toLowerCase());
}

function readMetadataRole(metadata: Record<string, unknown>, field: "role" | "approvalRole"): string | undefined {
  const raw = metadata[field];
  return typeof raw === "string" ? raw.toLowerCase() : undefined;
}

function hasRole(user: User, candidates: string[]): boolean {
  const appMetadata = user.app_metadata ?? {};
  const userMetadata = user.user_metadata ?? {};

  const directRoles = [
    readMetadataRole(appMetadata, "role"),
    readMetadataRole(userMetadata, "role"),
    readMetadataRole(appMetadata, "approvalRole"),
    readMetadataRole(userMetadata, "approvalRole"),
  ].filter((value): value is string => Boolean(value));

  const roleArrays = [
    ...toStringArray(appMetadata.roles),
    ...toStringArray(userMetadata.roles),
    ...toStringArray(appMetadata.permissions),
    ...toStringArray(userMetadata.permissions),
  ];

  return [...directRoles, ...roleArrays].some((role) => candidates.includes(role));
}

export function resolveManualOverridePermission(user: User, structureOwnerId?: string): ManualOverridePermission {
  const roles = new Set<ManualOverridePrincipalRole>();

  if (structureOwnerId && user.id === structureOwnerId) {
    roles.add("owner");
  }

  if (hasRole(user, ["admin", "owner", "super_admin"])) {
    roles.add("admin");
  }

  if (hasRole(user, ["approver", "reviewer", "authorized_approver", "manual_override_approver", "publish_approver"])) {
    roles.add("authorized_approver");
  }

  const resolvedRoles = Array.from(roles);
  if (resolvedRoles.length === 0) {
    return {
      allowed: false,
      canBypassApproval: false,
      roles: [],
      reason: "Manual override requires owner/admin/authorized approver role.",
    };
  }

  const canBypassApproval = resolvedRoles.includes("admin") || resolvedRoles.includes("authorized_approver");

  return {
    allowed: true,
    canBypassApproval,
    roles: resolvedRoles,
  };
}
