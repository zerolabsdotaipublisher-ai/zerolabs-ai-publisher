"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { WebsiteDeleteDialog } from "@/components/management/website-delete-dialog";
import { PublishControls } from "@/components/publish/publish-controls";
import { routes } from "@/config/routes";
import type { WebsitePage, WebsiteSection, WebsiteStructure } from "@/lib/ai/structure";
import type { EditorSaveStatus as SaveStatus } from "@/lib/editor";
import { EditorSaveStatus } from "./editor-save-status";

interface EditorActionsPanelProps {
  structure: WebsiteStructure;
  page?: WebsitePage;
  section?: WebsiteSection;
  saveStatus: SaveStatus;
  saveMessage?: string;
  dirty: boolean;
  previewPath: string;
  generatedSitePath: string;
  onSave: () => void | Promise<void>;
}

function formatTimestamp(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return undefined;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

export function EditorActionsPanel({
  structure,
  page,
  section,
  saveStatus,
  saveMessage,
  dirty,
  previewPath,
  generatedSitePath,
  onSave,
}: EditorActionsPanelProps) {
  const router = useRouter();
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [lifecycleError, setLifecycleError] = useState<string>();
  const savedAt = formatTimestamp(structure.updatedAt);
  const isArchived = structure.status === "archived";
  const lifecycleDisabled = dirty || archiveLoading || deleteLoading;

  async function updateStatus(status: "archive" | "activate") {
    setArchiveLoading(true);
    setLifecycleError(undefined);

    try {
      const response = await fetch("/api/websites/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structureId: structure.id, status }),
      });
      const body = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !body.ok) {
        setLifecycleError(body.error || "Unable to update website status.");
        return;
      }

      router.push(routes.websites);
      router.refresh();
    } catch {
      setLifecycleError("Unable to update website status right now.");
    } finally {
      setArchiveLoading(false);
    }
  }

  async function deleteWebsite() {
    setDeleteLoading(true);
    setLifecycleError(undefined);

    try {
      const response = await fetch("/api/websites/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structureId: structure.id }),
      });
      const body = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !body.ok) {
        setLifecycleError(body.error || "Unable to delete this website.");
        return;
      }

      router.push(routes.websites);
      router.refresh();
    } catch {
      setLifecycleError("Unable to delete this website right now.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <section className="editor-action-panel editor-selection-summary" aria-label="Selected content">
        <span className="editor-panel-eyebrow">Selected content</span>
        <h2>{section ? `${section.type} section` : "Choose a section"}</h2>
        <p>
          {section
            ? `Section ${section.order} on ${page?.title || "this page"}. Click supported copy in the canvas to edit it.`
            : "Choose a section in the left panel or preview to edit its content in place."}
        </p>
      </section>

      <section className="editor-action-panel editor-draft-actions" aria-label="Draft actions">
        <div className="editor-action-panel-header">
          <div>
            <span className="editor-panel-eyebrow">Draft</span>
            <h2>Save &amp; preview</h2>
          </div>
          <EditorSaveStatus status={saveStatus} message={saveMessage} dirty={dirty} />
        </div>
        {savedAt ? <p className="editor-last-saved">Last saved {savedAt}</p> : null}
        <button
          className="editor-action-primary"
          type="button"
          onClick={() => { void onSave(); }}
          disabled={saveStatus === "saving"}
        >
          {saveStatus === "saving" ? "Saving draft…" : "Save draft"}
        </button>
        <div className="editor-action-links">
          <Link href={previewPath}>Open preview</Link>
          <Link href={generatedSitePath}>Open generated route</Link>
        </div>
      </section>

      <section className="editor-action-panel editor-publish-panel" aria-label="Publishing actions">
        <div className="editor-action-panel-header">
          <div>
            <span className="editor-panel-eyebrow">Publishing</span>
            <h2>Publish changes</h2>
          </div>
        </div>
        <PublishControls structure={structure} hasUnsavedChanges={dirty} context="editor" />
        <p className="editor-unavailable-action">
          Unpublish is not available in the current publishing workflow.
        </p>
      </section>

      <section className="editor-action-panel editor-lifecycle-panel" aria-label="Website lifecycle actions">
        <div className="editor-action-panel-header">
          <div>
            <span className="editor-panel-eyebrow">Lifecycle</span>
            <h2>Manage website</h2>
          </div>
        </div>
        {dirty ? <p className="editor-lifecycle-note">Save or discard unsaved edits before changing website lifecycle.</p> : null}
        <button
          type="button"
          className="editor-action-secondary"
          disabled={lifecycleDisabled}
          onClick={() => { void updateStatus(isArchived ? "activate" : "archive"); }}
        >
          {archiveLoading ? "Updating…" : isArchived ? "Activate website" : "Archive website"}
        </button>
        <button
          type="button"
          className="editor-action-danger"
          disabled={lifecycleDisabled}
          onClick={() => setDeleteOpen(true)}
        >
          Delete website
        </button>
        {lifecycleError ? <p className="editor-lifecycle-error">{lifecycleError}</p> : null}
        <WebsiteDeleteDialog
          title={structure.siteTitle}
          open={deleteOpen}
          loading={deleteLoading}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => { void deleteWebsite(); }}
        />
      </section>
    </>
  );
}
