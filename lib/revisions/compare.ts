import type { ContentRevisionRecord, RevisionCompareResult } from "./types";

function normalizeMultiline(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function compareRevisions(left: ContentRevisionRecord, right: ContentRevisionRecord): RevisionCompareResult {
  const changedFields: string[] = [];

  if (normalizeMultiline(left.snapshot.draft.title) !== normalizeMultiline(right.snapshot.draft.title)) {
    changedFields.push("title");
  }

  if (normalizeMultiline(left.snapshot.draft.summary) !== normalizeMultiline(right.snapshot.draft.summary)) {
    changedFields.push("summary");
  }

  if (normalizeMultiline(left.snapshot.draft.body) !== normalizeMultiline(right.snapshot.draft.body)) {
    changedFields.push("body");
  }

  if (left.snapshot.reviewState !== right.snapshot.reviewState) {
    changedFields.push("reviewState");
  }

  if (left.snapshot.approvalState !== right.snapshot.approvalState) {
    changedFields.push("approvalState");
  }

  if (left.snapshot.contentStatus !== right.snapshot.contentStatus) {
    changedFields.push("contentStatus");
  }

  const leftSectionsById = new Map(left.snapshot.draft.sections.map((section) => [section.id, section]));
  let changedSections = 0;
  right.snapshot.draft.sections.forEach((section) => {
    const previous = leftSectionsById.get(section.id);
    if (!previous) {
      changedSections += 1;
      return;
    }

    if (
      normalizeMultiline(previous.heading) !== normalizeMultiline(section.heading)
      || normalizeMultiline(previous.body) !== normalizeMultiline(section.body)
      || previous.visible !== section.visible
    ) {
      changedSections += 1;
    }
  });

  const keywordDelta =
    right.snapshot.draft.metadataSeo.keywords.length - left.snapshot.draft.metadataSeo.keywords.length;

  const summary = changedFields.length === 0 && changedSections === 0
    ? "No material content changes were detected between selected revisions."
    : `Detected ${changedFields.length} field changes and ${changedSections} section changes between versions ${left.versionNumber} and ${right.versionNumber}.`;

  return {
    comparedAt: new Date().toISOString(),
    leftRevisionId: left.id,
    rightRevisionId: right.id,
    leftVersionNumber: left.versionNumber,
    rightVersionNumber: right.versionNumber,
    summary,
    changedFields,
    changedSections,
    keywordDelta,
  };
}
