import type { ReactNode } from "react";
import type { PageDesignConfig, WebsiteDesignConfig, WebsiteLayoutStructure } from "@/lib/ai/prompts/types";
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
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="wizard-design-section">
      <div className="wizard-design-section-header">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}

export function StepPageDesign({ value, onChange }: StepPageDesignProps) {
  function updatePages(nextPages: WebsiteDesignConfig["pages"]) {
    onChange({ pages: nextPages });
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

  return (
    <section className="wizard-step-panel">
      <h2>Design each page</h2>
      <p className="wizard-step-description">
        Each page can use its own layout, background, typography, heading system, and content direction.
      </p>

      <div className="wizard-page-design-stack">
        {value.pages.map((page, index) => {
          const headingSizes = headingPreviewSizes[page.headings.headingScale];
          const bodySize = bodyPreviewSizes[page.typography.fontSizePreference ?? "comfortable"];

          return (
            <article key={page.id} className="wizard-page-design-card">
              <div className="wizard-page-design-header">
                <div>
                  <h3>{page.name || `Page ${index + 1}`}</h3>
                  <p className="wizard-step-description">
                    Page {index + 1} design configuration.
                  </p>
                </div>
                <span className="wizard-page-badge">{findLayoutLabel(page.layout)}</span>
              </div>

              <SectionHeader title="Page layout" description="Choose the layout structure for this page.">
                <div className="wizard-layout-grid">
                  {layoutStructureOptions.map((option) => {
                    const isSelected = page.layout === option.value;

                    return (
                      <label
                        key={`${page.id}-${option.value}`}
                        className={`wizard-choice-card wizard-layout-card${isSelected ? " is-selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name={`page-layout-${page.id}`}
                          value={option.value}
                          checked={isSelected}
                          onChange={() => updatePage(index, { layout: option.value })}
                        />
                        <LayoutPreview structure={option.value} />
                        <span className="wizard-choice-title">{option.label}</span>
                        <span className="wizard-choice-description">{option.description}</span>
                      </label>
                    );
                  })}
                </div>
              </SectionHeader>

              <SectionHeader
                title="Background design"
                description="What background style should this page use?"
              >
                <div className="wizard-choice-grid">
                  {backgroundStyleOptions.map((option) => {
                    const isSelected = page.background.type === option.value;

                    return (
                      <label
                        key={`${page.id}-${option.value}`}
                        className={`wizard-choice-card${isSelected ? " is-selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name={`page-background-${page.id}`}
                          value={option.value}
                          checked={isSelected}
                          onChange={() => updatePageBackground(index, { type: option.value })}
                        />
                        <span className="wizard-choice-title">{option.label}</span>
                        <span className="wizard-choice-description">{option.description}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="wizard-form-grid">
                  <ColorField
                    label="Primary background color"
                    value={page.background.primaryColor}
                    onChange={(nextValue) => updatePageBackground(index, { primaryColor: nextValue })}
                    pickerFallback="#0f352b"
                  />

                  {page.background.type === "blend" || page.background.type === "gradient" ? (
                    <ColorField
                      label="Secondary background color"
                      value={page.background.secondaryColor ?? "#145340"}
                      onChange={(nextValue) => updatePageBackground(index, { secondaryColor: nextValue })}
                      pickerFallback="#145340"
                    />
                  ) : null}

                  {page.background.type === "gradient" ? (
                    <label>
                      <span>Gradient direction</span>
                      <select
                        value={page.background.gradientDirection ?? gradientDirectionOptions[0].value}
                        onChange={(event) =>
                          updatePageBackground(index, { gradientDirection: event.target.value })
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

                  {page.background.type === "image" ? (
                    <label className="wizard-field-span-full">
                      <span>Image URL</span>
                      <input
                        type="url"
                        value={page.background.imageUrl ?? ""}
                        onChange={(event) => updatePageBackground(index, { imageUrl: event.target.value })}
                        placeholder="https://example.com/background.jpg"
                      />
                    </label>
                  ) : null}

                  {page.background.type === "video" ? (
                    <label className="wizard-field-span-full">
                      <span>Video URL</span>
                      <input
                        type="url"
                        value={page.background.videoUrl ?? ""}
                        onChange={(event) => updatePageBackground(index, { videoUrl: event.target.value })}
                        placeholder="https://example.com/background.mp4"
                      />
                    </label>
                  ) : null}
                </div>
              </SectionHeader>

              <SectionHeader title="Typography" description="Choose the body text style for this page.">
                <div className="wizard-form-grid">
                  <label>
                    <span>Body font family</span>
                    <select
                      value={page.typography.bodyFont}
                      onChange={(event) => updatePageTypography(index, { bodyFont: event.target.value })}
                    >
                      {fontFamilyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <ColorField
                    label="Font color"
                    value={page.typography.bodyColor}
                    onChange={(nextValue) => updatePageTypography(index, { bodyColor: nextValue })}
                    pickerFallback="#f8f9fa"
                  />

                  <label>
                    <span>Font size preference</span>
                    <select
                      value={page.typography.fontSizePreference ?? "comfortable"}
                      onChange={(event) =>
                        updatePageTypography(index, {
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
                    const isSelected = page.typography.fontMood === option.value;

                    return (
                      <label
                        key={`${page.id}-${option.value}`}
                        className={`wizard-choice-card${isSelected ? " is-selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name={`page-font-mood-${page.id}`}
                          value={option.value}
                          checked={isSelected}
                          onChange={() => updatePageTypography(index, { fontMood: option.value })}
                        />
                        <span className="wizard-choice-title">{option.label}</span>
                        <span className="wizard-choice-description">{option.description}</span>
                      </label>
                    );
                  })}
                </div>

                <div
                  className="wizard-typography-preview"
                  style={{
                    color: page.typography.bodyColor,
                    fontFamily: page.typography.bodyFont,
                    fontSize: bodySize,
                  }}
                >
                  <strong>Body copy preview</strong>
                  <p>
                    This page is styled to feel {page.typography.fontMood}, so you can judge the page-level body type before generation.
                  </p>
                </div>
              </SectionHeader>

              <SectionHeader title="Heading style" description="Define the heading system for this page.">
                <div className="wizard-form-grid">
                  <label>
                    <span>Heading font family</span>
                    <select
                      value={page.headings.headingFont}
                      onChange={(event) => updatePageHeadings(index, { headingFont: event.target.value })}
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
                    value={page.headings.headingColor}
                    onChange={(nextValue) => updatePageHeadings(index, { headingColor: nextValue })}
                    pickerFallback="#f8f9fa"
                  />

                  <label>
                    <span>Heading weight</span>
                    <select
                      value={page.headings.headingWeight}
                      onChange={(event) => updatePageHeadings(index, { headingWeight: event.target.value })}
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
                    const isSelected = page.headings.headingScale === option.value;

                    return (
                      <label
                        key={`${page.id}-${option.value}`}
                        className={`wizard-choice-card${isSelected ? " is-selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name={`page-heading-scale-${page.id}`}
                          value={option.value}
                          checked={isSelected}
                          onChange={() => updatePageHeadings(index, { headingScale: option.value })}
                        />
                        <span className="wizard-choice-title">{option.label}</span>
                        <span className="wizard-choice-description">{option.description}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="wizard-heading-preview" aria-label={`${page.name} heading preview`}>
                  {headingSizes.map((fontSize, headingIndex) => (
                    <div
                      key={`${page.id}-h${headingIndex + 1}`}
                      className="wizard-heading-preview-row"
                      style={{
                        color: page.headings.headingColor,
                        fontFamily: page.headings.headingFont,
                        fontWeight: page.headings.headingWeight,
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

              <SectionHeader
                title="Page purpose and content prompt"
                description="Describe what this page should include so generation keeps the page focused."
              >
                <label>
                  <span>What should this page include?</span>
                  <textarea
                    value={page.contentPrompt}
                    onChange={(event) => updatePage(index, { contentPrompt: event.target.value })}
                    rows={4}
                    placeholder="Hero, value proposition, CTA"
                  />
                </label>
              </SectionHeader>
            </article>
          );
        })}
      </div>
    </section>
  );
}
