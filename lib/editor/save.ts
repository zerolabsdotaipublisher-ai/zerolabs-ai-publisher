import type { EditorNavigationUpdatePayload, EditorReorderSectionsPayload, EditorSavePayload, EditorSaveResponse } from "./types";

async function postEditorAction<T>(url: string, payload: T): Promise<EditorSaveResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as EditorSaveResponse;

  if (!response.ok) {
    return {
      ok: false,
      error: body.error || "Request failed",
      validationErrors: body.validationErrors,
    };
  }

  return {
    ok: true,
    structure: body.structure,
    validationErrors: body.validationErrors,
  };
}

export function saveEditorDraft(payload: EditorSavePayload): Promise<EditorSaveResponse> {
  return postEditorAction("/api/editor/save", payload);
}

export function reorderEditorSections(payload: EditorReorderSectionsPayload): Promise<EditorSaveResponse> {
  return postEditorAction("/api/editor/reorder-sections", payload);
}

export function updateEditorNavigation(payload: EditorNavigationUpdatePayload): Promise<EditorSaveResponse> {
  return postEditorAction("/api/editor/update-navigation", payload);
}
