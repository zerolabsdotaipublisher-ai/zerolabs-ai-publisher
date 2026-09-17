import type { WebsitePage } from "@/lib/ai/structure";

interface EditorPageSelectorProps {
  pages: WebsitePage[];
  selectedPageId: string;
  onSelect: (pageId: string) => void;
}

export function EditorPageSelector({ pages, selectedPageId, onSelect }: EditorPageSelectorProps) {
  return (
    <section className="editor-page-selector" aria-label="Pages">
      <div className="editor-page-selector-header">
        <h3>Pages</h3>
        <span>{pages.length}</span>
      </div>
      <div className="editor-page-list">
        {pages
          .slice()
          .sort((left, right) => left.order - right.order)
          .map((page) => (
            <button
              key={page.id}
              type="button"
              className={selectedPageId === page.id ? "is-active" : undefined}
              aria-pressed={selectedPageId === page.id}
              onClick={() => onSelect(page.id)}
            >
              <span>{page.title}</span>
              <small>{page.slug}</small>
            </button>
          ))}
      </div>
    </section>
  );
}
