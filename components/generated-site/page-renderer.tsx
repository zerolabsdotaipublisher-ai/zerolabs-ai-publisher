import type { PageLayoutModel } from "@/lib/ai/layout";
import type { WebsitePage } from "@/lib/ai/structure/types";
import { PageLayoutRenderer } from "./page-layout-renderer";

interface PageRendererProps {
  page: WebsitePage;
  layoutPage?: PageLayoutModel;
}

/**
 * Render all visible sections of a single website page in order.
 * Uses Story 3-3 layout model when available.
 */
export function PageRenderer({ page, layoutPage }: PageRendererProps) {
  return <PageLayoutRenderer page={page} layoutPage={layoutPage} />;
}
