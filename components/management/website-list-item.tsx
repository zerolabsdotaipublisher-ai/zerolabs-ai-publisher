import Link from "next/link";
import type { WebsiteManagementRecord } from "@/lib/management";
import { WebsiteDeleteDialog } from "./website-delete-dialog";
import { WebsiteDeleteState } from "./website-delete-state";
import { WebsiteRenamePanel } from "./website-rename-panel";
import { WebsiteStatusBadge } from "./website-status-badge";

interface WebsiteListItemProps {
  website: WebsiteManagementRecord;
  deleting: boolean;
  deleteError?: string;
  renameBusy?: boolean;
  statusBusy?: boolean;
  selected: boolean;
  renameOpen: boolean;
  deleteOpen: boolean;
  disableSelection?: boolean;
  onSelectionChange: (checked: boolean) => void;
  onRenameOpen: () => void;
  onRenameCancel: () => void;
  onRenameSave: (payload: { title: string; description?: string }) => void;
  onDeleteOpen: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
  onArchive: () => void;
  onActivate: () => void;
}

function formatLabel(value: string): string {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .split(" ")
    .filter(Boolean)
    .map((token) => `${token.charAt(0).toUpperCase()}${token.slice(1)}`)
    .join(" ");
}

export function WebsiteListItem({
  website,
  deleting,
  deleteError,
  renameBusy = false,
  statusBusy = false,
  selected,
  renameOpen,
  deleteOpen,
  disableSelection = false,
  onSelectionChange,
  onRenameOpen,
  onRenameCancel,
  onRenameSave,
  onDeleteOpen,
  onDeleteCancel,
  onDeleteConfirm,
  onArchive,
  onActivate,
}: WebsiteListItemProps) {
  const isDeleted = website.status === "deleted";
  const statusActionLabel = website.structureStatus === "archived" ? "Activate" : "Archive";
  const publishLabel = formatLabel(website.publicationState);
  const websiteTypeLabel = formatLabel(website.websiteType);
  const hasSocialSignals = Boolean(website.schedule);

  return (
    <article className="website-list-item">
      <header className="website-list-item-header">
        <label className="website-select-checkbox">
          <input
            type="checkbox"
            checked={selected}
            disabled={disableSelection || isDeleted || deleting}
            onChange={(event) => onSelectionChange(event.target.checked)}
          />
          <span className="sr-only">Select {website.title}</span>
        </label>
        <div>
          <h3>{website.title}</h3>
          {website.description ? <p>{website.description}</p> : null}
        </div>
        <WebsiteStatusBadge status={website.status} />
      </header>

      <dl className="website-list-item-meta">
        <div>
          <dt>Website type</dt>
          <dd>{websiteTypeLabel}</dd>
        </div>
        <div>
          <dt>Publish state</dt>
          <dd>{publishLabel}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{new Date(website.lastUpdatedAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt>Published</dt>
          <dd>{website.lastPublishedAt ? new Date(website.lastPublishedAt).toLocaleString() : "Not published"}</dd>
        </div>
        {website.deletedAt ? (
          <div>
            <dt>Deleted</dt>
            <dd>{new Date(website.deletedAt).toLocaleString()}</dd>
          </div>
        ) : null}
        <div>
          <dt>Schedule</dt>
          <dd>
            {website.schedule?.nextRunAt
              ? `${website.schedule.status} • ${new Date(website.schedule.nextRunAt).toLocaleString()}`
              : website.schedule
                ? website.schedule.status
                : "Not scheduled"}
          </dd>
        </div>
        <div>
          <dt>Social</dt>
          <dd>{hasSocialSignals ? "Schedule-linked" : "No social signal"}</dd>
        </div>
      </dl>

      <div className="website-list-item-links">
        <Link href={website.generatedSitePath}>Manage</Link>
        <Link href={website.previewPath}>Preview</Link>
        <Link href={website.editorPath}>Edit</Link>
        <Link href={`${website.previewPath}?panel=publish`}>Open publish controls</Link>
        <Link href={`${website.generatedSitePath}#content-schedule`}>Schedule</Link>
        {website.liveUrl ? (
          <a href={website.liveUrl} target="_blank" rel="noreferrer">
            Live site
          </a>
        ) : (
          <span aria-disabled="true">Live site unavailable</span>
        )}
      </div>

      <div className="website-list-item-actions">
        <button type="button" className="wizard-button-secondary" onClick={onRenameOpen} disabled={deleting || isDeleted}>
          Rename
        </button>
        <button
          type="button"
          className="wizard-button-secondary"
          onClick={website.structureStatus === "archived" ? onActivate : onArchive}
          disabled={deleting || isDeleted || statusBusy}
        >
          {statusBusy ? "Saving…" : statusActionLabel}
        </button>
        <button type="button" onClick={onDeleteOpen} disabled={deleting || isDeleted}>
          Delete
        </button>
      </div>

      {renameOpen ? (
        <WebsiteRenamePanel
          initialTitle={website.title}
          initialDescription={website.description}
          busy={renameBusy}
          onCancel={onRenameCancel}
          onSave={onRenameSave}
        />
      ) : null}

      <WebsiteDeleteDialog
        title={website.title}
        open={deleteOpen}
        loading={deleting}
        onCancel={onDeleteCancel}
        onConfirm={onDeleteConfirm}
      />
      <WebsiteDeleteState deleting={deleting} error={deleteError} />
    </article>
  );
}
