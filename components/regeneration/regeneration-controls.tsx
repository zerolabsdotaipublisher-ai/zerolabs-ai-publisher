"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { EditableContentDraft } from "@/lib/editing/types";
import type {
  RegenerationComparisonSummary,
  RegenerationPreviewResult,
  RegenerationRequest,
  RegenerationSectionOption,
} from "@/lib/regeneration/types";
import { RegenerationComparePanel } from "./regeneration-compare-panel";
import { RegenerationOptionsPanel } from "./regeneration-options-panel";
import { RegenerationResultPreview } from "./regeneration-result-preview";

interface RegenerationControlsProps {
  contentId: string;
  compact?: boolean;
  initialSections?: RegenerationSectionOption[];
}

interface RegenerationMetadataResponse {
  ok: boolean;
  draft?: EditableContentDraft;
  summary?: { sectionOptions: RegenerationSectionOption[] };
  error?: string;
}

interface RegenerationApplyResponse {
  ok: boolean;
  error?: string;
  validationErrors?: string[];
}

function toApplyErrorMessage(response: RegenerationApplyResponse): string {
  if (response.validationErrors?.length) {
    return `${response.error || "Apply failed"}: ${response.validationErrors.join(", ")}`;
  }
  return response.error || "Apply failed";
}

const DEFAULT_REQUEST: RegenerationRequest = {
  level: "full",
  mode: "rewrite",
  target: {},
};

export function RegenerationControls({ contentId, compact = false, initialSections }: RegenerationControlsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [request, setRequest] = useState<RegenerationRequest>(DEFAULT_REQUEST);
  const [currentDraft, setCurrentDraft] = useState<EditableContentDraft>();
  const [sections, setSections] = useState<RegenerationSectionOption[]>(initialSections ?? []);
  const [preview, setPreview] = useState<RegenerationPreviewResult>();

  const loadContext = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`/api/regeneration/${encodeURIComponent(contentId)}`, { method: "GET", cache: "no-store" });
      const body = (await response.json()) as RegenerationMetadataResponse;
      if (!response.ok || !body.ok || !body.draft) {
        setError(body.error || "Unable to load regeneration context.");
        return;
      }
      setCurrentDraft(body.draft);
      setSections(body.summary?.sectionOptions ?? body.draft.sections.map((section) => ({ id: section.id, heading: section.heading })));
    } catch {
      setError("Unable to load regeneration context.");
    }
  }, [contentId]);

  useEffect(() => {
    if (!open) return;
    if (!currentDraft || sections.length === 0) {
      void loadContext();
    }
  }, [contentId, currentDraft, loadContext, open, sections.length]);

  const hasPreview = Boolean(preview?.ok && currentDraft && preview.regeneratedDraft);
  const compare: RegenerationComparisonSummary | undefined = hasPreview ? preview?.compare : undefined;

  async function runPreview(): Promise<void> {
    setLoading(true);
    setError(undefined);
    setMessage(undefined);
    setPreview(undefined);

    try {
      const response = await fetch(`/api/regeneration/${encodeURIComponent(contentId)}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request }),
      });
      const body = (await response.json()) as RegenerationPreviewResult;
      if (!response.ok || !body.ok) {
        setError(body.error || "Regeneration preview failed.");
        return;
      }
      setPreview(body);
      setMessage("Regeneration preview generated. Compare and apply when ready.");
    } catch {
      setError("Regeneration preview failed.");
    } finally {
      setLoading(false);
    }
  }

  async function applyPreview(): Promise<void> {
    if (!preview?.ok || !preview.regeneratedDraft) return;
    setApplying(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const response = await fetch(`/api/regeneration/${encodeURIComponent(contentId)}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: preview.request,
          regeneratedDraft: preview.regeneratedDraft,
        }),
      });
      const body = (await response.json()) as RegenerationApplyResponse;
      if (!response.ok || !body.ok) {
        setError(toApplyErrorMessage(body));
        return;
      }
      setMessage("Regenerated draft applied and saved for review.");
      setCurrentDraft(preview.regeneratedDraft);
      setPreview(undefined);
    } catch {
      setError("Apply failed.");
    } finally {
      setApplying(false);
    }
  }

  const buttonLabel = useMemo(
    () => compact ? "Regenerate" : open ? "Close regeneration" : "Open regeneration controls",
    [compact, open],
  );

  return (
    <section className="regeneration-controls" aria-label="AI regeneration controls">
      <button type="button" onClick={() => setOpen((value) => !value)} disabled={loading || applying}>
        {buttonLabel}
      </button>

      {open ? (
        <div className="regeneration-controls-panel">
          {error ? <p className="regeneration-error">{error}</p> : null}
          {message ? <p className="regeneration-success">{message}</p> : null}

          <RegenerationOptionsPanel request={request} sections={sections} disabled={loading || applying} onChange={setRequest} />

          <div className="regeneration-action-row">
            <button type="button" onClick={() => void runPreview()} disabled={loading || applying}>
              {loading ? "Generating preview..." : "Generate preview"}
            </button>
            <button type="button" onClick={() => void applyPreview()} disabled={applying || loading || !hasPreview}>
              {applying ? "Applying..." : "Apply regenerated draft"}
            </button>
          </div>

          {hasPreview && preview && compare ? (
            <>
              <RegenerationResultPreview draft={preview.regeneratedDraft!} />
              <RegenerationComparePanel before={currentDraft!} after={preview.regeneratedDraft!} compare={compare} />
              {preview.validationErrors.length > 0 ? <p className="regeneration-warning">Validation notes: {preview.validationErrors.join(", ")}</p> : null}
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
