"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WebsiteMediaLibraryApiRecord } from "@/lib/website-media-library/types";
import { WebsiteMediaEmptyState } from "./website-media-empty-state";
import { WebsiteMediaFilters } from "./website-media-filters";
import { WebsiteMediaLibraryGrid } from "./website-media-library-grid";
import { WebsiteMediaLibraryList } from "./website-media-library-list";
import { WebsiteMediaLoadingState } from "./website-media-loading-state";
import { WebsiteMediaPreviewDialog } from "./website-media-preview-dialog";
import { WebsiteMediaUploadPanel } from "./website-media-upload-panel";

interface ListResponse {
  ok: boolean;
  items?: WebsiteMediaLibraryApiRecord[];
  total?: number;
  page?: number;
  perPage?: number;
  hasMore?: boolean;
  error?: string;
}

interface DeleteResponse {
  ok: boolean;
  mode?: "archived" | "deleted";
  item?: WebsiteMediaLibraryApiRecord;
  error?: string;
}

interface UsageResponse {
  ok: boolean;
  error?: string;
}

interface PreviewResponse {
  ok: boolean;
  preview?: { url: string };
}

interface WebsiteMediaLibraryShellProps {
  websiteId?: string;
  linkedContentId?: string;
  linkedContentType?: string;
  pageId?: string;
  sectionId?: string;
  selectionMode?: boolean;
  onSelect?: (payload: { item: WebsiteMediaLibraryApiRecord; previewUrl?: string }) => void;
}

