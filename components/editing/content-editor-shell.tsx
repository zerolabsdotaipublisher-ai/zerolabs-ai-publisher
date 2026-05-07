"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EditableContentDraft, EditingDetail, EditingValidationIssue } from "@/lib/editing/types";
import { ContentEditingToolbar } from "./content-editing-toolbar";
import { EditorPreviewPanel } from "./editor-preview-panel";
import { InlineTextEditor } from "./inline-text-editor";
import { MediaEditPanel } from "./media-edit-panel";
import { MetadataSeoEditor } from "./metadata-seo-editor";
import { SectionBlockEditor } from "./section-block-editor";

interface ContentEditorShellProps {
  initialDetail: EditingDetail;
}

interface SaveResponse {
  ok: boolean;
  detail?: EditingDetail;
  error?: string;
  validationIssues?: EditingValidationIssue[];
  autoSaved?: boolean;
}

const AUTOSAVE_DEBOUNCE_MS = 2000;

export function ContentEditorShell({ initialDetail }: ContentEditorShellProps) {
  const [detail, setDetail] = useState(initialDetail);
  const [draft, setDraft] = useState<EditableContentDraft>(initialDetail.draft);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [validationIssues, setValidationIssues] = useState<EditingValidationIssue[]>([]);
  const [dirty, setDirty] = useState(false);
  const [changeTick, setChangeTick] = useState(0);
  const autosaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef(draft);

  const contentId = draft.contentId;
  const canAutoSave = draft.capabilities.autosave;

  const statusSummary = useMemo(() => {
    if (validationIssues.length === 0) {
      return undefined;
    }

    return validationIssues.map((issue) => `${issue.field}: ${issue.message}`).join(" • ");
  }, [validationIssues]);

  function applyDraft(next: EditableContentDraft) {
    setDraft(next);
    draftRef.current = next;
    setDirty(true);
    setChangeTick((value) => value + 1);
    setMessage(undefined);
    setError(undefined);
  }

  const runSave = useCallback(async (mode: "save" | "autosave") => {
    if (mode === "save") {
      setSaving(true);
    } else {
      setAutoSaving(true);
    }

    setError(undefined);

    try {
      const response = await fetch(
        mode === "save"
          ? `/api/edit/${encodeURIComponent(contentId)}/save`
          : `/api/edit/${encodeURIComponent(contentId)}/autosave`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draft: draftRef.current }),
        },
      );

      const body = (await response.json()) as SaveResponse;
      if (!response.ok || !body.ok || !body.detail) {
        setValidationIssues(body.validationIssues ?? []);
        setError(
          body.validationIssues?.length
            ? `${body.error || "Validation failed"}: ${body.validationIssues.map((issue) => issue.message).join(", ")}`
            : body.error || "Unable to save draft.",
        );
        return;
      }

      setDetail(body.detail);
      setDraft(body.detail.draft);
      draftRef.current = body.detail.draft;
      setDirty(false);
      setValidationIssues([]);
      setMessage(mode === "save" ? "Draft saved and routed back into review workflow." : "Autosaved.");
    } catch {
      setError(mode === "save" ? "Unable to save draft." : "Autosave failed.");
    } finally {
      setSaving(false);
      setAutoSaving(false);
    }
  }, [contentId]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    if (!canAutoSave || !dirty) {
      return;
    }

    if (autosaveTimeout.current) {
      clearTimeout(autosaveTimeout.current);
    }

    autosaveTimeout.current = setTimeout(() => {
      void runSave("autosave");
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autosaveTimeout.current) {
        clearTimeout(autosaveTimeout.current);
      }
    };
  }, [canAutoSave, dirty, changeTick, runSave]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirty) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  return (
    <section className="content-editor-shell" aria-label="AI generated content editor">
      <header className="content-editor-header">
        <h1>Edit AI Generated Content</h1>
        <p>Edit draft content safely. Publishing updates still require the publish/update workflow.</p>
      </header>

      <ContentEditingToolbar
        saving={saving}
        autoSaving={autoSaving}
        dirty={dirty}
        error={error}
        message={message}
        updatedAt={draft.updatedAt}
        onSave={() => void runSave("save")}
      />

      {statusSummary ? <p className="content-editor-validation-summary">{statusSummary}</p> : null}

      <div className="content-editor-grid">
        <div className="content-editor-main-column">
          <InlineTextEditor
            label="Title"
            value={draft.title}
            disabled={saving || autoSaving}
            onChange={(value) => applyDraft({ ...draft, title: value })}
          />

          <InlineTextEditor
            label="Summary"
            value={draft.summary}
            disabled={saving || autoSaving}
            onChange={(value) => applyDraft({ ...draft, summary: value })}
          />

          <InlineTextEditor
            label="Body"
            value={draft.body}
            disabled={saving || autoSaving}
            onChange={(value) => applyDraft({ ...draft, body: value })}
          />

          <SectionBlockEditor
            sections={draft.sections}
            disabled={saving || autoSaving}
            onChange={(sections) => applyDraft({ ...draft, sections })}
          />

          <MediaEditPanel
            references={draft.media.references}
            disabled={saving || autoSaving}
            onChange={(references) => applyDraft({ ...draft, media: { references } })}
          />

          <MetadataSeoEditor
            metadataSeo={draft.metadataSeo}
            disabled={saving || autoSaving}
            onChange={(metadataSeo) => applyDraft({ ...draft, metadataSeo })}
          />
        </div>

        <div className="content-editor-side-column">
          <EditorPreviewPanel previewHref={draft.previewHref} title={draft.title} />

          <section className="content-editor-version-panel" aria-label="Version and workflow status">
            <h3>Version and review state</h3>
            <p>Type: {draft.type.replaceAll("_", " ")}</p>
            <p>Review state: {draft.reviewState}</p>
            <p>Version: {draft.version.version}</p>
            <p>
              Version snapshot support: {draft.version.snapshotSupport === "full"
                ? "Full snapshot"
                : "Future-ready hook"}
            </p>
            <p>Undo/redo: future-ready</p>
          </section>

          <section className="content-editor-scenarios-panel" aria-label="Editing scenarios and boundaries">
            <h3>MVP boundaries</h3>
            <ul>
              {detail.mvpBoundaries.map((boundary) => (
                <li key={boundary}>{boundary}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </section>
  );
}
