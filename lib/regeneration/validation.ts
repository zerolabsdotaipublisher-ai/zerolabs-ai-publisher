import { validateEditableDraft } from "@/lib/editing/validation";
import type { EditableContentDraft } from "@/lib/editing/types";
import type { RegenerationComparisonSummary } from "./types";

function stable(value: unknown): string {
  return JSON.stringify(value);
}

export function summarizeRegenerationDiff(
  before: EditableContentDraft,
  after: EditableContentDraft,
): RegenerationComparisonSummary {
  const changedFields: string[] = [];
  if (before.title !== after.title) changedFields.push("title");
  if (before.summary !== after.summary) changedFields.push("summary");
  if (before.body !== after.body) changedFields.push("body");
  if (stable(before.metadataSeo) !== stable(after.metadataSeo)) changedFields.push("metadataSeo");
  if (stable(before.media) !== stable(after.media)) changedFields.push("media");

  let changedSections = 0;
  const sectionMap = new Map(before.sections.map((section) => [section.id, section]));
  for (const section of after.sections) {
    const previous = sectionMap.get(section.id);
    if (!previous || stable(previous) !== stable(section)) {
      changedSections += 1;
    }
  }
  if (changedSections > 0) changedFields.push("sections");

  return {
    changedFields,
    changedSections,
    titleChanged: before.title !== after.title,
    summaryChanged: before.summary !== after.summary,
    bodyChanged: before.body !== after.body,
  };
}

export function validateRegeneratedDraft(before: EditableContentDraft, after: EditableContentDraft): string[] {
  const issues = validateEditableDraft(after).map((entry) => `${entry.field}: ${entry.message}`);
  const compare = summarizeRegenerationDiff(before, after);
  if (compare.changedFields.length === 0) {
    issues.push("Regeneration did not change any content fields");
  }
  return issues;
}
