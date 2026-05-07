import type { EditableContentDraft, EditingValidationIssue } from "./types";

export function validateEditableDraft(draft: EditableContentDraft): EditingValidationIssue[] {
  const issues: EditingValidationIssue[] = [];

  if (!draft.title.trim()) {
    issues.push({ field: "title", message: "Title is required." });
  }

  if (!draft.summary.trim() && !draft.body.trim() && draft.sections.length === 0) {
    issues.push({
      field: "content",
      message: "At least one of summary, body, or sections is required.",
    });
  }

  if (["website_page", "blog_post", "article"].includes(draft.type) && draft.sections.length === 0) {
    issues.push({ field: "sections", message: "At least one section is required." });
  }

  draft.sections.forEach((section, index) => {
    if (!section.heading.trim()) {
      issues.push({ field: `sections.${index}.heading`, message: "Section heading is required." });
    }

    if (!section.body.trim() && !section.rawJson?.trim()) {
      issues.push({ field: `sections.${index}.body`, message: "Section body is required." });
    }
  });

  if (!draft.metadataSeo.metaTitle.trim()) {
    issues.push({ field: "metadataSeo.metaTitle", message: "Meta title is required." });
  }

  if (!draft.metadataSeo.metaDescription.trim()) {
    issues.push({ field: "metadataSeo.metaDescription", message: "Meta description is required." });
  }

  return issues;
}
