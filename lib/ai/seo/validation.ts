import { validateWebsiteSeoShape } from "./schemas";
import { SEO_METADATA_REQUIREMENTS } from "./requirements";
import type { WebsiteSeoPackage } from "./types";

const TITLE_LENGTH_TOLERANCE = 20;
const DESCRIPTION_LENGTH_TOLERANCE = 30;

export function validateGeneratedWebsiteSeo(seo: WebsiteSeoPackage): string[] {
  const errors = validateWebsiteSeoShape(seo);

  seo.pages.forEach((page, index) => {
    if (
      page.title.length >
      SEO_METADATA_REQUIREMENTS.titleMaxLength + TITLE_LENGTH_TOLERANCE
    ) {
      errors.push(`pages[${index}].title is too long for SEO`);
    }

    if (
      page.description.length >
      SEO_METADATA_REQUIREMENTS.descriptionMaxLength + DESCRIPTION_LENGTH_TOLERANCE
    ) {
      errors.push(`pages[${index}].description is too long for SEO`);
    }

    if (!page.canonicalUrl || !page.canonicalUrl.startsWith("http")) {
      errors.push(`pages[${index}].canonicalUrl must be absolute`);
    }
  });

  return errors;
}
