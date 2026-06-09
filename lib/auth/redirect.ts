import { routes } from "@/config/routes";

const disallowedNextPaths = new Set([
  routes.login,
  routes.signup,
  routes.forgotPassword,
  routes.resetPassword,
  routes.authCallback,
]);

function getPathname(nextPath: string): string {
  return nextPath.split("?")[0] ?? nextPath;
}

function isDashboardRoute(nextPath: string): boolean {
  return getPathname(nextPath) === routes.dashboard;
}

function isAdminRoute(nextPath: string): boolean {
  const pathname = getPathname(nextPath);
  return pathname === routes.admin || pathname.startsWith(`${routes.admin}/`);
}

export function sanitizeNextPath(nextPath: string | null): string | null {
  if (!nextPath) return null;
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) return null;
  if (disallowedNextPaths.has(nextPath)) return null;
  return nextPath;
}

export function resolveSafeNextPath(nextPath: string | null): string {
  return sanitizeNextPath(nextPath) ?? routes.dashboard;
}

export function resolvePostLoginRedirectPath(nextPath: string | null, isAdmin: boolean): string {
  const requestedNextPath = sanitizeNextPath(nextPath);

  if (isAdmin) {
    if (!requestedNextPath || isDashboardRoute(requestedNextPath)) {
      return routes.adminDashboard;
    }

    return requestedNextPath;
  }

  if (!requestedNextPath || isAdminRoute(requestedNextPath)) {
    return routes.dashboard;
  }

  return requestedNextPath;
}
