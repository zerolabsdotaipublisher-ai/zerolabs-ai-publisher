import { routes } from "@/config/routes";
import { config } from "@/config";

export function buildLivePath(structureId: string): string {
  return routes.liveSite(structureId);
}

export function buildLiveUrl(structureId: string): string {
  return new URL(buildLivePath(structureId), config.app.url).toString();
}
