import type { PageLayoutModel } from "@/lib/ai/layout";
import type { WebsitePage } from "@/lib/ai/structure/types";
import type { WebsiteInlineEditing } from "./inline-editing";
import { PageLayoutRenderer } from "./page-layout-renderer";

interface PageRendererProps {
  page: WebsitePage;
  layoutPage?: PageLayoutModel;
  inlineEditing?: WebsiteInlineEditing;
}

/**
 * Render all visible sections of a single website page in order.
 * Uses Story 3-3 layout model when available.
 */
export function PageRenderer({ page, layoutPage, inlineEditing }: PageRendererProps) {
  return <PageLayoutRenderer page={page} layoutPage={layoutPage} inlineEditing={inlineEditing} />;
}
