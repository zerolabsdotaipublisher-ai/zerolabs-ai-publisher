import type { PublishAction } from "@/lib/publish";
import type { WebsiteManagementRecord } from "@/lib/management/types";
import { WebsiteListItem } from "./website-list-item";

interface WebsiteListProps {
  websites: WebsiteManagementRecord[];
  currentUserId?: string;
  selectedIds: string[];
  deletingId?: string;
  renameId?: string;
  deleteDialogId?: string;
  renameBusyId?: string;
  statusBusyId?: string;
  publishBusyId?: string;
  deleteErrorById: Record<string, string | undefined>;
  actionErrorById: Record<string, string | undefined>;
  onSelectionChange: (id: string, checked: boolean) => void;
  onRenameOpen: (id: string) => void;
  onRenameCancel: () => void;
  onRenameSave: (id: string, payload: { title: string; description?: string }) => void;
  onDeleteOpen: (id: string) => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: (id: string) => void;
  onPublish: (id: string, action: PublishAction) => void;
  onStatus: (id: string, status: "archive" | "activate") => void;
}

export function WebsiteList({
  websites,
  currentUserId,
  selectedIds,
  deletingId,
  renameId,
  deleteDialogId,
  renameBusyId,
  statusBusyId,
  publishBusyId,
  deleteErrorById,
  actionErrorById,
  onSelectionChange,
  onRenameOpen,
  onRenameCancel,
  onRenameSave,
  onDeleteOpen,
  onDeleteCancel,
  onDeleteConfirm,
  onPublish,
  onStatus,
}: WebsiteListProps) {
  return (
    <div className="website-list" role="list">
      {websites.map((website) => (
        <WebsiteListItem
          key={website.id}
          website={website}
          currentUserId={currentUserId}
          selected={selectedIds.includes(website.id)}
          deleting={deletingId === website.id}
          deleteError={deleteErrorById[website.id]}
          actionError={actionErrorById[website.id]}
          renameOpen={renameId === website.id}
          deleteOpen={deleteDialogId === website.id}
          renameBusy={renameBusyId === website.id}
          statusBusy={statusBusyId === website.id}
          publishBusy={publishBusyId === website.id}
          onSelectionChange={(checked) => onSelectionChange(website.id, checked)}
          onRenameOpen={() => onRenameOpen(website.id)}
          onRenameCancel={onRenameCancel}
          onRenameSave={(payload) => onRenameSave(website.id, payload)}
          onDeleteOpen={() => onDeleteOpen(website.id)}
          onDeleteCancel={onDeleteCancel}
          onDeleteConfirm={() => onDeleteConfirm(website.id)}
          onPublish={(action) => onPublish(website.id, action)}
          onStatus={(status) => onStatus(website.id, status)}
        />
      ))}
    </div>
  );
}
