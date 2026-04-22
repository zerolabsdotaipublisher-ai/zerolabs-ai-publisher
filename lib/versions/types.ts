import type { WebsiteStructure } from "@/lib/ai/structure";
import type {
  PublicationDeploymentMetadata,
  PublicationStructureFingerprint,
  PublicationUpdatePlan,
} from "@/lib/publish";

export type WebsiteVersionStatus = "draft" | "published" | "archived" | "restored";

export type WebsiteVersionSource = "generate" | "draft_save" | "publish" | "update" | "restore";

export interface WebsiteVersionBlogSummary {
  postSlug: string;
  sectionCount: number;
  wordCount: number;
  qualityStatus?: string;
}

export interface WebsiteVersionArticleSummary {
  articleSlug: string;
  articleType?: string;
  sectionCount: number;
  wordCount: number;
  referenceCount: number;
  qualityStatus?: string;
}

export interface WebsiteVersionSnapshot {
  schemaVersion: 1;
  capturedAt: string;
  structure: WebsiteStructure;
  blog?: WebsiteVersionBlogSummary;
  article?: WebsiteVersionArticleSummary;
}

export interface WebsiteVersionSummary {
  pageCount: number;
  routeCount: number;
  assetCount: number;
  pageIds: string[];
  routePaths: string[];
  assetPaths: string[];
  blog?: WebsiteVersionBlogSummary;
  article?: WebsiteVersionArticleSummary;
}

export interface WebsiteVersionDeploymentLink {
  deploymentId?: string;
  providerDeploymentId?: string;
  environment?: PublicationDeploymentMetadata["environment"];
  status?: PublicationDeploymentMetadata["status"];
  target?: string;
  url?: string;
  path?: string;
  domains?: string[];
  publishedAt?: string;
  liveUrl?: string;
  livePath?: string;
  publicationVersionId?: string;
}

export interface WebsiteVersionAuditEntry {
  at: string;
  action: "created" | "restored" | "status_changed";
  actorUserId: string;
  source: WebsiteVersionSource;
  message: string;
  requestId?: string;
  details?: Record<string, unknown>;
}

export interface WebsiteVersionRecord {
  id: string;
  structureId: string;
  userId: string;
  versionNumber: number;
  label: string;
  status: WebsiteVersionStatus;
  source: WebsiteVersionSource;
  structureVersion: number;
  snapshot: WebsiteVersionSnapshot;
  fingerprint: PublicationStructureFingerprint;
  summary: WebsiteVersionSummary;
  deployment?: WebsiteVersionDeploymentLink;
  comparison?: PublicationUpdatePlan;
  isLive: boolean;
  isCurrentDraft: boolean;
  restoredFromVersionId?: string;
  createdAt: string;
  updatedAt: string;
  audit: WebsiteVersionAuditEntry[];
}

export interface WebsiteVersionComparisonSummary {
  comparedAt: string;
  againstVersionId: string;
  againstVersionNumber: number;
  currentStructureVersion: number;
  sameAsCurrent: boolean;
  plan: PublicationUpdatePlan;
}

export interface CreateWebsiteVersionParams {
  structure: WebsiteStructure;
  userId: string;
  source: WebsiteVersionSource;
  status: WebsiteVersionStatus;
  label: string;
  requestId?: string;
  restoredFromVersionId?: string;
  deployment?: WebsiteVersionDeploymentLink;
  comparison?: PublicationUpdatePlan;
  createAuditEntry?: WebsiteVersionAuditEntry;
}

export interface WebsiteVersionRow {
  id: string;
  structure_id: string;
  user_id: string;
  version_number: number;
  label: string;
  status: WebsiteVersionStatus;
  source: WebsiteVersionSource;
  structure_version: number;
  snapshot: WebsiteVersionSnapshot;
  fingerprint: PublicationStructureFingerprint;
  summary: WebsiteVersionSummary;
  deployment?: WebsiteVersionDeploymentLink | null;
  comparison?: PublicationUpdatePlan | null;
  is_live: boolean;
  is_current_draft: boolean;
  restored_from_version_id?: string | null;
  audit: WebsiteVersionAuditEntry[];
  created_at: string;
  updated_at: string;
}
