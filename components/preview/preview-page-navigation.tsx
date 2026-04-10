import type { PreviewPageOption } from "@/lib/preview";

interface PreviewPageNavigationProps {
  pages: PreviewPageOption[];
  currentPageSlug: string;
  onSelectPage: (pageSlug: string) => void;
}

export function PreviewPageNavigation({
  pages,
  currentPageSlug,
  onSelectPage,
}: PreviewPageNavigationProps) {
  return (
    <label className="preview-control-group">
      <span>Page</span>
      <select
        value={currentPageSlug}
        onChange={(event) => onSelectPage(event.target.value)}
      >
        {pages.map((page) => (
          <option key={page.id} value={page.slug}>
            {page.title}
          </option>
        ))}
      </select>
    </label>
  );
}
