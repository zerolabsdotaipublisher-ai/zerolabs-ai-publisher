import type { WebsiteStructure } from "@/lib/ai/structure";
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
  if (value && structure.pages.some((page) => page.slug === value)) {
    return value;
  }

  return structure.pages[0]?.slug || "/";
}
