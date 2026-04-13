import { routes } from "@/config/routes";
import { config } from "@/config";

export function buildLivePath(structureId: string): string {
  return `${routes.generatedSite(structureId)}?live=1`;
}

export function buildLiveUrl(structureId: string): string {
  return new URL(buildLivePath(structureId), config.app.url).toString();
}
