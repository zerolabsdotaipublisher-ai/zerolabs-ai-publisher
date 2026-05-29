"use client";

import { useMemo, useState } from "react";
import { StepContentInput } from "@/components/wizard/steps/step-content-input";
import { StepPageDesign } from "@/components/wizard/steps/step-page-design";
import { StepPagesSetup } from "@/components/wizard/steps/step-pages-setup";
import { StepStyleTheme } from "@/components/wizard/steps/step-style-theme";
import {
  validateBrandContentStep,
  validateBusinessInfoStep,
  validateOptionalContentInputs,
  validatePageSetupStep,
  type WebsiteWizardInput,
  type WebsiteWizardInputPatch,
} from "@/lib/wizard";

interface GenerationInputPanelProps {
  data: WebsiteWizardInput;
  servicesText: string;
  testimonialsText: string;
  socialLinksText: string;
  constraintsText: string;
  errors: string[];
  isEditing: boolean;
  activePageId?: string;
  onActivePageChange: (pageId: string) => void;
  onFieldChange: (patch: WebsiteWizardInputPatch) => void;
  onServicesTextChange: (value: string) => void;
  onTestimonialsChange: (value: string) => void;
  onSocialLinksChange: (value: string) => void;
  onConstraintsChange: (value: string) => void;
}

type BuilderPhaseId = "planning" | "structure" | "design";

function hasContent(value?: string): boolean {
  return Boolean(value?.trim());
}

function validateStructurePhase(data: WebsiteWizardInput): string[] {
  return data.designConfig.pages.flatMap((page, index) => {
    const pageLabel = page.name.trim() || `Page ${index + 1}`;
    const phaseErrors: string[] = [];

    if (!hasContent(page.layout)) {
      phaseErrors.push(`${pageLabel}: choose a layout.`);
    }

    if (!hasContent(page.contentPrompt)) {
      phaseErrors.push(`${pageLabel}: describe what this page should include.`);
    }

    return phaseErrors;
  });
}

function validateDesignPhase(data: WebsiteWizardInput): string[] {
  const pageErrors = data.designConfig.pages.flatMap((page, index) => {
    const pageLabel = page.name.trim() || `Page ${index + 1}`;
    const phaseErrors: string[] = [];

    if (!hasContent(page.background.primaryColor)) {
      phaseErrors.push(`${pageLabel}: choose a primary background color.`);
    }

    if (
      (page.background.type === "blend" || page.background.type === "gradient") &&
      !hasContent(page.background.secondaryColor)
    ) {
      phaseErrors.push(`${pageLabel}: choose a secondary background color.`);
    }

    if (page.background.type === "gradient" && !hasContent(page.background.gradientDirection)) {
      phaseErrors.push(`${pageLabel}: choose a gradient direction.`);
    }

    if (page.background.type === "image" && !hasContent(page.background.imageUrl)) {
      phaseErrors.push(`${pageLabel}: add an image URL for the selected background style.`);
    }

    if (page.background.type === "video" && !hasContent(page.background.videoUrl)) {
      phaseErrors.push(`${pageLabel}: add a video URL for the selected background style.`);
    }

    if (!hasContent(page.typography.bodyFont)) {
      phaseErrors.push(`${pageLabel}: choose a body font family.`);
    }

    if (!hasContent(page.typography.bodyColor)) {
      phaseErrors.push(`${pageLabel}: choose a body font color.`);
    }

    if (!hasContent(page.typography.fontMood)) {
      phaseErrors.push(`${pageLabel}: choose a font mood.`);
    }

    if (!hasContent(page.headings.headingFont)) {
      phaseErrors.push(`${pageLabel}: choose a heading font family.`);
    }

    if (!hasContent(page.headings.headingColor)) {
      phaseErrors.push(`${pageLabel}: choose a heading color.`);
    }

    if (!hasContent(page.headings.headingWeight)) {
      phaseErrors.push(`${pageLabel}: choose a heading weight.`);
    }

    if (!hasContent(page.headings.headingScale)) {
      phaseErrors.push(`${pageLabel}: choose a heading scale.`);
    }

    return phaseErrors;
  });

  return [
    ...pageErrors,
    ...validateBrandContentStep(data),
    ...validateOptionalContentInputs(data),
  ];
}

