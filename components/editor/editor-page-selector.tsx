import type { WebsitePage } from "@/lib/ai/structure";

interface EditorPageSelectorProps {
  pages: WebsitePage[];
  selectedPageId: string;
  onSelect: (pageId: string) => void;
}

export function EditorPageSelector({ pages, selectedPageId, onSelect }: EditorPageSelectorProps) {
  return (
    <fieldset className="editor-control-group">
      <legend>Page</legend>
      <select
        value={selectedPageId}
        onChange={(event) => onSelect(event.target.value)}
        aria-label="Select page"
      >
        {pages
          .slice()
          .sort((left, right) => left.order - right.order)
          .map((page) => (
            <option key={page.id} value={page.id}>
              {page.title} ({page.slug})
            </option>
          ))}
      </select>
    </fieldset>
  );
}
