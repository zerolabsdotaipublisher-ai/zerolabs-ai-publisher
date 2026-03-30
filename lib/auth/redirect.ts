import { routes } from "@/config/routes";

export function resolveSafeNextPath(nextPath: string | null): string {
  if (!nextPath) return routes.dashboard;
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) return routes.dashboard;
  return nextPath;
}
