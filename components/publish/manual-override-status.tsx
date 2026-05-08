import type { PublishingStatusModel } from "@/lib/publish/status";

interface ManualOverrideStatusProps {
  status: PublishingStatusModel;
}

export function ManualOverrideStatus({ status }: ManualOverrideStatusProps) {
  const override = status.manualOverride;
  if (!override?.overrideUsed) {
    return null;
  }

  return (
    <section className="publish-status-summary publish-status-summary-compact" aria-label="Manual override status">
      <div className="publish-status-summary-header">
        <span className="publish-status-badge publish-status-updating">Manual override used</span>
      </div>
      <p className="publish-status-summary-note">{override.overrideReason}</p>
      <dl className="publish-status-summary-meta">
        <div>
          <dt>When</dt>
          <dd>{new Date(override.overrideTimestamp).toLocaleString()}</dd>
        </div>
        <div>
          <dt>Bypassed</dt>
          <dd>{override.bypassedWorkflows.length ? override.bypassedWorkflows.join(", ") : "none"}</dd>
        </div>
      </dl>
    </section>
  );
}
