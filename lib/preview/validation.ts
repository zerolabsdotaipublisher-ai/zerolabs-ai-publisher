import type { WebsiteStructure } from "@/lib/ai/structure";
import { getWebsiteRoutingConfig } from "@/lib/routing";
import type { PreviewDeviceMode } from "./types";

export const PREVIEW_DEVICE_MODES: PreviewDeviceMode[] = ["desktop", "tablet", "mobile"];

export function isPreviewDeviceMode(value: string | undefined): value is PreviewDeviceMode {
  return Boolean(value && PREVIEW_DEVICE_MODES.includes(value as PreviewDeviceMode));
}

export function sanitizePreviewDeviceMode(value: string | undefined): PreviewDeviceMode {
  return isPreviewDeviceMode(value) ? value : "desktop";
}

export function sanitizePreviewPageSlug(
  structure: WebsiteStructure,
  value: string | undefined,
): string {
  const routes = getWebsiteRoutingConfig(structure).routes;
  if (value && routes.some((route) => route.path === value && route.visible)) {
    return value;
  }

  return routes.find((route) => route.visible)?.path || structure.pages[0]?.slug || "";
}
