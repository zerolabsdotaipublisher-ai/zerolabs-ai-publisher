import type { PublishAction } from "@/lib/publish";
import type { WebsiteManagementRecord } from "@/lib/management";
import { PublishStatusSummary } from "@/components/publish/publish-status-summary";
import { WebsiteDeleteDialog } from "./website-delete-dialog";
import { WebsiteDeleteState } from "./website-delete-state";
import { WebsiteRenameDialog } from "./website-rename-dialog";
import { WebsiteStatusBadge } from "./website-status-badge";
import { WebsiteManagementActions } from "./website-management-actions";

interface WebsiteListItemProps {
  website: WebsiteManagementRecord;
  currentUserId?: string;
  deleting: boolean;
  deleteError?: string;
  actionError?: string;
  renameBusy?: boolean;
  statusBusy?: boolean;
  publishBusy?: boolean;
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
  onPublish: (action: PublishAction) => void;
  onStatus: (status: "archive" | "activate") => void;
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
  currentUserId,
  deleting,
  deleteError,
  actionError,
  renameBusy = false,
  statusBusy = false,
  publishBusy = false,
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
  onPublish,
  onStatus,
}: WebsiteListItemProps) {
  const isDeleted = website.status === "deleted";
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
          <dd>{website.publishStatus.uiLabel}</dd>
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
      <PublishStatusSummary status={website.publishStatus} compact />

      <WebsiteManagementActions
        website={website}
        currentUserId={currentUserId}
        deleting={deleting}
        renaming={renameBusy}
        publishing={publishBusy}
        statusBusy={statusBusy}
        actionError={actionError}
        onRenameOpen={onRenameOpen}
        onDeleteOpen={onDeleteOpen}
        onPublish={onPublish}
        onStatus={onStatus}
      />

      <WebsiteRenameDialog
        open={renameOpen}
        initialTitle={website.title}
        initialDescription={website.description}
        busy={renameBusy}
        onCancel={onRenameCancel}
        onSave={onRenameSave}
      />

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