export function WebsiteMediaLibraryShell({
  websiteId,
  linkedContentId,
  linkedContentType,
  pageId,
  sectionId,
  selectionMode = false,
  onSelect,
}: WebsiteMediaLibraryShellProps) {
  const [items, setItems] = useState<WebsiteMediaLibraryApiRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [feedback, setFeedback] = useState<string>();
  const [selectedId, setSelectedId] = useState<string>();
  const [search, setSearch] = useState("");
  const [mediaType, setMediaType] = useState("all");
  const [tag, setTag] = useState("");
  const [status, setStatus] = useState("active");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [previewItem, setPreviewItem] = useState<WebsiteMediaLibraryApiRecord>();
  const [previewUrl, setPreviewUrl] = useState<string>();

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("perPage", "18");
    if (websiteId) params.set("websiteId", websiteId);
    if (linkedContentId) params.set("linkedContentId", linkedContentId);
    if (linkedContentType) params.set("linkedContentType", linkedContentType);
    if (search.trim()) params.set("search", search.trim());
    if (mediaType !== "all") params.set("mediaType", mediaType);
    if (tag.trim()) params.set("tag", tag.trim());
    if (status) params.set("status", status);
    return params.toString();
  }, [linkedContentId, linkedContentType, mediaType, page, search, status, tag, websiteId]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/website-media-library/list?${queryString}`);
      const body = await response.json() as ListResponse;
      if (!response.ok || !body.ok || !body.items) {
        setError(body.error || "Unable to load website media library.");
        return;
      }
      setItems(body.items);
      setHasMore(Boolean(body.hasMore));
    } catch (caughtError) {
      console.error("Failed to load website media library", caughtError);
      setError("Failed to load media library. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  async function handleDelete(item: WebsiteMediaLibraryApiRecord) {
    setFeedback(undefined);
    setError(undefined);
    try {
      const response = await fetch(item.deleteEndpoint, { method: "DELETE" });
      const body = await response.json() as DeleteResponse;
      if (!response.ok || !body.ok) {
        setError(body.error || "Unable to delete website media item.");
        return;
      }
      setFeedback(body.mode === "archived" ? `${item.displayName} was archived because it is already used in website content.` : `${item.displayName} was deleted.`);
      await loadItems();
    } catch {
      setError("Unable to delete website media item because the request did not complete. Retry the action.");
    }
  }

  async function handleSelect(item: WebsiteMediaLibraryApiRecord, resolvedPreviewUrl?: string) {
    setSelectedId(item.id);
    setFeedback(undefined);
    let preview = resolvedPreviewUrl ?? previewUrl;

    if (!preview) {
      try {
        const previewResponse = await fetch(item.previewEndpoint);
        const previewBody = await previewResponse.json() as PreviewResponse;
        if (previewResponse.ok && previewBody.ok) {
          preview = previewBody.preview?.url;
        }
      } catch (caughtError) {
        console.error("Failed to resolve website media preview before selection", caughtError);
        preview = undefined;
      }
    }

    try {
      const response = await fetch(item.usageEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usageKind: selectionMode ? "editor_insert" : "website_content",
          websiteId,
          contentId: linkedContentId,
          contentType: linkedContentType,
          pageId,
          sectionId,
          metadata: { selectedFrom: "website-media-library-shell" },
        }),
      });
      const body = await response.json() as UsageResponse;
      if (!response.ok || !body.ok) {
        setError(body.error || "Unable to track website media usage.");
      }
    } catch {
      setError("Unable to track website media usage because the request did not complete. The item was selected, but usage may need to be refreshed.");
    }

    onSelect?.({ item, previewUrl: preview });
  }

  const hasFilters = Boolean(search.trim() || mediaType !== "all" || tag.trim() || status !== "active");

  return (
    <section className="website-media-library-shell" aria-label="Website media library">
      <header className="website-management-header">
        <h2>Website media library</h2>
        <p>Browse uploads and reusable AI-generated assets for this website without exposing raw storage paths.</p>
      </header>

      <WebsiteMediaUploadPanel
        websiteId={websiteId}
        linkedContentId={linkedContentId}
        linkedContentType={linkedContentType}
        pageId={pageId}
        sectionId={sectionId}
        onUploaded={(payload) => {
          setFeedback(`Added ${payload.item.displayName} to the website media library.`);
          setItems((current) => [payload.item, ...current]);
        }}
      />

      <WebsiteMediaFilters
        search={search}
        mediaType={mediaType}
        tag={tag}
        status={status}
        onSearchChange={(value) => {
          setPage(1);
          setSearch(value);
        }}
        onMediaTypeChange={(value) => {
          setPage(1);
          setMediaType(value);
        }}
        onTagChange={(value) => {
          setPage(1);
          setTag(value);
        }}
        onStatusChange={(value) => {
          setPage(1);
          setStatus(value);
        }}
      />

      <div className="website-media-shell-actions">
        <div className="media-library-pagination">
          <button type="button" className="wizard-button-secondary" onClick={() => setView("grid")} disabled={view === "grid"}>Grid</button>
          <button type="button" className="wizard-button-secondary" onClick={() => setView("list")} disabled={view === "list"}>List</button>
        </div>
        <div className="media-library-pagination">
          <button type="button" className="wizard-button-secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading}>Previous</button>
          <span>Page {page}</span>
          <button type="button" className="wizard-button-secondary" onClick={() => setPage((current) => current + 1)} disabled={!hasMore || loading}>Next</button>
        </div>
      </div>

      {feedback ? <p className="website-management-success">{feedback}</p> : null}
      {error ? <p className="website-management-error">{error}</p> : null}
      {loading ? <WebsiteMediaLoadingState /> : null}
      {!loading && items.length === 0 ? <WebsiteMediaEmptyState hasFilters={hasFilters} /> : null}
      {!loading && items.length > 0 && view === "grid" ? (
        <WebsiteMediaLibraryGrid
          items={items}
          selectedId={selectedId}
          compact={selectionMode}
          onPreview={(item, resolvedPreviewUrl) => {
            setPreviewItem(item);
            setPreviewUrl(resolvedPreviewUrl);
          }}
          onSelect={selectionMode ? handleSelect : undefined}
          onDelete={handleDelete}
          onUpdated={(updated) => {
            setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
          }}
        />
      ) : null}
      {!loading && items.length > 0 && view === "list" ? (
        <WebsiteMediaLibraryList
          items={items}
          selectedId={selectedId}
          onPreview={(item, resolvedPreviewUrl) => {
            setPreviewItem(item);
            setPreviewUrl(resolvedPreviewUrl);
          }}
          onSelect={selectionMode ? handleSelect : undefined}
          onDelete={handleDelete}
          onUpdated={(updated) => {
            setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
          }}
        />
      ) : null}

      <WebsiteMediaPreviewDialog
        open={Boolean(previewItem)}
        title={previewItem?.displayName || "Preview"}
        mediaType={previewItem?.mediaType || "file"}
        previewUrl={previewUrl}
        altText={previewItem?.altText}
        onClose={() => {
          setPreviewItem(undefined);
          setPreviewUrl(undefined);
        }}
      />
    </section>
  );
}
