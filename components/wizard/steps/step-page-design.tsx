"use client";

import { useMemo, useState, type ReactNode } from "react";
import type {
  PageDesignConfig,
  WebsiteDesignConfig,
  WebsiteLayoutStructure,
} from "@/lib/ai/prompts/types";
import {
  backgroundStyleOptions,
  fontFamilyOptions,
  fontMoodOptions,
  fontSizePreferenceOptions,
  gradientDirectionOptions,
  headingScaleOptions,
  headingWeightOptions,
  layoutStructureOptions,
  type WebsiteWizardInput,
} from "@/lib/wizard";

interface StepPageDesignProps {
  value: WebsiteWizardInput["designConfig"];
  onChange: (value: WebsiteWizardInput["designConfig"]) => void;
  activePageId?: string;
  onActivePageChange?: (pageId: string) => void;
  mode?: "full" | "structure" | "design";
  headerMode?: "default" | "compact";
  errors?: string[];
}

const headingPreviewSizes = {
  large: ["3.4rem", "2.7rem", "2.15rem", "1.75rem", "1.35rem", "1.05rem"],
  balanced: ["3rem", "2.35rem", "1.85rem", "1.5rem", "1.2rem", "1rem"],
  compact: ["2.5rem", "2rem", "1.6rem", "1.35rem", "1.1rem", "0.95rem"],
  editorial: ["3.7rem", "2.9rem", "2.25rem", "1.8rem", "1.4rem", "1.1rem"],
} satisfies Record<PageDesignConfig["headings"]["headingScale"], string[]>;

const bodyPreviewSizes = {
  compact: "0.95rem",
  comfortable: "1rem",
  large: "1.08rem",
} satisfies Record<NonNullable<PageDesignConfig["typography"]["fontSizePreference"]>, string>;

function findLayoutLabel(value: WebsiteLayoutStructure): string {
  return layoutStructureOptions.find((option) => option.value === value)?.label ?? value;
}

function formatItemsLeft(count: number): string {
  return `${count} ${count === 1 ? "item" : "items"} left`;
}

function getPageLabel(page: PageDesignConfig, index: number): string {
  return page.name.trim() || `Page ${index + 1}`;
}

function getPageErrors(errors: string[], page: PageDesignConfig, index: number): string[] {
  const resolvedLabel = getPageLabel(page, index);
  const pagePrefix = `${resolvedLabel}:`;
  const fallbackPrefix = `Page ${index + 1}:`;

  return errors.filter((error) => error.startsWith(pagePrefix) || error.startsWith(fallbackPrefix));
}

function summarizeSectionErrors(
  errors: string[],
  label: string,
): string | undefined {
  if (errors.length === 0) {
    return undefined;
  }

  if (errors.length === 1) {
    return errors[0];
  }

  return `${errors.length} ${label} settings still need attention.`;
}

function toSafeColorValue(value: string, fallback = "#0f352b"): string {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : fallback;
}

