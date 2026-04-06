import type { PageLayoutModel } from "@/lib/ai/layout";
import type { WebsitePage, WebsiteSection } from "@/lib/ai/structure/types";
import { SectionRenderer } from "./section-renderer";
import { SectionLayoutShell } from "./section-layout-shell";

interface PageLayoutRendererProps {
  page: WebsitePage;
  layoutPage?: PageLayoutModel;
}

function getRenderableSections(
  page: WebsitePage,
  layoutPage?: PageLayoutModel,
): WebsiteSection[] {
  if (!layoutPage) {
    return page.sections
      .filter((section) => section.visible)
      .sort((a, b) => a.order - b.order);
  }

  const byId = new Map(page.sections.map((section) => [section.id, section]));

  return layoutPage.sectionLayouts
    .filter((node) => node.visible)
    .map((node) => byId.get(node.sectionId))
    .filter((section): section is WebsiteSection => Boolean(section));
}

export function PageLayoutRenderer({ page, layoutPage }: PageLayoutRendererProps) {
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
      data-layout-style={layoutPage?.metadata.layoutStyleTag}
      data-layout-spacing-scale={layoutPage?.metadata.spacingScale}
      data-layout-emphasis={layoutPage?.metadata.emphasisPattern}
    >
      {visibleSections.map((section) => (
        <SectionLayoutShell key={section.id} node={layoutBySectionId.get(section.id)}>
          <SectionRenderer section={section} />
        </SectionLayoutShell>
      ))}
    </div>
  );
}
