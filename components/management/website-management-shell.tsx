"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  WebsiteManagementRecord,
  WebsiteMutationResponse,
  WebsiteStatusFilter,
} from "@/lib/management/types";
import { WebsiteEmptyState } from "./website-empty-state";
import { WebsiteFilters } from "./website-filters";
import { WebsiteList } from "./website-list";
import { WebsiteSearch } from "./website-search";

interface WebsiteManagementShellProps {
  initialWebsites: WebsiteManagementRecord[];
}

interface WebsiteListApiResponse {
  ok: boolean;
  websites?: WebsiteManagementRecord[];
  error?: string;
}

export function WebsiteManagementShell({ initialWebsites }: WebsiteManagementShellProps) {
  const [websites, setWebsites] = useState(initialWebsites);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<WebsiteStatusFilter>("all");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>();
  const [error, setError] = useState<string>();
  const [deletingId, setDeletingId] = useState<string>();
  const [renameId, setRenameId] = useState<string>();
  const [renameBusyId, setRenameBusyId] = useState<string>();
  const [statusBusyId, setStatusBusyId] = useState<string>();
  const [deleteDialogId, setDeleteDialogId] = useState<string>();
  const [deleteErrorById, setDeleteErrorById] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    const controller = new AbortController();

    async function loadWebsites() {
      setError(undefined);
      const params = new URLSearchParams();
      if (query.trim()) {
        params.set("query", query.trim());
      }
      if (status !== "all") {
        params.set("status", status);
      }
      if (includeDeleted) {
        params.set("includeDeleted", "true");
      }

      try {
        const response = await fetch(`/api/websites/list?${params.toString()}`, {
          method: "GET",
          signal: controller.signal,
        });

        const body = (await response.json()) as WebsiteListApiResponse;
        if (!response.ok || !body.ok || !body.websites) {
          setError(body.error || "Unable to load websites.");
          return;
        }

        setWebsites(body.websites);
      } catch {
        if (!controller.signal.aborted) {
          setError("Unable to load websites.");
        }
      }
    }

    void loadWebsites();

    return () => {
      controller.abort();
    };
  }, [query, status, includeDeleted]);

  const selectedCount = selectedIds.length;

  const hasResults = websites.length > 0;

  function upsertWebsite(updated: WebsiteManagementRecord) {
    setWebsites((current) => {
      const hasExisting = current.some((website) => website.id === updated.id);
      if (!hasExisting) {
        return [updated, ...current];
      }

      return current.map((website) => (website.id === updated.id ? updated : website));
    });
  }

  async function runMutation(path: string, payload: object): Promise<WebsiteMutationResponse> {
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return (await response.json()) as WebsiteMutationResponse;
  }

  async function handleDelete(websiteId: string) {
    setDeletingId(websiteId);
    setFeedback(undefined);
    setDeleteErrorById((current) => ({ ...current, [websiteId]: undefined }));

    try {
      const body = await runMutation("/api/websites/delete", { structureId: websiteId });
      if (!body.ok || !body.website) {
        const failure = body.error || "Delete failed.";
        setDeleteErrorById((current) => ({ ...current, [websiteId]: failure }));
        return;
      }

      if (includeDeleted) {
        upsertWebsite(body.website);
      } else {
        setWebsites((current) => current.filter((website) => website.id !== websiteId));
      }
      setDeleteDialogId(undefined);
      setSelectedIds((current) => current.filter((id) => id !== websiteId));
      setFeedback("Website deleted successfully.");
    } catch {
      setDeleteErrorById((current) => ({ ...current, [websiteId]: "Delete failed unexpectedly." }));
    } finally {
      setDeletingId(undefined);
    }
  }

  async function handleRename(websiteId: string, payload: { title: string; description?: string }) {
    setRenameBusyId(websiteId);
    setFeedback(undefined);
    setError(undefined);

    try {
      const body = await runMutation("/api/websites/rename", {
        structureId: websiteId,
        title: payload.title,
        description: payload.description,
      });

      if (!body.ok || !body.website) {
        setError(body.error || "Rename failed.");
        return;
      }

      upsertWebsite(body.website);
      setRenameId(undefined);
      setFeedback("Website metadata updated.");
    } catch {
      setError("Rename failed unexpectedly.");
    } finally {
      setRenameBusyId(undefined);
    }
  }

  async function handleStatus(websiteId: string, nextStatus: "archive" | "activate") {
    setStatusBusyId(websiteId);
    setFeedback(undefined);
    setError(undefined);

    try {
      const body = await runMutation("/api/websites/status", {
        structureId: websiteId,
        status: nextStatus,
      });

      if (!body.ok || !body.website) {
        setError(body.error || "Status update failed.");
        return;
      }

      upsertWebsite(body.website);
      setFeedback("Website status updated.");
    } catch {
      setError("Status update failed unexpectedly.");
    } finally {
      setStatusBusyId(undefined);
    }
  }

  function handleSelectionChange(id: string, checked: boolean) {
    setSelectedIds((current) => {
      if (checked && !current.includes(id)) {
        return [...current, id];
      }

      return current.filter((existing) => existing !== id);
    });
  }

  const bulkActionNotice = useMemo(() => {
    if (selectedCount === 0) {
      return "Bulk actions foundation is ready for MVP, but destructive bulk execution remains disabled.";
    }

    return `${selectedCount} selected. Bulk destructive actions are intentionally disabled in MVP.`;
  }, [selectedCount]);

  return (
    <section className="website-management-shell" aria-label="Website management">
      <header className="website-management-header">
        <h1>Website management</h1>
        <p>Manage listings, status, metadata, and deletion for your generated websites.</p>
      </header>

      <div className="website-management-controls">
        <WebsiteSearch value={query} onChange={setQuery} />
        <WebsiteFilters
          status={status}
          includeDeleted={includeDeleted}
          onStatusChange={setStatus}
          onIncludeDeletedChange={setIncludeDeleted}
        />
      </div>

      <section className="website-bulk-foundation" aria-live="polite">
        <p>{bulkActionNotice}</p>
        <button type="button" disabled>
          Bulk delete (coming soon)
        </button>
        <button type="button" disabled>
          Bulk archive (coming soon)
        </button>
      </section>

      {feedback ? <p className="website-management-success">{feedback}</p> : null}
      {error ? <p className="website-management-error">{error}</p> : null}

      {hasResults ? (
        <WebsiteList
          websites={websites}
          selectedIds={selectedIds}
          deletingId={deletingId}
          renameId={renameId}
          deleteDialogId={deleteDialogId}
          renameBusyId={renameBusyId}
          statusBusyId={statusBusyId}
          deleteErrorById={deleteErrorById}
          onSelectionChange={handleSelectionChange}
          onRenameOpen={(id) => {
            setRenameId(id);
            setError(undefined);
            setFeedback(undefined);
          }}
          onRenameCancel={() => setRenameId(undefined)}
          onRenameSave={handleRename}
          onDeleteOpen={(id) => {
            setDeleteDialogId(id);
            setFeedback(undefined);
          }}
          onDeleteCancel={() => setDeleteDialogId(undefined)}
          onDeleteConfirm={handleDelete}
          onArchive={(id) => {
            void handleStatus(id, "archive");
          }}
          onActivate={(id) => {
            void handleStatus(id, "activate");
          }}
        />
      ) : (
        <WebsiteEmptyState />
      )}
    </section>
  );
}
