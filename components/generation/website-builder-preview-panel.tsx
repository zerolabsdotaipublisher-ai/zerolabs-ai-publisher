"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import type { PageDesignConfig } from "@/lib/ai/prompts/types";
import {
  AI_GENERATION_NOT_CONFIGURED_MESSAGE,
  GENERATION_GENERIC_FAILURE_MESSAGE,
  GENERATION_RATE_LIMITED_MESSAGE,
  RETRY_STATE_INVALID_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
  WEBSITE_SAVE_FAILED_MESSAGE,
  WEBSITE_SETUP_INVALID_MESSAGE,
  type GenerationDiagnosticCode,
  type GenerationFailedStage,
  type GenerationInterfaceState,
  type GenerationSafeErrorCategory,
} from "@/lib/generation";
import {
  WEBSITE_BRAND_NAME_FALLBACK,
  backgroundStyleOptions,
  getWebsiteDomainSlugValue,
  headingScaleOptions,
  layoutStructureOptions,
  resolveWebsiteIdentity,
} from "@/lib/wizard";

const generationStageDetails = [
  {
    id: "preparing",
    label: "Prepare inputs",
    description: "Check the saved builder inputs before generation starts.",
  },
  {
    id: "structure",
    label: "Build structure",
    description: "Generate the page structure, navigation, and layout plan.",
  },
  {
    id: "content",
    label: "Generate content",
    description: "Write content, metadata, and supporting page details.",
  },
  {
    id: "finalizing",
    label: "Finalize output",
    description: "Save the generated website and prepare the preview route.",
  },
] as const;

function findLabel<T extends string>(
  options: Array<{ value: T; label: string }>,
  value: T,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

function summarizeText(value: string, fallback: string, maxLength = 160): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 3)}...` : trimmed;
}

function sanitizeFailureDescription(error?: string): string | undefined {
  const firstLine = error?.split(/\r?\n/)[0]?.trim();
  if (!firstLine) {
    return undefined;
  }

  const normalized = firstLine.toLowerCase();
  if (
    normalized.startsWith("{") ||
    normalized.startsWith("[") ||
    normalized.includes("stack") ||
    normalized.includes("trace:") ||
    normalized === "generation failed" ||
    normalized === "structure generation failed." ||
    normalized === "content generation failed."
  ) {
    return undefined;
  }

  return firstLine.length > 220 ? `${firstLine.slice(0, 217)}...` : firstLine;
}

function formatTimestamp(value?: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString();
}

function parseHexColor(value: string): [number, number, number] | null {
  const normalized = value.trim();
  const shortMatch = normalized.match(/^#([0-9a-f]{3})$/i);
  if (shortMatch) {
    return shortMatch[1]
      .split("")
      .map((channel) => Number.parseInt(channel + channel, 16)) as [number, number, number];
  }

  const fullMatch = normalized.match(/^#([0-9a-f]{6})$/i);
  if (!fullMatch) {
    return null;
  }

  return [
    Number.parseInt(fullMatch[1].slice(0, 2), 16),
    Number.parseInt(fullMatch[1].slice(2, 4), 16),
    Number.parseInt(fullMatch[1].slice(4, 6), 16),
  ];
}

function relativeLuminance(value: string): number | null {
  const rgb = parseHexColor(value);
  if (!rgb) {
    return null;
  }

  const channels = rgb.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function resolvePreviewTextColor(value: string, fallback: string): string {
  const luminance = relativeLuminance(value);
  if (luminance === null) {
    return fallback;
  }

  return luminance < 0.28 ? fallback : value;
}

function buildPreviewStyle(page: PageDesignConfig): CSSProperties {
  const primaryColor = page.background.primaryColor || "#0f352b";
  const secondaryColor = page.background.secondaryColor || "#145340";

  switch (page.background.type) {
    case "solid":
      return {
        background: primaryColor,
      };
    case "blend":
      return {
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
      };
    case "gradient":
      return {
        background: `linear-gradient(${page.background.gradientDirection || "135deg"}, ${primaryColor}, ${secondaryColor})`,
      };
    case "image":
      return page.background.imageUrl
        ? {
            backgroundImage: `linear-gradient(180deg, rgba(7, 26, 21, 0.2), rgba(7, 26, 21, 0.78)), url(${page.background.imageUrl})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }
        : {
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          };
    case "video":
      return {
        background: `linear-gradient(135deg, rgba(7, 26, 21, 0.78), rgba(15, 53, 43, 0.92)), linear-gradient(45deg, ${primaryColor}, ${secondaryColor})`,
      };
    default:
      return {
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
      };
  }
}

