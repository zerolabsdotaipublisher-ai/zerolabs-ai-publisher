import type { WebsiteStructure } from "@/lib/ai/structure";

interface EditorNavigationPanelProps {
  structure: WebsiteStructure;
  onLabelChange: (href: string, label: string) => void;
  onMoveUp: (href: string) => void;
  onMoveDown: (href: string) => void;
  onTogglePrimary: (href: string, include: boolean) => void;
}

export function EditorNavigationPanel({
  structure,
  onLabelChange,
  onMoveUp,
  onMoveDown,
  onTogglePrimary,
}: EditorNavigationPanelProps) {
  const primaryByHref = new Set(structure.navigation.primary.map((item) => item.href));
  const primaryLabelByHref = new Map(structure.navigation.primary.map((item) => [item.href, item.label]));

  return (
    <section className="editor-panel">
      <h3>Navigation</h3>
      <ul className="editor-nav-list">
        {structure.pages
          .slice()
          .sort((left, right) => left.order - right.order)
          .map((page) => {
            const included = primaryByHref.has(page.slug);
            const label = primaryLabelByHref.get(page.slug) || page.navigationLabel || page.title;

            return (
              <li key={page.id}>
                <label>
                  <span>{page.slug}</span>
                  <input type="text" value={label} onChange={(event) => onLabelChange(page.slug, event.target.value)} />
                </label>
                <div className="editor-inline-actions">
                  <button type="button" onClick={() => onMoveUp(page.slug)} aria-label={`Move ${page.slug} up in navigation`}>
                    ↑
                  </button>
                  <button type="button" onClick={() => onMoveDown(page.slug)} aria-label={`Move ${page.slug} down in navigation`}>
                    ↓
                  </button>
                  <label className="editor-checkbox">
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={(event) => onTogglePrimary(page.slug, event.target.checked)}
                    />
                    <span>Show</span>
                  </label>
                </div>
              </li>
            );
          })}
      </ul>
    </section>
  );
}
