import type { WebsiteStructure } from "@/lib/ai/structure";
import { isEditorDirty } from "./dirty";
import { createNextPreviewSyncKey } from "./model";
import type { EditorSaveStatus, EditorValidationError, WebsiteEditorState } from "./types";

export type WebsiteEditorAction =
  | { type: "select-page"; pageId: string }
  | { type: "select-section"; sectionId?: string }
  | { type: "set-draft"; draft: WebsiteStructure }
  | { type: "set-validation-errors"; errors: EditorValidationError[] }
  | { type: "set-save-status"; status: EditorSaveStatus; message?: string }
  | { type: "mark-saved"; structure: WebsiteStructure; message?: string }
  | { type: "set-error"; message: string };

function getSelectedSectionIdForPage(state: WebsiteEditorState, pageId: string): string | undefined {
  const page = state.draft.pages.find((candidate) => candidate.id === pageId);
  return page?.sections.sort((left, right) => left.order - right.order)[0]?.id;
}

export function reduceWebsiteEditorState(state: WebsiteEditorState, action: WebsiteEditorAction): WebsiteEditorState {
  switch (action.type) {
    case "select-page":
      return {
        ...state,
        selectedPageId: action.pageId,
        selectedSectionId: getSelectedSectionIdForPage(state, action.pageId),
      };
    case "select-section":
      return {
        ...state,
        selectedSectionId: action.sectionId,
      };
    case "set-draft":
      return {
        ...state,
        draft: action.draft,
        dirty: isEditorDirty(state.original, action.draft),
        saveStatus: state.saveStatus === "saved" ? "idle" : state.saveStatus,
        previewSyncKey: createNextPreviewSyncKey(),
      };
    case "set-validation-errors":
      return {
        ...state,
        validationErrors: action.errors,
      };
    case "set-save-status":
      return {
        ...state,
        saveStatus: action.status,
        saveMessage: action.message,
      };
    case "mark-saved":
      return {
        ...state,
        original: action.structure,
        draft: action.structure,
        dirty: false,
        saveStatus: "saved",
        saveMessage: action.message,
        validationErrors: [],
        previewSyncKey: createNextPreviewSyncKey(),
      };
    case "set-error":
      return {
        ...state,
        saveStatus: "error",
        saveMessage: action.message,
      };
    default:
      return state;
  }
}