function getWorkflowStatus(state: GenerationInterfaceState, readinessErrors: string[]) {
  if (state.submissionStatus === "running") {
    return {
      label: "Generating",
      tone: "running",
      description: "Structure and content generation are in progress.",
    };
  }

  if (state.submissionStatus === "success" && state.result?.generatedSitePath) {
    return {
      label: "Generated",
      tone: "success",
      description: "Your generated website is ready to continue into preview.",
    };
  }

  if (state.submissionStatus === "error") {
    return {
      label: "Failed",
      tone: "error",
      description: "Generation stopped, but your inputs and live page preview are still available.",
    };
  }

  if (readinessErrors.length > 0) {
    return {
      label: "Not ready",
      tone: "idle",
      description: "Complete the required inputs before generating.",
    };
  }

  return {
    label: "Ready to generate",
    tone: "ready",
    description: "Inputs are complete and ready for the generation pipeline.",
  };
}

function classifyGenerationFailure(args: {
  error?: string;
  diagnosticCode?: GenerationDiagnosticCode;
  requestId?: string;
  failedStage?: GenerationFailedStage;
  safeErrorCategory?: GenerationSafeErrorCategory;
}) {
  const { diagnosticCode, error, requestId, failedStage, safeErrorCategory } = args;
  const safeDescription = sanitizeFailureDescription(error);
  const normalized = (error ?? "").toLowerCase();
  const isRateLimited =
    normalized.includes("429") ||
    normalized.includes("rate limit") ||
    normalized.includes("rate-limit") ||
    normalized.includes("rate-limited") ||
    normalized.includes("quota") ||
    normalized.includes("too many requests");
  const isValidationIssue =
    normalized.includes("required") ||
    normalized.includes("missing") ||
    normalized.includes("invalid input") ||
    normalized.includes("choose ") ||
    normalized.includes("add ") ||
    normalized.includes("need attention");

  const referenceId = requestId?.trim() ? requestId.trim() : undefined;

  if (diagnosticCode === "RETRY_UNAVAILABLE") {
    return {
      title: "Retry needs the last saved generation input",
      description: RETRY_STATE_INVALID_MESSAGE,
      guidance: "Review the current inputs, then start generation again.",
      referenceId: undefined,
    };
  }

  if (
    diagnosticCode === "UNAUTHORIZED" ||
    safeErrorCategory === "session-expired" ||
    failedStage === "auth"
  ) {
    return {
      title: "Your session needs to be refreshed",
      description: SESSION_EXPIRED_MESSAGE,
      guidance: "Sign in again, then retry generation.",
      referenceId: undefined,
    };
  }

  if (
    diagnosticCode === "STRUCTURE_NOT_FOUND" ||
    diagnosticCode === "STRUCTURE_ID_REQUIRED" ||
    safeErrorCategory === "retry-state-invalid" ||
    failedStage === "retry-state"
  ) {
    return {
      title: "The saved website draft could not be resumed",
      description: RETRY_STATE_INVALID_MESSAGE,
      guidance: "Review the inputs and start generation again.",
      referenceId,
    };
  }

  if (
    diagnosticCode === "SUPABASE_SCHEMA_MISSING" ||
    diagnosticCode === "SUPABASE_STORAGE_ERROR" ||
    safeErrorCategory === "database-save-failed" ||
    failedStage === "database-save"
  ) {
    return {
      title: "We couldn't save the generated website yet",
      description: WEBSITE_SAVE_FAILED_MESSAGE,
      guidance: "Your inputs are still saved. Retry generation in a moment.",
      referenceId,
    };
  }

  if (
    diagnosticCode === "OPENAI_REQUEST_REJECTED" ||
    diagnosticCode === "OPENAI_UPSTREAM_ERROR" ||
    safeErrorCategory === "ai-request-failed" ||
    safeErrorCategory === "ai-response-invalid" ||
    failedStage === "openai-request" ||
    failedStage === "openai-response-parse"
  ) {
    return {
      title: "The AI generation service could not complete this request",
      description: safeDescription ?? GENERATION_GENERIC_FAILURE_MESSAGE,
      guidance: "Your inputs are still saved. Retry in a moment.",
      referenceId,
    };
  }

  if (
    diagnosticCode === "OPENAI_AUTH_INVALID" ||
    safeErrorCategory === "ai-not-configured" ||
    failedStage === "openai-config"
  ) {
    return {
      title: "Generation configuration needs attention",
      description: AI_GENERATION_NOT_CONFIGURED_MESSAGE,
      guidance: "Add or correct the server-side OpenAI configuration, then retry generation.",
      referenceId,
    };
  }

  if (
    diagnosticCode === "OPENAI_RATE_LIMITED" ||
    safeErrorCategory === "ai-rate-limited" ||
    isRateLimited
  ) {
    return {
      title: "Generation is temporarily rate-limited",
      description: GENERATION_RATE_LIMITED_MESSAGE,
      guidance: "Your inputs are still saved. Wait a moment, then retry generation.",
      referenceId,
    };
  }

  if (
    diagnosticCode === "INVALID_INPUT" ||
    safeErrorCategory === "payload-invalid" ||
    failedStage === "payload-validation" ||
    isValidationIssue
  ) {
    return {
      title: "Some inputs need attention",
      description: WEBSITE_SETUP_INVALID_MESSAGE,
      guidance: "Review the required inputs on the left, then retry generation.",
      referenceId: undefined,
    };
  }

  return {
    title: "We couldn't generate the website yet",
    description: safeDescription ?? GENERATION_GENERIC_FAILURE_MESSAGE,
    guidance: "Your page setup is still available. You can retry now or continue editing.",
    referenceId,
  };
}

