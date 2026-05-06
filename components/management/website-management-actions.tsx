"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PublishAction } from "@/lib/publish";
import { resolveWebsiteManagementControls } from "@/lib/management/controls";
import type { WebsiteManagementRecord } from "@/lib/management/types";
import { WebsiteActionMenu } from "./website-action-menu";
import { WebsiteSettingsEntry } from "./website-settings-entry";

interface WebsiteManagementActionsProps {
  website: WebsiteManagementRecord;
  currentUserId?: string;
  deleting?: boolean;
  renaming?: boolean;
  publishing?: boolean;
  statusBusy?: boolean;
  actionError?: string;
  onRenameOpen: () => void;
  onDeleteOpen: () => void;
  onPublish: (action: PublishAction) => void;
  onStatus: (nextStatus: "archive" | "activate") => void;
}

export function WebsiteManagementActions({
  website,
  currentUserId,
  deleting = false,
  renaming = false,
  publishing = false,
  statusBusy = false,
  actionError,
  onRenameOpen,
  onDeleteOpen,
  onPublish,
  onStatus,
}: WebsiteManagementActionsProps) {
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);

  const controls = useMemo(
    () =>
      resolveWebsiteManagementControls(
        website,
        {
          deleting,
          renaming,
          publishing,
          statusUpdating: statusBusy,
        },
        { currentUserId },
      ),
    [currentUserId, deleting, publishing, renaming, statusBusy, website],
  );

  const publishAction = controls.publishAction;
  const actionsDisabled = controls.disabledByActivity;

  return (
    <div className="website-management-actions">
      <div className="website-list-item-links">
        {controls.permissions.canManage ? <Link href={website.generatedSitePath}>Manage</Link> : <span aria-disabled="true">Manage</span>}
        {controls.permissions.canPreview ? <Link href={website.previewPath}>Preview</Link> : <span aria-disabled="true">Preview</span>}
        {controls.permissions.canEdit ? <Link href={website.editorPath}>Edit</Link> : <span aria-disabled="true">Edit</span>}
        {website.liveUrl ? (
          <a href={website.liveUrl} target="_blank" rel="noreferrer">
            Live site
          </a>
        ) : (
          <span aria-disabled="true">Live site unavailable</span>
        )}
        <WebsiteSettingsEntry href={`${website.generatedSitePath}#settings`} disabled={!controls.permissions.canOpenSettings} />
      </div>

      <div className="website-list-item-actions">
        {publishAction ? (
          <button
            type="button"
            className="wizard-button-secondary"
            disabled={publishAction.disabled}
            title={publishAction.reason}
            onClick={() => setPublishConfirmOpen(true)}
          >
            {publishing ? "Publishing…" : publishAction.label}
          </button>
        ) : null}

        <WebsiteActionMenu
          items={[
            {
              id: "manage",
              label: "Open details",
              href: website.generatedSitePath,
              disabled: !controls.permissions.canManage,
            },
            {
              id: "preview",
              label: "Open preview",
              href: website.previewPath,
              disabled: !controls.permissions.canPreview,
            },
            {
              id: "edit",
              label: "Open editor",
              href: website.editorPath,
              disabled: !controls.permissions.canEdit,
            },
            {
              id: "rename",
              label: "Rename / edit metadata",
              disabled: actionsDisabled || !controls.permissions.canRename,
              onSelect: onRenameOpen,
            },
            controls.statusAction
              ? {
                  id: "status",
                  label: controls.statusAction.label,
                  disabled: controls.statusAction.disabled,
                  onSelect: () => onStatus(controls.statusAction!.nextStatus),
                }
              : {
                  id: "status-disabled",
                  label: "Status action unavailable",
                  disabled: true,
                },
            {
              id: "settings",
              label: "Settings",
              href: `${website.generatedSitePath}#settings`,
              disabled: !controls.permissions.canOpenSettings,
            },
            {
              id: "delete",
              label: "Delete",
              disabled: actionsDisabled || !controls.permissions.canDelete,
              onSelect: onDeleteOpen,
            },
            {
              id: "duplicate",
              label: "Duplicate (coming soon)",
              disabled: true,
            },
          ]}
        />
      </div>

      {publishConfirmOpen && publishAction ? (
        <div className="website-publish-confirm-dialog" role="alertdialog" aria-live="polite">
          <p>
            Confirm {publishAction.action === "publish" ? "publish" : "publish updates"} for <strong>{website.title}</strong>?
          </p>
          <div className="website-publish-confirm-actions">
            <button
              type="button"
              className="wizard-button-secondary"
              disabled={publishing}
              onClick={() => setPublishConfirmOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={publishing || publishAction.disabled}
              onClick={() => {
                onPublish(publishAction.action);
                setPublishConfirmOpen(false);
              }}
            >
              {publishing ? "Processing…" : publishAction.label}
            </button>
          </div>
        </div>
      ) : null}

      {actionError ? <p className="website-management-action-error">{actionError}</p> : null}
    </div>
  );
}
