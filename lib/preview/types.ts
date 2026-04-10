import type { WebsiteStructure } from "@/lib/ai/structure";

export type PreviewDeviceMode = "desktop" | "tablet" | "mobile";

export type PreviewAccessLevel = "owner" | "shared";

export interface PreviewPermissions {
  canRefresh: boolean;
  canShare: boolean;
  canRegenerate: boolean;
  canEditInputs: boolean;
}

export interface PreviewPageOption {
  id: string;
  slug: string;
  title: string;
  order: number;
}

export interface WebsitePreviewModel {
  id: string;
  structure: WebsiteStructure;
  currentPageSlug: string;
  currentDeviceMode: PreviewDeviceMode;
  accessLevel: PreviewAccessLevel;
  pages: PreviewPageOption[];
  permissions: PreviewPermissions;
  generatedSitePath: string;
  previewPath: string;
  sharedPreviewPath?: string;
  sharedPreviewExpiresAt?: string;
  refreshKey?: string;
}

export interface PreviewShareTokenPayload {
  sid: string;
  uid: string;
  exp: number;
}

export interface PreviewShareResult {
  structureId: string;
  shareToken: string;
  sharePath: string;
  expiresAt: string;
}