function getGenerationStageState(
  currentStage: GenerationInterfaceState["stage"],
  stageId: typeof generationStageDetails[number]["id"],
): "complete" | "current" | "upcoming" {
  const currentIndex = generationStageDetails.findIndex((stage) => stage.id === currentStage);
  const stageIndex = generationStageDetails.findIndex((stage) => stage.id === stageId);

  if (stageIndex < currentIndex) {
    return "complete";
  }

  if (stageIndex === currentIndex) {
    return "current";
  }

  return "upcoming";
}

interface WebsiteBuilderPreviewPanelProps {
  state: GenerationInterfaceState;
  activePage?: PageDesignConfig;
  activePageIndex: number;
  totalPages: number;
  readinessErrors: string[];
  onGenerate: () => void;
  onRetry: () => void;
  onReviewInputs: () => void;
  onEditInputs: () => void;
  onPreviewClick: () => void;
}

export function WebsiteBuilderPreviewPanel({
  state,
  activePage,
  activePageIndex,
  totalPages,
  readinessErrors,
  onGenerate,
  onRetry,
  onReviewInputs,
  onEditInputs,
  onPreviewClick,
}: WebsiteBuilderPreviewPanelProps) {
  const identity = resolveWebsiteIdentity(state.input);
  const websiteNameLabel = identity.brandName || WEBSITE_BRAND_NAME_FALLBACK;
  const domainSlugValue = getWebsiteDomainSlugValue(state.input);
  const workflowStatus = getWorkflowStatus(state, readinessErrors);
  const failureState = classifyGenerationFailure({
    error: state.result?.error,
    diagnosticCode: state.result?.diagnosticCode,
    requestId: state.result?.requestId,
    failedStage: state.result?.failedStage,
    safeErrorCategory: state.result?.safeErrorCategory,
  });
  const pageLayout = activePage
    ? findLabel(layoutStructureOptions, activePage.layout)
    : "Not selected";
  const pageBackground = activePage
    ? findLabel(backgroundStyleOptions, activePage.background.type)
    : "Not selected";
  const headingScale = activePage
    ? findLabel(headingScaleOptions, activePage.headings.headingScale)
    : "Not selected";
  const completedAt = formatTimestamp(state.result?.completedAt);
  const previewStyle = activePage ? buildPreviewStyle(activePage) : undefined;
  const promptSummary = activePage
    ? summarizeText(activePage.contentPrompt, "Add a page content prompt to shape this page.")
    : "Add a page to preview its design settings.";
  const previewHeadingColor = activePage
    ? resolvePreviewTextColor(activePage.headings.headingColor, "#f8f9fa")
    : "#f8f9fa";
  const previewBodyColor = activePage
    ? resolvePreviewTextColor(activePage.typography.bodyColor, "rgba(248, 249, 250, 0.9)")
    : "rgba(248, 249, 250, 0.9)";
  const previewAccentColor = activePage?.background.secondaryColor || activePage?.background.primaryColor || "#ade6cd";
  const currentStage =
    generationStageDetails.find((stage) => stage.id === state.stage) ?? generationStageDetails[0];
  const showMissingRequirements = workflowStatus.label === "Not ready" && readinessErrors.length > 0;

  return (
    <section className="generation-panel" aria-labelledby="website-builder-preview-title">
      <section className="wizard-step-panel website-generation-status" aria-live="polite" aria-atomic="true">
        <div className="website-generation-status-header">
          <div>
            <span className="website-builder-step-label">Step 3</span>
            <h2 id="website-builder-preview-title">Review and generate</h2>
            <p className="wizard-step-description">{workflowStatus.description}</p>
          </div>
          <span
            className={`website-generation-status-badge is-${workflowStatus.tone}`}
            aria-label={`Generation status: ${workflowStatus.label}`}
          >
            {workflowStatus.label}
          </span>
        </div>

        <div className="website-generation-context">
          <span className="website-preview-chip">{`Pages planned: ${totalPages}`}</span>
          <span className="website-preview-chip">{`Current page: ${activePageIndex + 1} of ${totalPages}`}</span>
          <span className="website-preview-chip">{`Editing: ${activePage?.name || "Untitled page"}`}</span>
          {state.input.brandName ? (
            <span className="website-preview-chip">{`Brand: ${state.input.brandName}`}</span>
          ) : null}
          {state.input.domainName ? (
            <span className="website-preview-chip">{`Domain: ${state.input.domainName}`}</span>
          ) : null}
        </div>

        {showMissingRequirements ? (
          <div className="website-generation-status-list-wrap">
            <p className="website-generation-status-list-label">Missing requirements</p>
            <ul className="website-generation-status-list" id="website-generation-missing-requirements">
              {readinessErrors.map((error) => (
              <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="website-generation-actions" aria-label="Website generation actions">
        <button
          type="button"
          className="website-action-button is-primary"
          onClick={onGenerate}
          disabled={state.submissionStatus === "running"}
          aria-busy={state.submissionStatus === "running"}
          aria-describedby={showMissingRequirements ? "website-generation-missing-requirements" : undefined}
        >
          {state.submissionStatus === "running" ? "Generating website..." : "Generate website"}
        </button>

        {state.result?.generatedSitePath ? (
          <Link
            href={state.result.generatedSitePath}
            className="website-action-button is-primary"
            onClick={onPreviewClick}
          >
            Continue to preview
          </Link>
        ) : null}

        {state.submissionStatus === "error" ? (
          <button
            type="button"
            className="website-action-button is-secondary"
            onClick={onRetry}
          >
            Retry generation
          </button>
        ) : null}

        <button
          type="button"
          className="website-action-button is-secondary"
          onClick={onReviewInputs}
          disabled={state.submissionStatus === "running"}
        >
          Review inputs
        </button>

        <button
          type="button"
          className="website-action-button is-muted"
          onClick={onEditInputs}
          disabled={state.submissionStatus === "running"}
        >
          Edit inputs
        </button>
      </section>

      {state.submissionStatus === "running" ? (
        <section
          className="website-preview-card website-preview-status-card"
          aria-live="polite"
          aria-busy="true"
          role="status"
        >
          <h3>Generation status</h3>
          <p>{currentStage.description}</p>

          <ol className="website-generation-stage-list" aria-label="Generation progress">
            {generationStageDetails.map((stage) => {
              const stageState = getGenerationStageState(state.stage, stage.id);
              const stageStateLabel =
                stageState === "complete"
                  ? "Complete"
                  : stageState === "current"
                    ? "Current"
                    : "Upcoming";

              return (
                <li
                  key={stage.id}
                  className={`website-generation-stage-item is-${stageState}`}
                >
                  <div>
                    <strong>{stage.label}</strong>
                    <span>{stage.description}</span>
                  </div>
                  <span className="website-generation-stage-state">{stageStateLabel}</span>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {state.submissionStatus === "error" && state.result?.error ? (
        <section className="wizard-error website-generation-status" role="alert" aria-live="assertive">
          <p className="website-generation-status-label">Generation failed</p>
          <h3>{failureState.title}</h3>
          <p>{failureState.description}</p>
          <p>{failureState.guidance}</p>
          {failureState.referenceId ? (
            <p className="website-generation-status-reference">
              Reference ID: {failureState.referenceId}
            </p>
          ) : null}

          <div className="website-generation-failure-actions">
            <button
              type="button"
              className="website-action-button is-secondary"
              onClick={onRetry}
            >
              Retry generation
            </button>
            <button
              type="button"
              className="website-action-button is-muted"
              onClick={onEditInputs}
            >
              Edit inputs
            </button>
          </div>
        </section>
      ) : null}

      {state.submissionStatus === "success" && state.result?.generatedSitePath ? (
        <section className="website-preview-card">
          <div className="website-preview-card-header">
            <div>
              <h3>Generated output</h3>
              <p className="wizard-step-description">
                The latest generated website is ready for preview and follow-up edits.
              </p>
            </div>
          </div>

          <dl className="website-preview-summary">
            <div>
              <dt>Structure ID</dt>
              <dd>{state.result.structureId ?? "Pending"}</dd>
            </div>
            <div>
              <dt>Preview route</dt>
              <dd>{state.result.generatedSitePath}</dd>
            </div>
            <div>
              <dt>Generated at</dt>
              <dd>{completedAt ?? "Just now"}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>Ready to continue</dd>
            </div>
          </dl>
        </section>
      ) : null}

      <section className="website-preview-card">
        <div className="website-preview-card-header">
          <div>
            <h3>Live design preview</h3>
            <p className="wizard-step-description">
              The preview below updates from the currently selected page settings, even before generation.
            </p>
          </div>
        </div>

        {activePage ? (
          <>
            <div className="website-preview-chip-row" aria-label="Active page summary">
              <span className="website-preview-chip">{`Page: ${activePage.name || "Untitled page"}`}</span>
              <span className="website-preview-chip">{`Layout: ${pageLayout}`}</span>
              <span className="website-preview-chip">{`Background: ${pageBackground}`}</span>
            </div>

            <div className="website-preview-card-hero" style={previewStyle}>
              <div className="website-preview-card-overlay">
                <div className="website-preview-browser-bar" aria-hidden="true">
                  <div className="website-preview-browser-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="website-preview-browser-meta">
                    <strong>{websiteNameLabel}</strong>
                    <span>{domainSlugValue}</span>
                  </div>
                </div>

                <span className="website-preview-eyebrow">{`Page ${activePageIndex + 1}`}</span>
                <h4
                  style={{
                    color: previewHeadingColor,
                    fontFamily: activePage.headings.headingFont,
                    fontWeight: activePage.headings.headingWeight,
                  }}
                >
                  {activePage.name || "Active page"}
                </h4>
                <p
                  style={{
                    color: previewBodyColor,
                    fontFamily: activePage.typography.bodyFont,
                  }}
                >
                  {summarizeText(
                    activePage.contentPrompt,
                    "Use the content prompt to shape the page story and key sections.",
                    120,
                  )}
                </p>

                <div className="website-preview-scene">
                  <div className="website-preview-mini-frame">
                    <div className="website-preview-mini-nav">
                      <span className="website-preview-mini-pill" />
                      <span className="website-preview-mini-pill" />
                      <span className="website-preview-mini-pill is-short" />
                    </div>
                    <span
                      className="website-preview-mini-heading"
                      style={{ background: previewHeadingColor }}
                    />
                    <span
                      className="website-preview-mini-line is-wide"
                      style={{ background: previewBodyColor }}
                    />
                    <span
                      className="website-preview-mini-line"
                      style={{ background: previewBodyColor }}
                    />
                    <div className="website-preview-mini-grid">
                      <span style={{ background: previewBodyColor }} />
                      <span style={{ background: previewBodyColor }} />
                      <span style={{ background: previewBodyColor }} />
                    </div>
                    <span
                      className="website-preview-mini-accent"
                      style={{ background: previewHeadingColor }}
                    />
                  </div>

                  <div className="website-preview-side-panel" aria-hidden="true">
                    <span className="website-preview-side-label">Style direction</span>
                    <strong>{pageLayout}</strong>
                    <p>{`${pageBackground} / ${headingScale}`}</p>
                    <div className="website-preview-side-swatches">
                      <span style={{ background: activePage.background.primaryColor }} />
                      <span style={{ background: previewAccentColor }} />
                      <span style={{ background: activePage.headings.headingColor }} />
                    </div>
                    <div className="website-preview-side-copy">
                      <span>{activePage.typography.fontMood}</span>
                      <span>{activePage.typography.bodyFont}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <dl className="website-preview-summary">
              <div>
                <dt>Active page</dt>
                <dd>{activePage.name || "Untitled page"}</dd>
              </div>
              <div>
                <dt>Layout</dt>
                <dd>{pageLayout}</dd>
              </div>
              <div>
                <dt>Background style</dt>
                <dd>{pageBackground}</dd>
              </div>
              <div>
                <dt>Total pages</dt>
                <dd>{totalPages}</dd>
              </div>
              <div>
                <dt>Website name</dt>
                <dd>{websiteNameLabel}</dd>
              </div>
              <div>
                <dt>Domain</dt>
                <dd>{domainSlugValue}</dd>
              </div>
              <div>
                <dt>Body font</dt>
                <dd>{activePage.typography.bodyFont}</dd>
              </div>
              <div>
                <dt>Body color</dt>
                <dd>{activePage.typography.bodyColor}</dd>
              </div>
              <div>
                <dt>Font mood</dt>
                <dd>{activePage.typography.fontMood}</dd>
              </div>
              <div>
                <dt>Heading font</dt>
                <dd>{activePage.headings.headingFont}</dd>
              </div>
              <div>
                <dt>Heading scale</dt>
                <dd>{headingScale}</dd>
              </div>
              <div>
                <dt>Heading weight</dt>
                <dd>{activePage.headings.headingWeight}</dd>
              </div>
              <div className="is-wide">
                <dt>Content prompt summary</dt>
                <dd>{promptSummary}</dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="wizard-step-description">
            Add or restore at least one page to see the live preview and summary here.
          </p>
        )}
      </section>
    </section>
  );
}
