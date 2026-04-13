import type { WebsiteSection, WebsiteStructure } from "@/lib/ai/structure";
import { getValueByPath } from "./mapping";
import type { EditableBoundaryDefinition, EditableTextField, WebsiteEditorDraft } from "./types";

export const editorBoundaries: EditableBoundaryDefinition = {
  editable: [
    "siteTitle",
    "tagline",
    "pages.*.title",
    "pages.*.slug",
    "pages.*.visible",
    "pages.*.navigationLabel",
    "pages.*.sections.*.visible",
    "pages.*.sections.*.order",
    "pages.*.sections.*.content",
    "navigation.primary.*.label",
    "navigation.primary.*.href",
    "navigation.footer.*.label",
    "navigation.footer.*.href",
    "styleConfig.tone",
    "styleConfig.style",
    "layout.pages.*.templateName",
    "layout.pages.*.metadata.themeMode",
  ],
  systemManaged: [
    "id",
    "userId",
    "generatedAt",
    "updatedAt",
    "version",
    "status",
    "sourceInput",
    "contentVariations",
  ],
};

export function cloneEditorDraft(structure: WebsiteStructure): WebsiteEditorDraft {
  return structuredClone(structure);
}

export function applySystemManagedBoundaries(base: WebsiteStructure, draft: WebsiteEditorDraft): WebsiteStructure {
  return {
    ...draft,
    id: base.id,
    userId: base.userId,
    sourceInput: base.sourceInput,
    generatedAt: base.generatedAt,
    status: base.status,
  };
}

function toHumanLabel(path: string): string {
  return path
    .replace(/\./g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .trim();
}

function collectStringLeafPaths(value: unknown, prefix: string): string[] {
  if (typeof value === "string") {
    return [prefix];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectStringLeafPaths(item, `${prefix}.${index}`));
  }

  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, entry]) => collectStringLeafPaths(entry, `${prefix}.${key}`));
  }

  return [];
}

export function getEditableSectionTextFields(section: WebsiteSection): EditableTextField[] {
  const paths = collectStringLeafPaths(section.content, "content");
  return paths
    .map((path) => {
      const value = getValueByPath(section, path);
      if (typeof value !== "string") {
        return null;
      }
      return {
        path,
        label: toHumanLabel(path.replace(/^content\./, "")),
        value,
      } satisfies EditableTextField;
    })
    .filter((field): field is EditableTextField => Boolean(field));
}
