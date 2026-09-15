import type { PageLayoutModel } from "@/lib/ai/layout";
import type { WebsitePage, WebsiteSection } from "@/lib/ai/structure/types";
import type { WebsiteInlineEditing } from "./inline-editing";
import { SectionRenderer } from "./section-renderer";
import { SectionLayoutShell } from "./section-layout-shell";

interface PageLayoutRendererProps {
  page: WebsitePage;
  layoutPage?: PageLayoutModel;
  inlineEditing?: WebsiteInlineEditing;
}

function getRenderableSections(
  page: WebsitePage,
  layoutPage?: PageLayoutModel,
): WebsiteSection[] {
  const pageSections = Array.isArray(page.sections) ? page.sections : [];
  const sectionLayouts = layoutPage?.sectionLayouts ?? [];

  if (!layoutPage || sectionLayouts.length === 0) {
    return pageSections
      .filter((section) => section.visible)
      .sort((a, b) => a.order - b.order);
  }

  const byId = new Map(pageSections.map((section) => [section.id, section]));
  const layoutSections = sectionLayouts
    .filter((node) => node.visible)
    .map((node) => byId.get(node.sectionId))
    .filter((section): section is WebsiteSection => Boolean(section));
  const layoutSectionIds = new Set(layoutSections.map((section) => section.id));
  const orphanedSections = pageSections
    .filter((section) => section.visible && !layoutSectionIds.has(section.id))
    .sort((a, b) => a.order - b.order);

  return [...layoutSections, ...orphanedSections];
}

export function PageLayoutRenderer({ page, layoutPage, inlineEditing }: PageLayoutRendererProps) {
  const visibleSections = getRenderableSections(page, layoutPage);
  const layoutBySectionId = new Map(
    (layoutPage?.sectionLayouts ?? []).map((node) => [node.sectionId, node]),
  );

  return (
    <div
      className="gs-page"
      data-page-type={page.type}
      data-slug={page.slug}
      data-layout-template={layoutPage?.templateName}
      data-layout-style={layoutPage?.metadata?.layoutStyleTag}
      data-layout-spacing-scale={layoutPage?.metadata?.spacingScale}
      data-layout-emphasis={layoutPage?.metadata?.emphasisPattern}
    >
      {visibleSections.map((section) => (
        <SectionLayoutShell
          key={section.id}
          node={layoutBySectionId.get(section.id)}
          editorSection={
            inlineEditing
              ? {
                  id: section.id,
                  selected: inlineEditing.selectedSectionId === section.id,
                  onSelect: inlineEditing.onSectionSelect,
                }
              : undefined
          }
        >
          <SectionRenderer section={section} />
        </SectionLayoutShell>
      ))}
    </div>
  );
}
