"use client";

import { useMemo } from "react";
import type { WebsiteWizardInput } from "@/lib/wizard";
import {
  formatPhaseCardMeta,
  getPhaseStateLabel,
  getPhaseStateTone,
  getWebsiteBuilderPhaseStates,
  WEBSITE_BUILDER_PHASES,
  type BuilderPhaseId,
} from "./generation-input-panel";

interface GenerationPhaseNavigatorProps {
  data: WebsiteWizardInput;
  activePhase: BuilderPhaseId;
  onPhaseChange: (phase: BuilderPhaseId) => void;
}

export function GenerationPhaseNavigator({
  data,
  activePhase,
  onPhaseChange,
}: GenerationPhaseNavigatorProps) {
  const phaseStates = useMemo(() => getWebsiteBuilderPhaseStates(data), [data]);

  return (
    <section className="website-builder-phase-navigator" aria-labelledby="website-builder-navigator-title">
      <header className="website-builder-navigator-header">
        <span className="website-builder-workspace-eyebrow">Builder flow</span>
        <h2 id="website-builder-navigator-title">Phase navigator</h2>
        <p>Choose a phase to focus the workspace.</p>
      </header>

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
              onClick={() => onPhaseChange(phase.id)}
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
    </section>
  );
}
