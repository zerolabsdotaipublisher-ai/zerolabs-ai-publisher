import type { WebsiteStructure } from "@/lib/ai/structure/types";
import { LayoutRenderer } from "./layout-renderer";
import { PageRenderer } from "./page-renderer";
import { NavigationRenderer } from "./navigation-renderer";

interface RendererProps {
  structure: WebsiteStructure;
  /** URL slug of the page to render. Defaults to "/" (home page). */
  pageSlug?: string;
}

/**
 * Top-level website structure renderer.
 *
 * Renders the header navigation, the requested page, and provides the
 * site-level layout container.  This is the entry point for the
 * AI → structure → render pipeline.
 */
export function Renderer({ structure, pageSlug = "/" }: RendererProps) {
  const page =
    structure.pages.find((p) => p.slug === pageSlug) ?? structure.pages[0];
  const layoutPage =
    structure.layout?.pages.find((p) => p.pageSlug === pageSlug) ??
    structure.layout?.pages[0];

  if (!page) {
    return (
      <div className="gs-error">
        <p>No page found for this website structure.</p>
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
          currentPageHref=""
        />
      </header>

      <LayoutRenderer layout={structure.layout} pageSlug={pageSlug} />

      <main className="gs-site-main">
        <PageRenderer page={page} layoutPage={layoutPage} />
      </main>
      {structure.navigation.footer && structure.navigation.footer.length > 0 ? (
        <footer className="gs-site-footer-nav" aria-label="Footer navigation">
          <ul className="gs-site-nav-list">
            {structure.navigation.footer.map((item) => (
              <li key={`${item.href}-${item.label}`} className="gs-site-nav-item">
                <a
                  className="gs-site-nav-link"
                  href={
                    item.href.startsWith("/")
                      ? `?page=${encodeURIComponent(item.href)}`
                      : item.href
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
