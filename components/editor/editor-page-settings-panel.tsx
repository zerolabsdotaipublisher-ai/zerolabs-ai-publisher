import type { WebsitePage } from "@/lib/ai/structure";

interface EditorPageSettingsPanelProps {
  page?: WebsitePage;
  onTitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onNavigationLabelChange: (value: string) => void;
  onVisibilityChange: (visible: boolean) => void;
}

export function EditorPageSettingsPanel({
  page,
  onTitleChange,
  onSlugChange,
  onNavigationLabelChange,
  onVisibilityChange,
}: EditorPageSettingsPanelProps) {
  if (!page) {
    return (
      <section className="editor-panel">
        <h3>Page settings</h3>
        <p>Select a page to edit page-level settings.</p>
      </section>
    );
  }

  return (
    <section className="editor-panel">
      <h3>Page settings</h3>
      <div className="editor-panel-fields">
        <label>
          <span>Page title</span>
          <input type="text" value={page.title} onChange={(event) => onTitleChange(event.target.value)} />
        </label>
        <label>
          <span>Page slug</span>
          <input type="text" value={page.slug} onChange={(event) => onSlugChange(event.target.value)} />
        </label>
        <label>
          <span>Navigation label</span>
          <input
            type="text"
            value={page.navigationLabel || ""}
            onChange={(event) => onNavigationLabelChange(event.target.value)}
          />
        </label>
        <label className="editor-checkbox">
          <input
            type="checkbox"
            checked={page.visible ?? true}
            onChange={(event) => onVisibilityChange(event.target.checked)}
          />
          <span>Page visible</span>
        </label>
      </div>
    </section>
  );
}
