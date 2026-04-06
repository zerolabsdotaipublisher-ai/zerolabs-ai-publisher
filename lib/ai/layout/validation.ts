import { logger } from "@/lib/observability";
import { ensurePageLayoutDefaults } from "./fallback";
import {
  isValidWebsiteLayoutModel,
  validateWebsiteLayoutModel,
} from "./schemas";
import type { WebsiteLayoutModel } from "./types";

export { validateWebsiteLayoutModel, isValidWebsiteLayoutModel };

export function ensureValidWebsiteLayout(
  layout: WebsiteLayoutModel,
): { layout: WebsiteLayoutModel; errors: string[]; usedFallback: boolean } {
  const errors = validateWebsiteLayoutModel(layout);

  if (errors.length === 0) {
    return { layout, errors: [], usedFallback: false };
  }

  logger.warn("Generated layout has validation errors; applying page defaults", {
    category: "service_call",
    service: "layout-engine",
    errorCount: errors.length,
  });

  const recovered: WebsiteLayoutModel = {
    ...layout,
    pages: layout.pages.map((page) => ensurePageLayoutDefaults(page)),
  };

  const revalidated = validateWebsiteLayoutModel(recovered);

  return {
    layout: recovered,
    errors: [...errors, ...revalidated],
    usedFallback: true,
  };
}
