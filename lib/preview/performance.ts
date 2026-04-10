import type { PreviewDeviceMode } from "./types";

export function getPreviewDeviceClass(deviceMode: PreviewDeviceMode): string {
  if (deviceMode === "mobile") return "preview-device-mobile";
  if (deviceMode === "tablet") return "preview-device-tablet";
  return "preview-device-desktop";
}

export function getPreviewRendererKey(pageSlug: string, deviceMode: PreviewDeviceMode, refreshKey?: string): string {
  return `${pageSlug}:${deviceMode}:${refreshKey ?? "base"}`;
}