function formatPhaseStatus(errors: string[]): string {
  if (errors.length === 0) {
    return "Ready";
  }

  return `${errors.length} ${errors.length === 1 ? "item" : "items"} left`;
}

export function GenerationInputPanel({
  data,
  servicesText,
  testimonialsText,
  socialLinksText,
  constraintsText,
  errors,
  isEditing,
  activePageId,
  onActivePageChange,
  onFieldChange,
  onServicesTextChange,
  onTestimonialsChange,
  onSocialLinksChange,
  onConstraintsChange,
}: GenerationInputPanelProps) {
  const [activePhase, setActivePhase] = useState<BuilderPhaseId>("planning");

  const phaseStates = useMemo(() => {
    const planningErrors = [...validatePageSetupStep(data), ...validateBusinessInfoStep(data)];
    const structureErrors = validateStructurePhase(data);
    const designErrors = validateDesignPhase(data);

    return {
      planning: planningErrors,
      structure: structureErrors,
      design: designErrors,
    } satisfies Record<BuilderPhaseId, string[]>;
  }, [data]);

  const phaseMetadata = [
    {
      id: "planning" as const,
      label: "Phase 1",
      title: "Planning",
      description:
        "Map the website foundation first: page count, page names, website identity, domain, and the brief required for generation.",
      helper:
        "Keep the page-first plan intact, then add the core website brief so generation stays compatible.",
    },
    {
      id: "structure" as const,
      label: "Phase 2",
      title: "Structure and build",
      description:
        "Choose the page you want to shape, then set its layout and page-specific content direction.",
      helper:
        "Each page stays independently editable. Layout choices here flow into the generation payload.",
    },
    {
      id: "design" as const,
      label: "Phase 3",
      title: "Design",
      description:
        "Tune background, typography, and heading style for each page, then add broader creative direction if needed.",
      helper:
        "Visual settings stay page-specific, and optional founder, contact, and testimonial inputs remain available without cluttering the main flow.",
    },
  ];

  const currentPhase = phaseMetadata.find((phase) => phase.id === activePhase) ?? phaseMetadata[0];

  function runIfEditing<T>(handler: (value: T) => void, value: T) {
    if (!isEditing) {
      return;
    }

    handler(value);
  }

  function renderPlanningPhase() {
    return (
      <>
        <StepPagesSetup
          value={data.designConfig}
          headerMode="compact"
          onChange={(value) => runIfEditing(onFieldChange, { designConfig: value })}
        />

        <section className="wizard-step-panel website-builder-brief-panel">
          <div className="website-builder-section-header">
            <div>
              <h3>Website brief</h3>
              <p className="wizard-step-description">
                The page-first setup stays in control, but the current generation pipeline still
                needs the website brief fields below.
              </p>
            </div>
            <span className="website-builder-inline-badge">Required to generate</span>
          </div>

          <div className="wizard-form-grid">
            <label>
              <span>Website name *</span>
              <input
                type="text"
                value={data.brandName}
                onChange={(event) => runIfEditing(onFieldChange, { brandName: event.target.value })}
                placeholder="Acme Studio"
                required
              />
            </label>

            <label>
              <span>Domain name</span>
              <input
                type="text"
                value={data.domainName}
                onChange={(event) => runIfEditing(onFieldChange, { domainName: event.target.value })}
                placeholder="acmestudio.com"
                spellCheck={false}
              />
              <span className="wizard-field-hint">
                Optional for planning. It stays in the UI context and does not break the current
                generation payload.
              </span>
            </label>

            <label className="wizard-field-span-full">
              <span>Short description *</span>
              <textarea
                value={data.description}
                onChange={(event) => runIfEditing(onFieldChange, { description: event.target.value })}
                placeholder="What the website should communicate and the value it should highlight"
                rows={3}
                required
              />
            </label>

            <label>
              <span>Target audience *</span>
              <input
                type="text"
                value={data.targetAudience}
                onChange={(event) =>
                  runIfEditing(onFieldChange, { targetAudience: event.target.value })
                }
                placeholder="Startup founders and growth teams"
                required
              />
            </label>

            <label>
              <span>Primary call-to-action *</span>
              <input
                type="text"
                value={data.primaryCta}
                onChange={(event) => runIfEditing(onFieldChange, { primaryCta: event.target.value })}
                placeholder="Book a strategy call"
                required
              />
            </label>

            <label className="wizard-field-span-full">
              <span>Services or offers * (one per line)</span>
              <textarea
                value={servicesText}
                onChange={(event) => runIfEditing(onServicesTextChange, event.target.value)}
                placeholder={"Brand strategy\nWebsite design\nConversion optimization"}
                rows={4}
                required
              />
            </label>
          </div>
        </section>
      </>
    );
  }

  function renderStructurePhase() {
    return (
      <StepPageDesign
        value={data.designConfig}
        mode="structure"
        headerMode="compact"
        activePageId={activePageId}
        onActivePageChange={(pageId) => runIfEditing(onActivePageChange, pageId)}
        onChange={(value) => runIfEditing(onFieldChange, { designConfig: value })}
      />
    );
  }

  function renderDesignPhase() {
    return (
      <>
        <StepPageDesign
          value={data.designConfig}
          mode="design"
          headerMode="compact"
          activePageId={activePageId}
          onActivePageChange={(pageId) => runIfEditing(onActivePageChange, pageId)}
          onChange={(value) => runIfEditing(onFieldChange, { designConfig: value })}
        />

        <StepStyleTheme
          data={data}
          onFieldChange={(patch) => runIfEditing(onFieldChange, patch)}
        />

        <details className="website-builder-advanced-details">
          <summary>Optional content and contact details</summary>
          <div className="website-builder-advanced-details-body">
            <StepContentInput
              data={data}
              testimonialsText={testimonialsText}
              socialLinksText={socialLinksText}
              constraintsText={constraintsText}
              onFieldChange={(patch) => runIfEditing(onFieldChange, patch)}
              onTestimonialsChange={(value) => runIfEditing(onTestimonialsChange, value)}
              onSocialLinksChange={(value) => runIfEditing(onSocialLinksChange, value)}
              onConstraintsChange={(value) => runIfEditing(onConstraintsChange, value)}
            />
          </div>
        </details>
      </>
    );
  }

  return (
    <section className="generation-panel" aria-labelledby="generation-inputs-title">
      <div className="website-builder-panel-header">
        <h2 id="generation-inputs-title">Builder tools</h2>
        <p className="wizard-step-description">
          Move through planning, structure, and visual design on the left. The right panel stays
          focused on preview, generation state, and next actions.
        </p>
      </div>

      <nav className="website-builder-phase-stepper" aria-label="Website builder phases">
        {phaseMetadata.map((phase, index) => {
          const isActive = phase.id === activePhase;
          const phaseErrors = phaseStates[phase.id];
          const isComplete = phaseErrors.length === 0;

          return (
            <button
              key={phase.id}
              type="button"
              className={`website-builder-phase-step${isActive ? " is-active" : ""}${isComplete ? " is-complete" : ""}`}
              onClick={() => setActivePhase(phase.id)}
              aria-pressed={isActive}
              aria-current={isActive ? "step" : undefined}
            >
              <span className="website-builder-phase-step-index">{index + 1}</span>
              <span className="website-builder-phase-step-content">
                <strong>{phase.title}</strong>
                <span>{formatPhaseStatus(phaseErrors)}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <section className="wizard-step-panel website-builder-phase-intro" aria-live="polite">
        <div className="website-builder-step-header">
          <div>
            <span className="website-builder-step-label">{currentPhase.label}</span>
            <h3>{currentPhase.title}</h3>
            <p className="wizard-step-description">{currentPhase.description}</p>
          </div>

          <div className="website-builder-step-summary">
            <span className="website-builder-step-summary-label">Phase status</span>
            <strong>{formatPhaseStatus(phaseStates[currentPhase.id])}</strong>
            <span className="website-builder-step-summary-meta">{currentPhase.helper}</span>
          </div>
        </div>
      </section>

      {errors.length > 0 ? (
        <div className="wizard-error" role="alert" aria-live="assertive">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}

      <fieldset
        disabled={!isEditing}
        className={`generation-input-fieldset ${!isEditing ? "generation-readonly" : ""}`.trim()}
      >
        {activePhase === "planning" ? renderPlanningPhase() : null}
        {activePhase === "structure" ? renderStructurePhase() : null}
        {activePhase === "design" ? renderDesignPhase() : null}
      </fieldset>
    </section>
  );
}
