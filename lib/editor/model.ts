import type { WebsiteStructure } from "@/lib/ai/structure";
import { cloneEditorDraft } from "./boundaries";
import type { EditorSelection, WebsiteEditorState } from "./types";

function createPreviewSyncKey(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createInitialEditorState(structure: WebsiteStructure): WebsiteEditorState {
  const firstPage = structure.pages[0];
  const firstSection = firstPage?.sections.sort((left, right) => left.order - right.order)[0];

  return {
    original: structure,
    draft: cloneEditorDraft(structure),
    selectedPageId: firstPage?.id ?? "",
    selectedSectionId: firstSection?.id,
    validationErrors: [],
    saveStatus: "idle",
    dirty: false,
    previewSyncKey: createPreviewSyncKey(),
  };
}

export function getEditorSelection(state: WebsiteEditorState): EditorSelection {
  const page = state.draft.pages.find((candidate) => candidate.id === state.selectedPageId);
  const section = page?.sections.find((candidate) => candidate.id === state.selectedSectionId);

  return {
    page,
    section,
  };
}

export function createNextPreviewSyncKey(): string {
  return createPreviewSyncKey();
}
