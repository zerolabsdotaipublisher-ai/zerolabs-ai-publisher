"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  WebsiteListPage,
  WebsiteManagementRecord,
  WebsiteMutationResponse,
  WebsitePublishStateFilter,
  WebsiteStatusFilter,
  WebsiteTypeFilter,
} from "@/lib/management/types";
import { WebsiteListControls } from "./website-list-controls";
import { WebsiteListEmptyState } from "./website-list-empty-state";
import { WebsiteListLoading } from "./website-list-loading";
import { WebsiteList } from "./website-list";

interface WebsiteManagementShellProps {
  initialListing: WebsiteListPage;
}

interface WebsiteListApiResponse {
  ok: boolean;
  websites?: WebsiteManagementRecord[];
  total?: number;
  page?: number;
  perPage?: number;
  hasMore?: boolean;
  error?: string;
}

const DEFAULT_PER_PAGE = 12;

export function WebsiteManagementShell({ initialListing }: WebsiteManagementShellProps) {
  const [websites, setWebsites] = useState(initialListing.websites);
  const [total, setTotal] = useState(initialListing.total);
  const [page, setPage] = useState(initialListing.page);
  const [perPage, setPerPage] = useState(initialListing.perPage);
  const [hasMore, setHasMore] = useState(initialListing.hasMore);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState<WebsiteStatusFilter>("all");
  const [publishState, setPublishState] = useState<WebsitePublishStateFilter>("all");
  const [websiteType, setWebsiteType] = useState<WebsiteTypeFilter>("all");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string>();
  const [renameId, setRenameId] = useState<string>();
  const [renameBusyId, setRenameBusyId] = useState<string>();
  const [statusBusyId, setStatusBusyId] = useState<string>();
  const [deleteDialogId, setDeleteDialogId] = useState<string>();
  const [deleteErrorById, setDeleteErrorById] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timeout);
  }, [query]);

  async function loadWebsites(options: { append: boolean; targetPage?: number }) {
    const controller = new AbortController();
    const nextPage = options.targetPage ?? (options.append ? page + 1 : 1);

    if (options.append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(undefined);

    const params = new URLSearchParams();
    if (debouncedQuery) params.set("query", debouncedQuery);
    if (status !== "all") params.set("status", status);
    if (publishState !== "all") params.set("publishState", publishState);
    if (websiteType !== "all") params.set("websiteType", websiteType);
    if (includeDeleted) params.set("includeDeleted", "true");
    params.set("page", String(nextPage));
    params.set("perPage", String(perPage || DEFAULT_PER_PAGE));

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

      setWebsites((current) => (options.append ? [...current, ...body.websites!] : body.websites!));
      setTotal(body.total ?? body.websites.length);
      setPage(body.page ?? nextPage);
      setPerPage(body.perPage ?? perPage);
      setHasMore(Boolean(body.hasMore));
      if (!options.append) {
        setSelectedIds([]);
      }
    } catch {
      if (!controller.signal.aborted) {
        setError("Unable to load websites.");
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    void loadWebsites({ append: false, targetPage: 1 });
  }, [debouncedQuery, status, publishState, websiteType, includeDeleted]);

  async function runMutation(path: string, payload: object): Promise<WebsiteMutationResponse> {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return (await response.json()) as WebsiteMutationResponse;
  }

  async function refreshListing() {
    await loadWebsites({ append: false, targetPage: 1 });
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

      setDeleteDialogId(undefined);
      setSelectedIds((current) => current.filter((id) => id !== websiteId));
      setFeedback("Website deleted successfully.");
      await refreshListing();
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

      setRenameId(undefined);
      setFeedback("Website metadata updated.");
      await refreshListing();
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

      setFeedback("Website status updated.");
      await refreshListing();
    } catch {
      setError("Status update failed unexpectedly.");
    } finally {
      setStatusBusyId(undefined);
    }
  }

  function handleSelectionChange(id: string, checked: boolean) {
    setSelectedIds((current) => {
      if (checked && !current.includes(id)) return [...current, id];
      return current.filter((existing) => existing !== id);
    });
  }

  const selectedCount = selectedIds.length;
  const hasFilters = Boolean(
    debouncedQuery || status !== "all" || publishState !== "all" || websiteType !== "all" || includeDeleted,
  );
  const hasResults = websites.length > 0;
  const bulkActionNotice = useMemo(() => {
    if (selectedCount === 0) {
      return "Bulk actions foundation is ready for MVP, but destructive bulk execution remains disabled.";
    }

    return `${selectedCount} selected. Bulk destructive actions are intentionally disabled in MVP.`;
  }, [selectedCount]);

  return (
    <section className="website-management-shell" aria-label="Website management">
      <header className="website-management-header">
        <h1>Website listing</h1>
        <p>View and manage user-owned websites with publish-aware status, quick actions, and responsive filtering.</p>
      </header>

      <WebsiteListControls
        query={query}
        status={status}
        publishState={publishState}
        websiteType={websiteType}
        includeDeleted={includeDeleted}
        onQueryChange={setQuery}
        onStatusChange={setStatus}
        onPublishStateChange={setPublishState}
        onWebsiteTypeChange={setWebsiteType}
        onIncludeDeletedChange={setIncludeDeleted}
      />

      <section className="website-bulk-foundation" aria-live="polite">
        <p>{bulkActionNotice}</p>
        <button type="button" disabled>
          Bulk delete (coming soon)
        </button>
        <button type="button" disabled>
          Bulk archive (coming soon)
        </button>
      </section>

      <p className="website-management-meta">
        Showing {websites.length} of {total} websites.
      </p>

      {feedback ? <p className="website-management-success">{feedback}</p> : null}
      {error ? (
        <div className="website-management-error-panel">
          <p className="website-management-error">{error}</p>
          <button type="button" onClick={() => void refreshListing()} disabled={loading || loadingMore}>
            Retry
          </button>
        </div>
      ) : null}

      {loading && !hasResults ? (
        <WebsiteListLoading />
      ) : hasResults ? (
        <>
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

          {loadingMore ? <p className="website-loading-more">Loading more websites…</p> : null}
          {hasMore ? (
            <button
              type="button"
              className="wizard-button-secondary"
              onClick={() => void loadWebsites({ append: true })}
              disabled={loading || loadingMore}
            >
              Load more
            </button>
          ) : null}
        </>
      ) : (
        <WebsiteListEmptyState hasFilters={hasFilters} />
      )}
    </section>
  );
}
