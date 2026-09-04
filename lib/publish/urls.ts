import { publicAppConfig } from "@/config/public";
import { routes } from "@/config/routes";

export function buildLivePath(structureId: string): string {
  return routes.liveSite(structureId);
}

export function buildLiveUrl(structureId: string): string {
  return new URL(buildLivePath(structureId), publicAppConfig.url).toString();
}
