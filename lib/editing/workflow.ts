import { getOwnedEditingDetail, saveOwnedEditingDraft } from "./model";
import { toRevisionWorkflowIdMap } from "@/lib/revisions/model";
import { recordContentRevisionAction } from "@/lib/revisions/workflow";
import type { EditableContentDraft, SaveEditableContentResult } from "./types";

export async function getOwnedEditingWorkflowState(userId: string, contentId: string) {
  return getOwnedEditingDetail(userId, contentId);
}

export async function runOwnedEditingSaveWorkflow(
  userId: string,
  draft: EditableContentDraft,
): Promise<SaveEditableContentResult> {
  const result = await saveOwnedEditingDraft(userId, draft);
  if (result.ok) {
    await recordContentRevisionAction({
      userId,
      contentId: draft.contentId,
      actionType: "manual_save",
      relatedWorkflowIds: toRevisionWorkflowIdMap(),
      metadata: {
        source: "editing.save",
      },
    });
  }
  return result;
}

export async function runOwnedEditingAutosaveWorkflow(
  userId: string,
  draft: EditableContentDraft,
): Promise<SaveEditableContentResult> {
  const result = await saveOwnedEditingDraft(userId, draft);
  if (result.ok) {
    await recordContentRevisionAction({
      userId,
      contentId: draft.contentId,
      actionType: "autosave_checkpoint",
      relatedWorkflowIds: toRevisionWorkflowIdMap(),
      metadata: {
        source: "editing.autosave",
      },
    });
  }
  return {
    ...result,
    autoSaved: result.ok,
  };
}
