import type { WebsitePage } from "@/lib/ai/structure/types";
import { SectionRenderer } from "./section-renderer";

interface PageRendererProps {
  page: WebsitePage;
}

/**
 * Render all visible sections of a single website page in order.
 */
export function PageRenderer({ page }: PageRendererProps) {
  const visibleSections = page.sections
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="gs-page" data-page-type={page.type} data-slug={page.slug}>
      {visibleSections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}
