import { validateWebsiteSeoShape } from "./schemas";
import type { WebsiteSeoPackage } from "./types";

const MAX_TITLE_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 160;

export function validateGeneratedWebsiteSeo(seo: WebsiteSeoPackage): string[] {
  const errors = validateWebsiteSeoShape(seo);

  seo.pages.forEach((page, index) => {
    if (page.title.length > MAX_TITLE_LENGTH + 20) {
      errors.push(`pages[${index}].title is too long for SEO`);
    }

    if (page.description.length > MAX_DESCRIPTION_LENGTH + 30) {
      errors.push(`pages[${index}].description is too long for SEO`);
    }

    if (!page.canonicalUrl.startsWith("http")) {
      errors.push(`pages[${index}].canonicalUrl must be absolute`);
    }
  });

  return errors;
}
