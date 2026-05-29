import type { TonePreset } from "@/lib/ai/structure";
import type { ContentApprovalState, ContentLibraryType } from "@/lib/content/library/types";
import type { EditableContentDraft } from "@/lib/editing/types";
import type { ReviewState } from "@/lib/review/types";

export type RegenerationLevel = "full" | "section" | "field";
export type RegenerationMode = "rewrite" | "improve" | "expand" | "shorten" | "simplify" | "adjust_tone";
export type RegenerationFieldKey = "headline" | "title" | "summary" | "cta" | "caption";
export type RegenerationMetricsEvent = "regeneration_started" | "regeneration_succeeded" | "regeneration_failed" | "regeneration_applied";

export interface RegenerationTarget {
  sectionId?: string;
  fieldKey?: RegenerationFieldKey;
}

export interface RegenerationRequest {
  level: RegenerationLevel;
  mode: RegenerationMode;
  target: RegenerationTarget;
  tone?: TonePreset;
  instructions?: string;
}

export interface RegenerationPreviewPayload {
  request: RegenerationRequest;
}

export interface RegenerationApplyPayload {
  request: RegenerationRequest;
  regeneratedDraft: EditableContentDraft;
}

export interface RegenerationSectionOption {
  id: string;
  heading: string;
}

export interface RegenerationComparisonSummary {
  changedFields: string[];
  changedSections: number;
  titleChanged: boolean;
  summaryChanged: boolean;
  bodyChanged: boolean;
}

export interface RegenerationContextSummary {
  contentId: string;
  contentType: ContentLibraryType;
  reviewState: ReviewState;
  approvalState: ContentApprovalState;
  linkedStructureId?: string;
  linkedWebsite?: string;
  linkedCampaign?: string;
  tone?: TonePreset;
  audience?: string;
  keywords: string[];
  sectionOptions: RegenerationSectionOption[];
}

export interface RegenerationPreviewResult {
  ok: boolean;
  request: RegenerationRequest;
  summary?: RegenerationContextSummary;
  compare?: RegenerationComparisonSummary;
  validationErrors: string[];
  regeneratedDraft?: EditableContentDraft;
  usedFallback?: boolean;
  error?: string;
}

export interface RegenerationApplyResult {
  ok: boolean;
  request: RegenerationRequest;
  summary?: RegenerationContextSummary;
  compare?: RegenerationComparisonSummary;
  validationErrors: string[];
  regeneratedDraft?: EditableContentDraft;
  error?: string;
}
