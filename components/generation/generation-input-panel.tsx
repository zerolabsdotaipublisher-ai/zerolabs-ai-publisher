"use client";

import { useMemo } from "react";
import { StepContentInput } from "@/components/wizard/steps/step-content-input";
import { StepPageDesign } from "@/components/wizard/steps/step-page-design";
import { StepPagesSetup } from "@/components/wizard/steps/step-pages-setup";
import { StepStyleTheme } from "@/components/wizard/steps/step-style-theme";
import { StepWebsiteIdentity } from "@/components/wizard/steps/step-website-identity";
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
  socialLinksText: string;
  constraintsText: string;
  errors: string[];
  isEditing: boolean;
  activePhase: BuilderPhaseId;
  showPhaseNavigator?: boolean;
  activePageId?: string;
  onPhaseChange?: (phase: BuilderPhaseId) => void;
  onActivePageChange: (pageId: string) => void;
  onFieldChange: (patch: WebsiteWizardInputPatch) => void;
  onSocialLinksChange: (value: string) => void;
  onConstraintsChange: (value: string) => void;
}

export type BuilderPhaseId = "planning" | "structure" | "design";

export interface BuilderPhaseMetadata {
  id: BuilderPhaseId;
  label: string;
  title: string;
  cardDescription: string;
  description: string;
  helper: string;
}

export const WEBSITE_BUILDER_PHASES: BuilderPhaseMetadata[] = [
  {
    id: "planning",
    label: "Phase 1",
    title: "Plan",
    cardDescription: "Set pages, names, and website identity.",
    description:
      "Set pages, names, and website identity before you move into layout and styling.",
    helper:
      "Define the website foundation first, then move into build and design decisions.",
  },
  {
    id: "structure",
    label: "Phase 2",
    title: "Build",
    cardDescription: "Create the page structure and layout.",
    description:
      "Create the page structure and layout for each page before final visual refinement.",
    helper:
      "Each page stays independently editable, and layout choices here flow into the generation payload.",
  },
  {
    id: "design",
    label: "Phase 3",
    title: "Design",
    cardDescription: "Refine visuals, typography, and styling.",
    description:
      "Refine visuals, typography, and styling across each page, then add broader creative direction if needed.",
    helper:
      "Visual settings stay page-specific, and optional content details remain available without cluttering the main flow.",
  },
];

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

export function formatPhaseStatus(errors: string[]): string {
  if (errors.length === 0) {
    return "Done";
  }

  return `${errors.length} ${errors.length === 1 ? "item" : "items"} left`;
}

export function formatPhaseCardMeta(errors: string[]): string {
  if (errors.length === 0) {
    return "All required inputs complete.";
  }

  return `${errors.length} required ${errors.length === 1 ? "item left" : "items left"}.`;
}

export function getPhaseStateLabel(isActive: boolean, errors: string[]): string {
  if (isActive) {
    return "Active";
  }

  if (errors.length === 0) {
    return "Done";
  }

  return "Pending";
}

export function getPhaseStateTone(isActive: boolean, errors: string[]): "current" | "ready" | "attention" {
  if (isActive) {
    return "current";
  }

  if (errors.length === 0) {
    return "ready";
  }

  return "attention";
}

export function getWebsiteBuilderPhaseStates(data: WebsiteWizardInput): Record<BuilderPhaseId, string[]> {
  return {
    planning: [...validatePageSetupStep(data), ...validateBusinessInfoStep(data)],
    structure: validateStructurePhase(data),
    design: validateDesignPhase(data),
  };
}

