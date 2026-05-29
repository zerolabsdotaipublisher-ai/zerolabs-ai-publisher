import { loadOwnedEditingDetail, saveOwnedEditableContent } from "./storage";
import type { EditableContentDraft, SaveEditableContentResult } from "./types";

export async function getOwnedEditingDetail(userId: string, contentId: string) {
  return loadOwnedEditingDetail(userId, contentId);
}

export async function saveOwnedEditingDraft(userId: string, draft: EditableContentDraft): Promise<SaveEditableContentResult> {
  return saveOwnedEditableContent(userId, draft);
}