function ColorField({
  label,
  value,
  onChange,
  pickerFallback,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  pickerFallback: string;
}) {
  return (
    <label className="wizard-color-field">
      <span>{label}</span>
      <div className="wizard-color-inputs">
        <input
          type="color"
          value={toSafeColorValue(value, pickerFallback)}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} color picker`}
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={pickerFallback}
          spellCheck={false}
        />
      </div>
    </label>
  );
}

function LayoutPreview({ structure }: { structure: WebsiteLayoutStructure }) {
  switch (structure) {
    case "hero-sections":
      return (
        <div className="wizard-layout-preview wizard-layout-preview-hero" aria-hidden="true">
          <span className="hero" />
          <span />
          <span />
          <span />
        </div>
      );
    case "landing-page":
      return (
        <div className="wizard-layout-preview wizard-layout-preview-landing" aria-hidden="true">
          <span className="hero" />
          <div>
            <span />
            <span />
            <span />
          </div>
          <span className="cta" />
        </div>
      );
    case "portfolio-layout":
      return (
        <div className="wizard-layout-preview wizard-layout-preview-portfolio" aria-hidden="true">
          <span className="hero" />
          <div>
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      );
    case "blog-content":
      return (
        <div className="wizard-layout-preview wizard-layout-preview-blog" aria-hidden="true">
          <span className="hero" />
          <div className="content">
            <span className="article" />
            <span className="sidebar" />
          </div>
          <span className="article-row" />
        </div>
      );
    case "service-business":
      return (
        <div className="wizard-layout-preview wizard-layout-preview-service" aria-hidden="true">
          <span className="hero" />
          <div>
            <span />
            <span />
          </div>
          <span className="cta" />
        </div>
      );
    case "product-showcase":
      return (
        <div className="wizard-layout-preview wizard-layout-preview-product" aria-hidden="true">
          <div className="feature">
            <span className="device" />
            <div className="copy">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="grid">
            <span />
            <span />
            <span />
          </div>
        </div>
      );
    case "split-screen":
      return (
        <div className="wizard-layout-preview wizard-layout-preview-split" aria-hidden="true">
          <span className="pane" />
          <span className="pane accent" />
        </div>
      );
    case "grid-gallery":
      return (
        <div className="wizard-layout-preview wizard-layout-preview-gallery" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      );
    case "contact-info":
      return (
        <div className="wizard-layout-preview wizard-layout-preview-contact" aria-hidden="true">
          <span className="hero" />
          <span />
          <div>
            <span />
            <span />
          </div>
        </div>
      );
    case "about-story":
      return (
        <div className="wizard-layout-preview wizard-layout-preview-about" aria-hidden="true">
          <span className="hero" />
          <span className="article-row" />
          <span className="article-row" />
          <div>
            <span />
            <span />
          </div>
        </div>
      );
    default:
      return null;
  }
}

function SectionHeader({
  title,
  description,
  statusMessage,
  children,
}: {
  title: string;
  description: string;
  statusMessage?: string;
  children: ReactNode;
}) {
  return (
    <section className="wizard-design-section">
      <div className="wizard-design-section-header">
        <h4>{title}</h4>
        <p>{description}</p>
        {statusMessage ? <p className="wizard-section-status">{statusMessage}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function StepPageDesign({
  value,
  onChange,
  activePageId,
  onActivePageChange,
  mode = "full",
  headerMode = "default",
  errors = [],
}: StepPageDesignProps) {
  const [internalActivePageId, setInternalActivePageId] = useState<string | null>(
    value.pages[0]?.id ?? null,
  );

  const resolvedActivePageId = activePageId ?? internalActivePageId ?? value.pages[0]?.id ?? null;

  const activePageIndex = Math.max(
    value.pages.findIndex((page) => page.id === resolvedActivePageId),
    0,
  );
  const activePage = value.pages[activePageIndex];

  const headingSizes = useMemo(() => {
    if (!activePage) {
      return headingPreviewSizes.large;
    }

    return headingPreviewSizes[activePage.headings.headingScale];
  }, [activePage]);

  const bodySize = activePage
    ? bodyPreviewSizes[activePage.typography.fontSizePreference ?? "comfortable"]
    : bodyPreviewSizes.comfortable;
  const showLayoutSection = mode !== "design";
  const showVisualSections = mode !== "structure";
  const showContentSection = mode !== "design";
  const headerTitle = mode === "structure" ? "Structure and build" : "Design selected page";
  const headerDescription =
    mode === "structure"
      ? "Choose a page to shape, then define its layout and content direction."
      : mode === "design"
        ? "Fine-tune background, typography, and heading style for the selected page."
        : "Each page keeps its own layout, background, typography, heading, and content settings. Select one page to edit at a time.";
  const headerLabel = mode === "structure" ? "Phase 2" : mode === "design" ? "Phase 3" : "Step 2";
  const pageErrorsById = useMemo(
    () =>
      new Map(
        value.pages.map((page, index) => [page.id, getPageErrors(errors, page, index)]),
      ),
    [errors, value.pages],
  );

  function updatePages(nextPages: WebsiteDesignConfig["pages"]) {
    onChange({ pages: nextPages });
  }

  function handleActivePageChange(pageId: string) {
    if (onActivePageChange) {
      onActivePageChange(pageId);
      return;
    }

    setInternalActivePageId(pageId);
  }
  function updatePage(index: number, patch: Partial<PageDesignConfig>) {
    updatePages(
      value.pages.map((page, pageIndex) =>
        pageIndex === index
          ? {
              ...page,
              ...patch,
            }
          : page,
      ),
    );
  }

  function updatePageBackground(index: number, patch: Partial<PageDesignConfig["background"]>) {
    updatePage(index, {
      background: {
        ...value.pages[index].background,
        ...patch,
      },
    });
  }

  function updatePageTypography(index: number, patch: Partial<PageDesignConfig["typography"]>) {
    updatePage(index, {
      typography: {
        ...value.pages[index].typography,
        ...patch,
      },
    });
  }

  function updatePageHeadings(index: number, patch: Partial<PageDesignConfig["headings"]>) {
    updatePage(index, {
      headings: {
        ...value.pages[index].headings,
        ...patch,
      },
    });
  }

  if (!activePage) {
    return null;
  }

  const activePageErrors = pageErrorsById.get(activePage.id) ?? [];
  const layoutErrors = activePageErrors.filter((error) => error.includes("choose a layout"));
  const backgroundErrors = activePageErrors.filter(
    (error) =>
      error.includes("background color") ||
      error.includes("gradient direction") ||
      error.includes("image URL") ||
      error.includes("video URL"),
  );
  const typographyErrors = activePageErrors.filter(
    (error) =>
      error.includes("body font family") ||
      error.includes("body font color") ||
      error.includes("font mood"),
  );
  const headingErrors = activePageErrors.filter(
    (error) =>
      error.includes("heading font family") ||
      error.includes("heading color") ||
      error.includes("heading weight") ||
      error.includes("heading scale"),
  );
  const contentPromptError = activePageErrors.find((error) =>
    error.includes("describe what this page should include."),
  );

  return (
    <section className="wizard-step-panel">
      {headerMode === "compact" ? (
        <div className="website-builder-section-header">
          <div>
            <h3>{headerTitle}</h3>
            <p className="wizard-step-description">{headerDescription}</p>
          </div>

          <div className="website-builder-step-summary" aria-live="polite">
            <span className="website-builder-step-summary-label">Currently editing</span>
            <strong>{activePage.name || `Page ${activePageIndex + 1}`}</strong>
            <span className="website-builder-step-summary-meta">{`${value.pages.length} pages planned`}</span>
          </div>
        </div>
      ) : (
        <div className="website-builder-step-header">
          <div>
            <span className="website-builder-step-label">{headerLabel}</span>
            <h2>{headerTitle}</h2>
            <p className="wizard-step-description">{headerDescription}</p>
          </div>

          <div className="website-builder-step-summary" aria-live="polite">
            <span className="website-builder-step-summary-label">Currently editing</span>
            <strong>{activePage.name || `Page ${activePageIndex + 1}`}</strong>
            <span className="website-builder-step-summary-meta">{`${value.pages.length} pages planned`}</span>
          </div>
        </div>
      )}

      <div className="wizard-page-selector" role="list" aria-label="Pages to design">
        {value.pages.map((page, index) => {
          const isActive = page.id === activePage.id;
          const pageErrors = pageErrorsById.get(page.id) ?? [];
          const pageStateLabel = isActive
            ? "Current"
            : pageErrors.length === 0
              ? "Ready"
              : "Items left";
          const pageStatusCopy =
            pageErrors.length === 0
              ? "All required page settings complete."
              : formatItemsLeft(pageErrors.length);

          return (
            <button
              key={page.id}
              type="button"
              className={`wizard-page-tab${isActive ? " is-active" : ""}`}
              aria-pressed={isActive}
              aria-current={isActive ? "page" : undefined}
              onClick={() => handleActivePageChange(page.id)}
            >
              <span className="wizard-page-tab-index">Page {index + 1}</span>
              <strong>{page.name || `Page ${index + 1}`}</strong>
              <span className="wizard-page-tab-layout">{findLayoutLabel(page.layout)}</span>
              <span className="wizard-page-tab-status-copy">{pageStatusCopy}</span>
              <span className="wizard-page-tab-state">{pageStateLabel}</span>
            </button>
          );
        })}
      </div>

      <article key={activePage.id} className="wizard-page-design-card">
        <div className="wizard-page-design-header">
          <div>
            <h3>{activePage.name || `Page ${activePageIndex + 1}`}</h3>
            <p className="wizard-step-description">
              The controls below affect only this page. Switch pages at any time without losing
              page-specific settings.
            </p>
          </div>
          <span className="wizard-page-badge">{findLayoutLabel(activePage.layout)}</span>
        </div>

        {activePageErrors.length > 0 ? (
          <p className="wizard-field-error">{`${getPageLabel(activePage, activePageIndex)} still has ${formatItemsLeft(activePageErrors.length)} before generation.`}</p>
        ) : null}

        {showLayoutSection ? (
          <SectionHeader
            title="Page layout"
            description="Choose the layout structure for this page."
            statusMessage={summarizeSectionErrors(layoutErrors, "layout")}
          >
            <div className="wizard-layout-grid">
              {layoutStructureOptions.map((option) => {
                const isSelected = activePage.layout === option.value;

                return (
                  <label
                    key={`${activePage.id}-${option.value}`}
                    className={`wizard-choice-card wizard-layout-card${isSelected ? " is-selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name={`page-layout-${activePage.id}`}
                      value={option.value}
                      checked={isSelected}
                      onChange={() => updatePage(activePageIndex, { layout: option.value })}
                    />
                    <LayoutPreview structure={option.value} />
                    <span className="wizard-choice-title">{option.label}</span>
                    <span className="wizard-choice-description">{option.description}</span>
                    {isSelected ? <span className="wizard-choice-state">Selected</span> : null}
                  </label>
                );
              })}
            </div>
          </SectionHeader>
        ) : null}

        {showVisualSections ? (
          <SectionHeader
            title="Background design"
            description="Choose the page background style, then set the matching colors or media source."
            statusMessage={summarizeSectionErrors(backgroundErrors, "background")}
          >
            <div className="wizard-choice-grid">
              {backgroundStyleOptions.map((option) => {
                const isSelected = activePage.background.type === option.value;

                return (
                  <label
                    key={`${activePage.id}-${option.value}`}
                    className={`wizard-choice-card${isSelected ? " is-selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name={`page-background-${activePage.id}`}
                      value={option.value}
                      checked={isSelected}
                      onChange={() => updatePageBackground(activePageIndex, { type: option.value })}
                    />
                    <span className="wizard-choice-title">{option.label}</span>
                    <span className="wizard-choice-description">{option.description}</span>
                    {isSelected ? <span className="wizard-choice-state">Selected</span> : null}
                  </label>
                );
              })}
            </div>

            <div className="wizard-form-grid">
              <ColorField
                label="Primary background color"
                value={activePage.background.primaryColor}
                onChange={(nextValue) => updatePageBackground(activePageIndex, { primaryColor: nextValue })}
                pickerFallback="#0f352b"
              />

              {activePage.background.type === "blend" || activePage.background.type === "gradient" ? (
                <ColorField
                  label="Secondary background color"
                  value={activePage.background.secondaryColor ?? "#145340"}
                  onChange={(nextValue) =>
                    updatePageBackground(activePageIndex, { secondaryColor: nextValue })
                  }
                  pickerFallback="#145340"
                />
              ) : null}

              {activePage.background.type === "gradient" ? (
                <label>
                  <span>Gradient direction</span>
                  <select
                    value={activePage.background.gradientDirection ?? gradientDirectionOptions[0].value}
                    onChange={(event) =>
                      updatePageBackground(activePageIndex, { gradientDirection: event.target.value })
                    }
                  >
                    {gradientDirectionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {activePage.background.type === "image" ? (
                <label className="wizard-field-span-full">
                  <span>Image URL</span>
                  <input
                    type="url"
                    value={activePage.background.imageUrl ?? ""}
                    onChange={(event) =>
                      updatePageBackground(activePageIndex, { imageUrl: event.target.value })
                    }
                    placeholder="https://example.com/background.jpg"
                  />
                </label>
              ) : null}

              {activePage.background.type === "video" ? (
                <label className="wizard-field-span-full">
                  <span>Video URL</span>
                  <input
                    type="url"
                    value={activePage.background.videoUrl ?? ""}
                    onChange={(event) =>
                      updatePageBackground(activePageIndex, { videoUrl: event.target.value })
                    }
                    placeholder="https://example.com/background.mp4"
                  />
                </label>
              ) : null}
            </div>
          </SectionHeader>
        ) : null}

        {showVisualSections ? (
          <SectionHeader
            title="Typography"
            description="Set the body font system for this page."
            statusMessage={summarizeSectionErrors(typographyErrors, "typography")}
          >
            <div className="wizard-form-grid">
              <label>
                <span>Body font</span>
                <select
                  value={activePage.typography.bodyFont}
                  onChange={(event) => updatePageTypography(activePageIndex, { bodyFont: event.target.value })}
                >
                  {fontFamilyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <ColorField
                label="Body font color"
                value={activePage.typography.bodyColor}
                onChange={(nextValue) => updatePageTypography(activePageIndex, { bodyColor: nextValue })}
                pickerFallback="#f8f9fa"
              />

              <label>
                <span>Font size preference</span>
                <select
                  value={activePage.typography.fontSizePreference ?? "comfortable"}
                  onChange={(event) =>
                    updatePageTypography(activePageIndex, {
                      fontSizePreference:
                        event.target.value as PageDesignConfig["typography"]["fontSizePreference"],
                    })
                  }
                >
                  {fontSizePreferenceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="wizard-choice-grid compact">
              {fontMoodOptions.map((option) => {
                const isSelected = activePage.typography.fontMood === option.value;

                return (
                  <label
                    key={`${activePage.id}-${option.value}`}
                    className={`wizard-choice-card${isSelected ? " is-selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name={`page-font-mood-${activePage.id}`}
                      value={option.value}
                      checked={isSelected}
                      onChange={() => updatePageTypography(activePageIndex, { fontMood: option.value })}
                    />
                    <span className="wizard-choice-title">{option.label}</span>
                    <span className="wizard-choice-description">{option.description}</span>
                    {isSelected ? <span className="wizard-choice-state">Selected</span> : null}
                  </label>
                );
              })}
            </div>

            <div
              className="wizard-typography-preview"
              style={{
                color: activePage.typography.bodyColor,
                fontFamily: activePage.typography.bodyFont,
                fontSize: bodySize,
              }}
            >
              <strong>Body copy preview</strong>
              <p>
                This page is styled to feel {activePage.typography.fontMood}, so you can review the
                body text direction before generation.
              </p>
            </div>
          </SectionHeader>
        ) : null}

        {showVisualSections ? (
          <SectionHeader
            title="Heading style"
            description="Define the heading system for this page."
            statusMessage={summarizeSectionErrors(headingErrors, "heading")}
          >
            <div className="wizard-form-grid">
              <label>
                <span>Heading font</span>
                <select
                  value={activePage.headings.headingFont}
                  onChange={(event) => updatePageHeadings(activePageIndex, { headingFont: event.target.value })}
                >
                  {fontFamilyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <ColorField
                label="Heading color"
                value={activePage.headings.headingColor}
                onChange={(nextValue) => updatePageHeadings(activePageIndex, { headingColor: nextValue })}
                pickerFallback="#f8f9fa"
              />

              <label>
                <span>Heading weight</span>
                <select
                  value={activePage.headings.headingWeight}
                  onChange={(event) => updatePageHeadings(activePageIndex, { headingWeight: event.target.value })}
                >
                  {headingWeightOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="wizard-choice-grid compact">
              {headingScaleOptions.map((option) => {
                const isSelected = activePage.headings.headingScale === option.value;

                return (
                  <label
                    key={`${activePage.id}-${option.value}`}
                    className={`wizard-choice-card${isSelected ? " is-selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name={`page-heading-scale-${activePage.id}`}
                      value={option.value}
                      checked={isSelected}
                      onChange={() => updatePageHeadings(activePageIndex, { headingScale: option.value })}
                    />
                    <span className="wizard-choice-title">{option.label}</span>
                    <span className="wizard-choice-description">{option.description}</span>
                    {isSelected ? <span className="wizard-choice-state">Selected</span> : null}
                  </label>
                );
              })}
            </div>

            <div className="wizard-heading-preview" aria-label={`${activePage.name} heading preview`}>
              {headingSizes.map((fontSize, headingIndex) => (
                <div
                  key={`${activePage.id}-h${headingIndex + 1}`}
                  className="wizard-heading-preview-row"
                  style={{
                    color: activePage.headings.headingColor,
                    fontFamily: activePage.headings.headingFont,
                    fontWeight: activePage.headings.headingWeight,
                    fontSize,
                  }}
                >
                  <span className="wizard-heading-preview-tag">H{headingIndex + 1}</span>
                  <span>
                    {headingIndex === 0
                      ? "Hero heading preview"
                      : headingIndex === 1
                        ? "Section heading preview"
                        : `Supporting heading ${headingIndex + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </SectionHeader>
        ) : null}

        {showContentSection ? (
          <SectionHeader
            title="Page purpose and content prompt"
            description="Describe what this page should include so generation keeps the page focused."
            statusMessage={contentPromptError}
          >
            <label>
              <span>Page content prompt</span>
              <textarea
                value={activePage.contentPrompt}
                onChange={(event) => updatePage(activePageIndex, { contentPrompt: event.target.value })}
                rows={4}
                placeholder="Hero, value proposition, CTA"
                aria-invalid={Boolean(contentPromptError) || undefined}
                aria-describedby={contentPromptError ? `wizard-page-content-prompt-error-${activePage.id}` : undefined}
              />
              <span className="wizard-field-hint">
                Use this field to name the sections, proof points, and CTA the page should include.
              </span>
              {contentPromptError ? (
                <span
                  className="wizard-field-error"
                  id={`wizard-page-content-prompt-error-${activePage.id}`}
                >
                  {contentPromptError}
                </span>
              ) : null}
            </label>
          </SectionHeader>
        ) : null}
      </article>
    </section>
  );
}
