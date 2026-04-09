import type { GenerationInterfaceState } from "@/lib/generation";
import { GenerationErrorState } from "./generation-error-state";
import { GenerationLoadingState } from "./generation-loading-state";
import { GenerationSuccessState } from "./generation-success-state";

const stageLabels: Record<GenerationInterfaceState["stage"], string> = {
  preparing: "Preparing your input package…",
  structure: "Generating structure and layout…",
  content: "Generating content and final metadata…",
  finalizing: "Finalizing your generated website…",
};

interface GenerationStatusPanelProps {
  state: GenerationInterfaceState;
}

export function GenerationStatusPanel({ state }: GenerationStatusPanelProps) {
  return (
    <section className="generation-panel" aria-labelledby="generation-status-title">
      <h2 id="generation-status-title">Generation status</h2>
      {state.submissionStatus === "running" ? (
        <GenerationLoadingState stageLabel={stageLabels[state.stage]} />
      ) : null}
      {state.submissionStatus === "success" ? (
        <GenerationSuccessState structureId={state.result?.structureId} />
      ) : null}
      {state.submissionStatus === "error" ? (
        <GenerationErrorState error={state.result?.error} />
      ) : null}
      {state.submissionStatus === "idle" || state.submissionStatus === "validating" ? (
        <section className="wizard-step-panel" aria-live="polite">
          <h3>Ready to generate</h3>
          <p>Submit inputs to run structure and content generation through the existing AI pipeline.</p>
        </section>
      ) : null}
    </section>
  );
}
