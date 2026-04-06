import type { WebsiteLayoutModel } from "@/lib/ai/layout";

interface LayoutRendererProps {
  layout?: WebsiteLayoutModel;
  pageSlug: string;
}

export function LayoutRenderer({ layout, pageSlug }: LayoutRendererProps) {
  if (!layout) return null;

  const page = layout.pages.find((item) => item.pageSlug === pageSlug) ?? layout.pages[0];
  if (!page) return null;

  return (
    <div
      className="gs-layout-meta"
      hidden
      data-layout-structure-id={layout.structureId}
      data-layout-version={layout.version}
      data-layout-page-template={page.templateName}
      data-layout-theme={page.metadata.themeMode}
      data-layout-color-strategy={page.metadata.colorStrategy}
      data-layout-typography-mood={page.metadata.typographyMood}
    />
  );
}
