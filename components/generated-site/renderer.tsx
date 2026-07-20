import type { WebsiteStructure } from "@/lib/ai/structure/types";
import { normalizeWebsiteStructureForRender } from "@/lib/ai/structure/render-normalization";
import { resolveWebsitePageByPath } from "@/lib/routing";
import { LayoutRenderer } from "./layout-renderer";
import { PageRenderer } from "./page-renderer";
import { NavigationRenderer } from "./navigation-renderer";

interface RendererProps {
  structure: WebsiteStructure;
  /** URL slug of the page to render. Defaults to "/" (home page). */
  pageSlug?: string;
  strictRoute?: boolean;
}

/**
 * Top-level website structure renderer.
 *
 * Renders the header navigation, the requested page, and provides the
 * site-level layout container.  This is the entry point for the
 * AI → structure → render pipeline.
 */
export function Renderer({ structure, pageSlug = "/", strictRoute = false }: RendererProps) {
  const normalizedStructure = normalizeWebsiteStructureForRender(structure);
  const resolved = resolveWebsitePageByPath(normalizedStructure, pageSlug);
  const pages = Array.isArray(normalizedStructure.pages) ? normalizedStructure.pages : [];
  const page = resolved.page ?? (strictRoute ? undefined : pages[0]);
  const layoutPages = normalizedStructure.layout?.pages ?? [];
  const footerItems = Array.isArray(normalizedStructure.navigation?.footer)
    ? normalizedStructure.navigation.footer
    : [];
  const layoutPage =
    layoutPages.find((layoutPage) => layoutPage.pageSlug === (page?.slug ?? pageSlug)) ??
    layoutPages[0];

  if (!page) {
    return (
      <div className="gs-error">
        <p>Page not found.</p>
      </div>
    );
  }

  return (
    <div
      className="gs-site"
      data-website-type={normalizedStructure.websiteType}
      data-style-preset={normalizedStructure.styleConfig?.style}
      data-tone-preset={normalizedStructure.styleConfig?.tone}
      data-structure-id={normalizedStructure.id}
    >
      <header className="gs-site-header">
        <NavigationRenderer
          siteTitle={normalizedStructure.siteTitle}
          navigation={normalizedStructure.navigation}
          activePath={page.slug}
        />
      </header>

      <LayoutRenderer layout={normalizedStructure.layout} pageSlug={pageSlug} />

      <main className="gs-site-main">
        <PageRenderer page={page} layoutPage={layoutPage} />
      </main>
      {footerItems.length > 0 ? (
        <footer className="gs-site-footer-nav" aria-label="Footer navigation">
          <ul className="gs-site-nav-list">
            {footerItems.map((item) => (
              <li key={item.pageId ?? item.href} className="gs-site-nav-item">
                <a
                  className="gs-site-nav-link"
                  href={
                    typeof item.href === "string" && item.href.startsWith("/")
                      ? `?page=${encodeURIComponent(item.href)}`
                      : item.href || "#"
                  }
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </footer>
      ) : null}
    </div>
  );
}
