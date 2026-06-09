import "server-only";

import { config } from "@/config";

const DEFAULT_ADMIN_EMAILS = ["zerolabsdotaipublisher@gmail.com"];

function normalizeAdminEmail(email: string | null | undefined): string | null {
  if (typeof email !== "string") {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  return normalizedEmail.length > 0 ? normalizedEmail : null;
}

const configuredAdminEmails = new Set(
  [...DEFAULT_ADMIN_EMAILS, ...(config.services.auth.adminEmails ?? [])]
    .map((email) => normalizeAdminEmail(email))
    .filter((email): email is string => Boolean(email)),
);

export function isAdminEmail(email: string | null | undefined): boolean {
  const normalizedEmail = normalizeAdminEmail(email);
  return normalizedEmail ? configuredAdminEmails.has(normalizedEmail) : false;
}

export function resolveAdminRole(
  email: string | null | undefined,
  currentRole: "user" | "admin" = "user",
): "user" | "admin" {
  if (currentRole === "admin") {
    return "admin";
  }

  return isAdminEmail(email) ? "admin" : "user";
}
