import type { WebsiteStructure } from "@/lib/ai/structure/types";
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
  const resolved = resolveWebsitePageByPath(structure, pageSlug);
  const pages = Array.isArray(structure.pages) ? structure.pages : [];
  const page = resolved.page ?? (strictRoute ? undefined : pages[0]);
  const layoutPages = structure.layout?.pages ?? [];
  const footerItems = Array.isArray(structure.navigation?.footer) ? structure.navigation.footer : [];
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
      data-website-type={structure.websiteType}
      data-structure-id={structure.id}
    >
      <header className="gs-site-header">
        <NavigationRenderer
          siteTitle={structure.siteTitle}
          navigation={structure.navigation}
          activePath={page.slug}
        />
      </header>

      <LayoutRenderer layout={structure.layout} pageSlug={pageSlug} />

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
