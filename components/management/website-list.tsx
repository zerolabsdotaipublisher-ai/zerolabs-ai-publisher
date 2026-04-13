import type { WebsiteManagementRecord } from "@/lib/management";
import { WebsiteListItem } from "./website-list-item";

interface WebsiteListProps {
  websites: WebsiteManagementRecord[];
  selectedIds: string[];
  deletingId?: string;
  renameId?: string;
  deleteDialogId?: string;
  renameBusyId?: string;
  statusBusyId?: string;
  deleteErrorById: Record<string, string | undefined>;
  onSelectionChange: (id: string, checked: boolean) => void;
  onRenameOpen: (id: string) => void;
  onRenameCancel: () => void;
  onRenameSave: (id: string, payload: { title: string; description?: string }) => void;
  onDeleteOpen: (id: string) => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: (id: string) => void;
  onArchive: (id: string) => void;
  onActivate: (id: string) => void;
}

export function WebsiteList({
  websites,
  selectedIds,
  deletingId,
  renameId,
  deleteDialogId,
  renameBusyId,
  statusBusyId,
  deleteErrorById,
  onSelectionChange,
  onRenameOpen,
  onRenameCancel,
  onRenameSave,
  onDeleteOpen,
  onDeleteCancel,
  onDeleteConfirm,
  onArchive,
  onActivate,
}: WebsiteListProps) {
  return (
    <div className="website-list" role="list">
      {websites.map((website) => (
        <WebsiteListItem
          key={website.id}
          website={website}
          selected={selectedIds.includes(website.id)}
          deleting={deletingId === website.id}
          deleteError={deleteErrorById[website.id]}
          renameOpen={renameId === website.id}
          deleteOpen={deleteDialogId === website.id}
          renameBusy={renameBusyId === website.id}
          statusBusy={statusBusyId === website.id}
          onSelectionChange={(checked) => onSelectionChange(website.id, checked)}
          onRenameOpen={() => onRenameOpen(website.id)}
          onRenameCancel={onRenameCancel}
          onRenameSave={(payload) => onRenameSave(website.id, payload)}
          onDeleteOpen={() => onDeleteOpen(website.id)}
          onDeleteCancel={onDeleteCancel}
          onDeleteConfirm={() => onDeleteConfirm(website.id)}
          onArchive={() => onArchive(website.id)}
          onActivate={() => onActivate(website.id)}
        />
      ))}
    </div>
  );
}
