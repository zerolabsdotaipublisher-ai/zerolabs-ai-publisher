import type { WebsiteStructure } from "@/lib/ai/structure";
import type { AiAsset } from "@/lib/ai-assets/types";
import type { MediaAsset } from "@/lib/media/types";
import type { WebsiteMediaLibraryItem } from "@/lib/website-media-library/types";

export type WebsiteAssetSurface = "live" | "preview" | "editor" | "library" | "social";
export type WebsiteAssetAccessLevel = "public" | "private" | "preview" | "draft" | "published";
export type WebsiteAssetStatus = "active" | "archived" | "deleted" | "missing";

export interface WebsiteAssetAssociation {
  websiteId?: string;
  contentId?: string;
  contentType?: string;
  pageId?: string;
  sectionId?: string;
}

export interface WebsiteAssetRecord {
  id: string;
  libraryItem: WebsiteMediaLibraryItem;
  media?: MediaAsset;
  aiAsset?: AiAsset;
  website?: WebsiteStructure | null;
  publicationState?: string;
  association: WebsiteAssetAssociation;
  status: WebsiteAssetStatus;
}

export interface WebsiteAssetDelivery {
  assetId: string;
  renderUrl: string;
  safeAccessUrl: string;
  directAccessUrl?: string;
  expiresAt?: string;
  cacheControl: string;
  accessLevel: WebsiteAssetAccessLevel;
  isFallback: boolean;
  fallbackUrl: string;
}

export interface WebsiteAssetApiRecord {
  assetId: string;
  libraryItemId: string;
  mediaId: string;
  aiAssetId?: string;
  websiteId?: string;
  contentId?: string;
  contentType?: string;
  pageId?: string;
  sectionId?: string;
  displayName: string;
  description?: string;
  altText?: string;
  mediaType: string;
  mimeType: string;
  fileSizeBytes: number;
  width?: number;
  height?: number;
  status: WebsiteAssetStatus;
  publicationState?: string;
  accessLevel: WebsiteAssetAccessLevel;
  renderUrl: string;
  safeAccessUrl: string;
  urlEndpoint: string;
  fallbackUrl: string;
  expiresAt?: string;
}

export interface WebsiteAssetResolveQuery {
  assetId?: string;
  libraryItemId?: string;
  mediaId?: string;
  aiAssetId?: string;
  websiteId?: string;
  contentId?: string;
  contentType?: string;
  pageId?: string;
  sectionId?: string;
  search?: string;
  userId?: string;
  tenantId?: string;
  surface: WebsiteAssetSurface;
  previewToken?: string;
  includeArchived?: boolean;
  includeDeleted?: boolean;
  page: number;
  perPage: number;
}

export interface WebsiteAssetListResult {
  items: WebsiteAssetRecord[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}
