import type { ReviewState } from "@/lib/review/types";

export type EditingContentType = "website_page" | "blog_post" | "article" | "social_post";

export interface EditingSectionBlock {
  id: string;
  heading: string;
  body: string;
  mediaUrl?: string;
  order: number;
  visible: boolean;
  rawJson?: string;
}

export interface EditingMetadataSeo {
  slug?: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  canonicalUrl?: string;
}

export interface EditingMediaState {
  references: string[];
}

export interface EditingVersionState {
  version: number;
  updatedAt: string;
  lastVersionId?: string;
  snapshotSupport: "full" | "hook";
}

export interface EditingCapabilities {
  inlineText: boolean;
  richText: boolean;
  sectionBlocks: boolean;
  media: boolean;
  metadataSeo: boolean;
  autosave: boolean;
  undoRedoFutureReady: boolean;
}

export interface EditableContentDraft {
  contentId: string;
  type: EditingContentType;
  sourceId: string;
  linkedStructureId?: string;
  title: string;
  summary: string;
  body: string;
  sections: EditingSectionBlock[];
  media: EditingMediaState;
  metadataSeo: EditingMetadataSeo;
  reviewState: ReviewState;
  previewHref?: string;
  version: EditingVersionState;
  capabilities: EditingCapabilities;
  updatedAt: string;
}

export interface EditingDetail {
  draft: EditableContentDraft;
  scenarios: string[];
  mvpBoundaries: string[];
}

export interface SaveEditableContentPayload {
  draft: EditableContentDraft;
}

export interface EditingValidationIssue {
  field: string;
  message: string;
}

export interface SaveEditableContentResult {
  ok: boolean;
  detail?: EditingDetail;
  validationIssues?: EditingValidationIssue[];
  error?: string;
  autoSaved?: boolean;
}