export function GenerationInputPanel({
  data,
  socialLinksText,
  constraintsText,
  errors,
  isEditing,
  activePhase,
  showPhaseNavigator = false,
  activePageId,
  onPhaseChange,
  onActivePageChange,
  onFieldChange,
  onSocialLinksChange,
  onConstraintsChange,
}: GenerationInputPanelProps) {
  const phaseStates = useMemo(() => {
    return getWebsiteBuilderPhaseStates(data);
  }, [data]);

  const currentPhase =
    WEBSITE_BUILDER_PHASES.find((phase) => phase.id === activePhase) ?? WEBSITE_BUILDER_PHASES[0];
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
          errors={errors}
          onChange={(value) => runIfEditing(onFieldChange, { designConfig: value })}
        />
        <StepWebsiteIdentity
          data={data}
          errors={[]}
          onFieldChange={(patch) => runIfEditing(onFieldChange, patch)}
        />
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
        errors={errors}
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
          errors={errors}
          onActivePageChange={(pageId) => runIfEditing(onActivePageChange, pageId)}
          onChange={(value) => runIfEditing(onFieldChange, { designConfig: value })}
        />

        <StepStyleTheme
          data={data}
          errors={errors}
          onFieldChange={(patch) => runIfEditing(onFieldChange, patch)}
        />

        <details className="website-builder-advanced-details">
          <summary>Optional content and contact details</summary>
          <div className="website-builder-advanced-details-body">
            <StepContentInput
              data={data}
              socialLinksText={socialLinksText}
              constraintsText={constraintsText}
              errors={errors}
              onFieldChange={(patch) => runIfEditing(onFieldChange, patch)}
              onSocialLinksChange={(value) => runIfEditing(onSocialLinksChange, value)}
              onConstraintsChange={(value) => runIfEditing(onConstraintsChange, value)}
            />
          </div>
        </details>
      </>
    );
  }

  function renderActivePhase() {
    switch (activePhase) {
      case "structure":
        return renderStructurePhase();
      case "design":
        return renderDesignPhase();
      case "planning":
      default:
        return renderPlanningPhase();
    }
  }

  return (
    <section
      className={`generation-panel${showPhaseNavigator ? "" : " website-builder-workspace"}`}
      aria-labelledby="generation-inputs-title"
    >
      <div className="website-builder-panel-header">
        {showPhaseNavigator ? (
          <>
            <h2 id="generation-inputs-title">Builder tools</h2>
            <p className="wizard-step-description">
              Move through plan, build, and design on the left. The right panel stays focused on preview, generation state, and next actions.
            </p>
          </>
        ) : (
          <>
            <span className="website-builder-workspace-eyebrow">Active builder workspace</span>
            <h2 id="generation-inputs-title">{currentPhase.title}</h2>
            <p className="wizard-step-description">
              Work through the selected phase here. Your review, generation status, and next actions stay in the preview rail.
            </p>
          </>
        )}
      </div>

      {showPhaseNavigator ? (
        <nav className="website-builder-phase-stepper" aria-label="Website builder phases">
          {WEBSITE_BUILDER_PHASES.map((phase, index) => {
            const isActive = phase.id === activePhase;
            const phaseErrors = phaseStates[phase.id];
            const isComplete = phaseErrors.length === 0;
            const stateLabel = getPhaseStateLabel(isActive, phaseErrors);
            const stateTone = getPhaseStateTone(isActive, phaseErrors);
            const phaseSummaryId = `website-builder-phase-${phase.id}-summary`;

            return (
              <button
                key={phase.id}
                type="button"
                className={`website-builder-phase-step${isActive ? " is-active" : ""}${isComplete ? " is-complete" : ""}`}
                data-state={stateTone}
                onClick={() => onPhaseChange?.(phase.id)}
                aria-pressed={isActive}
                aria-current={isActive ? "step" : undefined}
                aria-describedby={phaseSummaryId}
              >
                <span className="website-builder-phase-step-index">{index + 1}</span>
                <span className="website-builder-phase-step-content">
                  <span className="website-builder-phase-step-eyebrow">{phase.label}</span>
                  <strong>{phase.title}</strong>
                  <span className="website-builder-phase-step-description">{phase.cardDescription}</span>
                  <span className="website-builder-phase-step-meta" id={phaseSummaryId}>
                    {formatPhaseCardMeta(phaseErrors)}
                  </span>
                </span>
                <span className="website-builder-phase-step-status">{stateLabel}</span>
              </button>
            );
          })}
        </nav>
      ) : null}

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
        <section
          className="wizard-error website-builder-error-summary"
          role="alert"
          aria-live="assertive"
          aria-labelledby="website-builder-error-summary-title"
        >
          <h3 id="website-builder-error-summary-title">Review these required items</h3>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <fieldset
        disabled={!isEditing}
        className={`generation-input-fieldset ${!isEditing ? "generation-readonly" : ""}`.trim()}
      >
        {renderActivePhase()}
      </fieldset>
    </section>
  );
}
