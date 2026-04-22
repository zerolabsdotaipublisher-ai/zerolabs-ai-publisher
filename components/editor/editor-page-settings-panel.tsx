import type { WebsitePage } from "@/lib/ai/structure";

interface EditorPageSettingsPanelProps {
  page?: WebsitePage;
  onTitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onNavigationLabelChange: (value: string) => void;
  onVisibilityChange: (visible: boolean) => void;
  onSeoTitleChange: (value: string) => void;
  onSeoDescriptionChange: (value: string) => void;
  onSeoKeywordsChange: (value: string) => void;
  onCanonicalUrlChange: (value: string) => void;
}

export function EditorPageSettingsPanel({
  page,
  onTitleChange,
  onSlugChange,
  onNavigationLabelChange,
  onVisibilityChange,
  onSeoTitleChange,
  onSeoDescriptionChange,
  onSeoKeywordsChange,
  onCanonicalUrlChange,
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
        <label>
          <span>SEO title</span>
          <input
            type="text"
            value={page.seo.contentOptimization?.titleTag ?? page.seo.title}
            onChange={(event) => onSeoTitleChange(event.target.value)}
          />
        </label>
        <label>
          <span>Meta description</span>
          <textarea
            value={page.seo.contentOptimization?.metaDescription ?? page.seo.description}
            onChange={(event) => onSeoDescriptionChange(event.target.value)}
            rows={4}
          />
        </label>
        <label>
          <span>Keywords</span>
          <input
            type="text"
            value={
              page.seo.contentOptimization
                ? [
                    page.seo.contentOptimization.keywordStrategy.primaryKeyword,
                    ...page.seo.contentOptimization.keywordStrategy.secondaryKeywords,
                  ].join(", ")
                : page.seo.keywords.join(", ")
            }
            onChange={(event) => onSeoKeywordsChange(event.target.value)}
          />
        </label>
        <label>
          <span>Canonical URL</span>
          <input
            type="text"
            value={page.seo.canonicalUrl ?? ""}
            onChange={(event) => onCanonicalUrlChange(event.target.value)}
          />
        </label>
      </div>
    </section>
  );
}
