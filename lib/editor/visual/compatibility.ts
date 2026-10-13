import type { EditorDocument, EditorProjectionIssue } from "@/lib/editor/document";

export interface VisualEditorCompatibilityNotice {
  unsupportedNodeCount: number;
  projectabilityIssueCount: number;
  message?: string;
}

/**
 * Legacy adapter markers are surfaced even before atomic projection is enabled.
 * This avoids implying that unsupported source content is safe to save later.
 */
export function getVisualEditorCompatibilityNotice(
  document: EditorDocument,
  projectabilityIssues: readonly EditorProjectionIssue[],
): VisualEditorCompatibilityNotice {
  const unsupportedNodeCount = Object.values(document.nodes).filter((node) => node.legacy?.unsupported).length;
  const projectabilityIssueCount = projectabilityIssues.length;
  if (!unsupportedNodeCount && !projectabilityIssueCount) return { unsupportedNodeCount, projectabilityIssueCount };

  const parts: string[] = [];
  if (unsupportedNodeCount) {
    parts.push(`${unsupportedNodeCount} unsupported legacy node${unsupportedNodeCount === 1 ? "" : "s"} cannot be losslessly projected`);
  }
  if (projectabilityIssueCount) {
    parts.push(`${projectabilityIssueCount} compatibility issue${projectabilityIssueCount === 1 ? "" : "s"} would block a future legacy projection`);
  }
  return { unsupportedNodeCount, projectabilityIssueCount, message: `${parts.join("; ")}. No content has been dropped.` };
}
