import { routes } from "@/config/routes";
import type { WebsiteStructure } from "@/lib/ai/structure";
import { mapPreviewPages } from "./mapping";
import { sanitizePreviewDeviceMode, sanitizePreviewPageSlug } from "./validation";
import type { PreviewAccessLevel, WebsitePreviewModel } from "./types";

interface CreatePreviewModelArgs {
  structure: WebsiteStructure;
  pageSlug?: string;
  deviceMode?: string;
  refreshKey?: string;
  accessLevel: PreviewAccessLevel;
  sharedPreviewPath?: string;
  sharedPreviewExpiresAt?: string;
}

export function createPreviewModel({
  structure,
  pageSlug,
  deviceMode,
  refreshKey,
  accessLevel,
  sharedPreviewPath,
  sharedPreviewExpiresAt,
}: CreatePreviewModelArgs): WebsitePreviewModel {
  const currentPageSlug = sanitizePreviewPageSlug(structure, pageSlug);
  const currentDeviceMode = sanitizePreviewDeviceMode(deviceMode);

  return {
    id: structure.id,
    structure,
    currentPageSlug,
    currentDeviceMode,
    accessLevel,
    pages: mapPreviewPages(structure),
    permissions: {
      canRefresh: true,
      canShare: accessLevel === "owner",
      canRegenerate: accessLevel === "owner",
      canEditInputs: accessLevel === "owner",
    },
    generatedSitePath: routes.generatedSite(structure.id),
    previewPath: routes.previewSite(structure.id),
    sharedPreviewPath,
    sharedPreviewExpiresAt,
    refreshKey,
  };
}
