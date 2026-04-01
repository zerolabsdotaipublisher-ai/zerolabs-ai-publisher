import type { WebsiteStructure } from "@/lib/ai/structure/types";
import { PageRenderer } from "./page-renderer";

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
        <nav className="gs-site-nav" aria-label="Primary navigation">
          <span className="gs-site-brand">{structure.siteTitle}</span>
          <ul className="gs-site-nav-list">
            {structure.navigation.primary.map((item) => (
              <li key={item.href} className="gs-site-nav-item">
                <a
                  href={item.href}
                  className="gs-site-nav-link"
                  {...(item.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="gs-site-main">
        <PageRenderer page={page} />
      </main>
    </div>
  );
}
