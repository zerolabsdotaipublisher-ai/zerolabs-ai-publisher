import type { LayoutVariantName } from "@/lib/ai/layout";
import type { StylePreset, TonePreset, WebsiteNavigation, WebsitePage, WebsiteSection, WebsiteStructure } from "@/lib/ai/structure";

export type EditorSaveStatus = "idle" | "saving" | "saved" | "error";

export interface EditorValidationError {
  field: string;
  message: string;
}

export interface EditableTextField {
  path: string;
  label: string;
  value: string;
}

export interface EditableBoundaryDefinition {
  editable: string[];
  systemManaged: string[];
}

export type WebsiteEditorDraft = WebsiteStructure;

export interface WebsiteEditorState {
  original: WebsiteStructure;
  draft: WebsiteEditorDraft;
  selectedPageId: string;
  selectedSectionId?: string;
  validationErrors: EditorValidationError[];
  saveStatus: EditorSaveStatus;
  saveMessage?: string;
  dirty: boolean;
  previewSyncKey: string;
}

export interface EditorSelection {
  page?: WebsitePage;
  section?: WebsiteSection;
}

export interface EditorThemeSelection {
  tone: TonePreset;
  style: StylePreset;
  layoutTemplate?: LayoutVariantName;
  themeMode?: "light" | "dark" | "auto";
}

export interface EditorNavigationItemUpdate {
  href: string;
  label?: string;
  visible?: boolean;
}

export interface EditorSaveResponse {
  ok: boolean;
  structure?: WebsiteStructure;
  error?: string;
  validationErrors?: EditorValidationError[];
}

export interface EditorRequirementsSummary {
  editableNavigation: boolean;
  editableSections: boolean;
  editablePageSettings: boolean;
  editableStyleEntryPoints: boolean;
  unsavedChangeProtection: boolean;
  livePreview: boolean;
}

export interface EditorNavigationUpdatePayload {
  structureId: string;
  location: "primary" | "footer";
  items: EditorNavigationItemUpdate[];
}

export interface EditorReorderSectionsPayload {
  structureId: string;
  pageId: string;
  sectionOrder: string[];
}

export interface EditorSavePayload {
  structureId: string;
  draft: WebsiteEditorDraft;
}

export type EditorMutationResult = {
  draft: WebsiteEditorDraft;
  validationErrors: EditorValidationError[];
};

export type WebsiteNavigationDraft = WebsiteNavigation;
