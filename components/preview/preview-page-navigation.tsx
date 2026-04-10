import Link from "next/link";
import type { PreviewPageOption } from "@/lib/preview";

interface PreviewPageNavigationProps {
  pages: PreviewPageOption[];
  currentPageSlug: string;
  pageLinks: Record<string, string>;
}

export function PreviewPageNavigation({
  pages,
  currentPageSlug,
  pageLinks,
}: PreviewPageNavigationProps) {
  return (
    <fieldset className="preview-control-group">
      <legend>Page</legend>
      <div className="preview-control-buttons">
        {pages.map((page) =>
          page.slug === currentPageSlug ? (
            <span key={page.id} className="is-active" aria-current="page">
              {page.title}
            </span>
          ) : (
            <Link key={page.id} href={pageLinks[page.slug]}>
              {page.title}
            </Link>
          ),
        )}
      </div>
    </fieldset>
  );
}
