import type { WizardStepDefinition, WizardStepId } from "@/lib/wizard";

interface WizardStepperProps {
  steps: WizardStepDefinition[];
  currentStep: WizardStepId;
  completedSteps: WizardStepId[];
}

export function WizardStepper({ steps, currentStep, completedSteps }: WizardStepperProps) {
  return (
    <ol className="wizard-stepper" aria-label="Wizard steps">
      {steps.map((step, index) => {
        const isCurrent = step.id === currentStep;
        const isComplete = completedSteps.includes(step.id);

        return (
          <li
            key={step.id}
            className={`wizard-stepper-item${isCurrent ? " is-current" : ""}${
              isComplete ? " is-complete" : ""
            }`}
            aria-current={isCurrent ? "step" : undefined}
          >
            <span className="wizard-step-index">{index + 1}</span>
            <span className="wizard-step-title">{step.title}</span>
          </li>
        );
      })}
    </ol>
  );
}
