import type { WebsiteSection, WebsiteStructure } from "@/lib/ai/structure";
import { getValueByPath } from "./mapping";
import type { EditableBoundaryDefinition, EditableTextField, WebsiteEditorDraft } from "./types";

const NON_EDITABLE_CONTENT_FIELD_NAMES = new Set([
  "id",
  "kind",
  "updatedat",
  "variant",
]);

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
    "publication",
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
    publication: base.publication,
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

function isEditableContentPath(path: string): boolean {
  const fieldName = path.split(".").at(-1)?.toLowerCase();
  return !fieldName || !NON_EDITABLE_CONTENT_FIELD_NAMES.has(fieldName);
}

function getRendererSupportedLinkFields(section: WebsiteSection): EditableTextField[] {
  const content = section.content;
  const hasStringValue = (key: string): boolean => typeof content[key] === "string";
  const optionalPaths: string[] = [];

  if (section.type === "hero" && hasStringValue("primaryCta")) {
    optionalPaths.push("content.ctaHref");
  }

  if (section.type === "cta") {
    if (hasStringValue("ctaText")) {
      optionalPaths.push("content.ctaHref");
    }
    if (hasStringValue("secondaryCtaText")) {
      optionalPaths.push("content.secondaryCtaHref");
    }
  }

  return optionalPaths.map((path) => ({
    path,
    label: toHumanLabel(path.replace(/^content\./, "")),
    value: typeof getValueByPath(section, path) === "string" ? (getValueByPath(section, path) as string) : "",
  }));
}

export function getEditableSectionTextFields(section: WebsiteSection): EditableTextField[] {
  const fields = collectStringLeafPaths(section.content, "content")
    .filter(isEditableContentPath)
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

  const knownPaths = new Set(fields.map((field) => field.path));
  return [...fields, ...getRendererSupportedLinkFields(section).filter((field) => !knownPaths.has(field.path))];
}
