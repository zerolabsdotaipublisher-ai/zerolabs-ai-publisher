"use client";

import type { WebsiteStructure } from "@/lib/ai/structure";
import { PublishControls } from "@/components/publish/publish-controls";

interface PreviewOwnerControlsProps {
  structure: WebsiteStructure;
}

export function PreviewOwnerControls({ structure }: PreviewOwnerControlsProps) {
  return (
    <details className="preview-owner-panel">
      <summary className="preview-owner-panel-summary">
        <span className="preview-owner-panel-eyebrow">Owner controls</span>
        <strong>Publishing and live-site tools</strong>
        <span className="preview-owner-panel-copy">
          Hidden by default so the customer preview stays front and center.
        </span>
      </summary>
      <div className="preview-owner-panel-body">
        <PublishControls structure={structure} context="preview" />
      </div>
    </details>
  );
}
