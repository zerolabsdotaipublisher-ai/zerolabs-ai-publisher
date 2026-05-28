import { syncDesignPages, type WebsiteWizardInput } from "@/lib/wizard";

interface StepPagesSetupProps {
  value: WebsiteWizardInput["designConfig"];
  onChange: (value: WebsiteWizardInput["designConfig"]) => void;
}

export function StepPagesSetup({ value, onChange }: StepPagesSetupProps) {
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
      <h2>How many pages do you want to create?</h2>
      <p className="wizard-step-description">
        Start by defining the page list. You will customize each page in the next step.
      </p>

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
      </div>

      <div className="wizard-pages-grid">
        {value.pages.map((page, index) => (
          <article key={page.id} className="wizard-page-card">
            <div className="wizard-page-card-header">
              <h3>Page {index + 1}</h3>
              <span className="wizard-field-hint">
                Default layout and page styling can be changed in the next step.
              </span>
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

            <div className="wizard-inline-actions">
              <button
                type="button"
                className="wizard-button-secondary"
                onClick={addPage}
                disabled={pageCount >= 12}
              >
                Add page
              </button>
              <button
                type="button"
                className="wizard-button-secondary"
                onClick={() => removePage(index)}
                disabled={pageCount <= 1}
              >
                Remove page
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
