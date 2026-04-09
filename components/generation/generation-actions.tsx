import Link from "next/link";
import { routes } from "@/config/routes";
import { GenerationPreviewLink } from "./generation-preview-link";

interface GenerationActionsProps {
  isRunning: boolean;
  canRetry: boolean;
  canPreview: boolean;
  previewPath?: string;
  onGenerate: () => void;
  onRetry: () => void;
  onEdit: () => void;
  onReset: () => void;
  onPreviewClick: () => void;
}

export function GenerationActions({
  isRunning,
  canRetry,
  canPreview,
  previewPath,
  onGenerate,
  onRetry,
  onEdit,
  onReset,
  onPreviewClick,
}: GenerationActionsProps) {
  return (
    <section className="wizard-navigation" aria-label="Generation actions">
      <div className="wizard-navigation-actions">
        <button type="button" onClick={onGenerate} disabled={isRunning} aria-busy={isRunning}>
          {isRunning ? "Generating…" : "Generate website"}
        </button>
        {canRetry ? (
          <button type="button" className="wizard-button-secondary" onClick={onRetry} disabled={isRunning}>
            Retry generation
          </button>
        ) : null}
        <button type="button" className="wizard-button-secondary" onClick={onEdit} disabled={isRunning}>
          Edit inputs
        </button>
        <button type="button" className="wizard-button-secondary" onClick={onReset} disabled={isRunning}>
          Reset inputs
        </button>
      </div>
      <div className="wizard-navigation-actions">
        {canPreview ? <GenerationPreviewLink href={previewPath} onClick={onPreviewClick} /> : null}
        <Link href={routes.createWebsite}>Back to wizard</Link>
      </div>
    </section>
  );
}
