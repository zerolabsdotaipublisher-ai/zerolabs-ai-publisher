import { getOwnedEditingDetail, saveOwnedEditingDraft } from "./model";
import type { EditableContentDraft, SaveEditableContentResult } from "./types";

export async function getOwnedEditingWorkflowState(userId: string, contentId: string) {
  return getOwnedEditingDetail(userId, contentId);
}

export async function runOwnedEditingSaveWorkflow(
  userId: string,
  draft: EditableContentDraft,
): Promise<SaveEditableContentResult> {
  return saveOwnedEditingDraft(userId, draft);
}

export async function runOwnedEditingAutosaveWorkflow(
  userId: string,
  draft: EditableContentDraft,
): Promise<SaveEditableContentResult> {
  const result = await saveOwnedEditingDraft(userId, draft);
  return {
    ...result,
    autoSaved: result.ok,
  };
}
