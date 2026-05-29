import { syncDesignPages, type WebsiteWizardInput } from "@/lib/wizard";

interface StepPagesSetupProps {
  value: WebsiteWizardInput["designConfig"];
  onChange: (value: WebsiteWizardInput["designConfig"]) => void;
  headerMode?: "default" | "compact";
}

export function StepPagesSetup({
  value,
  onChange,
  headerMode = "default",
}: StepPagesSetupProps) {
  const pageCount = value.pages.length;

  function updatePages(nextPages: WebsiteWizardInput["designConfig"]["pages"]) {
    onChange({
      pages: syncDesignPages(nextPages, nextPages.length),
    });
  }

  function updatePageCount(count: number) {
    onChange({
      pages: syncDesignPages(value.pages, count),
    });
  }

  function updatePageName(index: number, name: string) {
    updatePages(
      value.pages.map((page, pageIndex) =>
        pageIndex === index
          ? {
              ...page,
              name,
            }
          : page,
      ),
    );
  }

  function addPage() {
    updatePageCount(Math.min(12, pageCount + 1));
  }

  function removePage(index: number) {
    if (value.pages.length <= 1) {
      return;
    }

    updatePages(value.pages.filter((_, pageIndex) => pageIndex !== index));
  }

  return (
    <section className="wizard-step-panel">
      {headerMode === "compact" ? (
        <div className="website-builder-section-header">
          <div>
            <h3>Pages</h3>
            <p className="wizard-step-description">
              Set the page count, name each page, and keep the page plan tidy before moving into
              structure and styling.
            </p>
          </div>

          <button
            type="button"
            className="wizard-button-secondary website-inline-action"
            onClick={addPage}
            disabled={pageCount >= 12}
          >
            Add page
          </button>
        </div>
      ) : (
        <div className="website-builder-step-header">
          <div>
            <span className="website-builder-step-label">Step 1</span>
            <h2>Pages</h2>
            <p className="wizard-step-description">
              Start with the page plan. Set the page count, name each page, and add or remove
              pages safely before styling them.
            </p>
          </div>

          <button
            type="button"
            className="wizard-button-secondary website-inline-action"
            onClick={addPage}
            disabled={pageCount >= 12}
          >
            Add page
          </button>
        </div>
      )}

      <div className="wizard-form-grid">
        <label>
          <span>Page count</span>
          <select
            value={pageCount}
            onChange={(event) => updatePageCount(Number(event.target.value))}
          >
            {Array.from({ length: 12 }, (_, index) => index + 1).map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? "page" : "pages"}
              </option>
            ))}
          </select>
          <span className="wizard-field-hint">
            Suggested pages start with Home, About, Services, Portfolio, Blog, and Contact.
          </span>
        </label>

        <div className="website-page-count-summary" aria-live="polite">
          <span className="website-page-count-label">Planned pages</span>
          <strong>{pageCount}</strong>
          <p className="wizard-field-hint">
            One global add button keeps setup cleaner. Each page card only handles its own name and
            removal.
          </p>
        </div>
      </div>

      <div className="wizard-pages-grid">
        {value.pages.map((page, index) => (
          <article key={page.id} className="wizard-page-card website-page-setup-card">
            <div className="wizard-page-card-header website-page-setup-card-header">
              <div>
                <span className="website-page-card-index">{`Page ${index + 1}`}</span>
                <h3>{page.name || `Page ${index + 1}`}</h3>
                <span className="wizard-field-hint">
                  Layout and design controls appear in Step 2.
                </span>
              </div>

              {pageCount > 1 ? (
                <button
                  type="button"
                  className="website-page-remove"
                  onClick={() => removePage(index)}
                  aria-label={`Remove ${page.name || `page ${index + 1}`}`}
                >
                  Remove
                </button>
              ) : null}
            </div>

            <label>
              <span>Page name</span>
              <input
                type="text"
                value={page.name}
                onChange={(event) => updatePageName(index, event.target.value)}
                placeholder={`Page ${index + 1}`}
              />
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}
