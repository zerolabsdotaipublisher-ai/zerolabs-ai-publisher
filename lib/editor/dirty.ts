import type { WebsiteStructure } from "@/lib/ai/structure";
import { stableStringify } from "./mapping";

function normalizeForDirtyCheck(structure: WebsiteStructure): unknown {
  return {
    siteTitle: structure.siteTitle,
    tagline: structure.tagline,
    pages: structure.pages.map((page) => ({
      id: page.id,
      title: page.title,
      slug: page.slug,
      visible: page.visible,
      navigationLabel: page.navigationLabel,
      order: page.order,
      sections: page.sections.map((section) => ({
        id: section.id,
        type: section.type,
        order: section.order,
        visible: section.visible,
        content: section.content,
      })),
    })),
    navigation: structure.navigation,
    styleConfig: structure.styleConfig,
    layout: structure.layout
      ? {
          pages: structure.layout.pages.map((page) => ({
            pageId: page.pageId,
            templateName: page.templateName,
            themeMode: page.metadata.themeMode,
          })),
        }
      : undefined,
  };
}

export function isEditorDirty(original: WebsiteStructure, draft: WebsiteStructure): boolean {
  return stableStringify(normalizeForDirtyCheck(original)) !== stableStringify(normalizeForDirtyCheck(draft));
}
