"use client";

import { useCallback, useEffect, useState } from "react";
import type { ContentLibraryItem, ContentLibraryPage, ContentLibraryQuery } from "@/lib/content/library/types";
import { ContentLibraryCard } from "./content-library-card";
import { ContentLibraryControls } from "./content-library-controls";
import { ContentLibraryEmptyState } from "./content-library-empty-state";
import { ContentLibraryLoading } from "./content-library-loading";

interface ContentLibraryShellProps {
  initialPage: ContentLibraryPage;
}

interface ContentLibraryApiResponse extends ContentLibraryPage {
  ok: boolean;
  error?: string;
}

const SEARCH_DEBOUNCE_MS = 250;

export function ContentLibraryShell({ initialPage }: ContentLibraryShellProps) {
  const [items, setItems] = useState(initialPage.items);
  const [total, setTotal] = useState(initialPage.total);
  const [page, setPage] = useState(initialPage.page);
  const [perPage] = useState(initialPage.perPage);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [availableWebsites, setAvailableWebsites] = useState(initialPage.availableWebsites);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [type, setType] = useState<ContentLibraryQuery["type"]>("all");
  const [status, setStatus] = useState<ContentLibraryQuery["status"]>("all");
  const [websiteId, setWebsiteId] = useState<ContentLibraryQuery["websiteId"]>("all");
  const [sort, setSort] = useState<ContentLibraryQuery["sort"]>("updated_desc");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string>();
  const [deletingId, setDeletingId] = useState<string>();

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const loadLibrary = useCallback(async (options: { append: boolean; targetPage: number }) => {
    if (options.append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(undefined);

    const params = new URLSearchParams();
    params.set("page", String(options.targetPage));
    params.set("perPage", String(perPage));
    params.set("sort", sort);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (type !== "all") params.set("type", type);
    if (status !== "all") params.set("status", status);
    if (websiteId !== "all") params.set("websiteId", websiteId);

    try {
      const response = await fetch(`/api/content/library?${params.toString()}`, { method: "GET", cache: "no-store" });
      const body = (await response.json()) as ContentLibraryApiResponse;
      if (!response.ok || !body.ok) {
        setError(body.error || "Unable to load content library.");
        return;
      }

      setItems((current) => (options.append ? [...current, ...body.items] : body.items));
      setTotal(body.total);
      setPage(body.page);
      setHasMore(body.hasMore);
      setAvailableWebsites(body.availableWebsites);
    } catch {
      setError("Unable to load content library.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, perPage, sort, status, type, websiteId]);

  useEffect(() => {
    void loadLibrary({ append: false, targetPage: 1 });
  }, [loadLibrary]);

  async function handleDelete(item: ContentLibraryItem) {
    const structureId = item.quickActions.deleteStructureId;
    if (!structureId) {
      return;
    }

    const confirmed = window.confirm("Delete this generated content via the existing safe archive flow?");
    if (!confirmed) {
      return;
    }

    setDeletingId(item.id);
    setError(undefined);

    try {
      const response = await fetch(`/api/content?structureId=${encodeURIComponent(structureId)}`, {
        method: "DELETE",
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !body.ok) {
        setError(body.error || "Unable to delete content.");
        return;
      }

      await loadLibrary({ append: false, targetPage: 1 });
    } catch {
      setError("Unable to delete content.");
    } finally {
      setDeletingId(undefined);
    }
  }

  const hasFilters = Boolean(debouncedSearch || type !== "all" || status !== "all" || websiteId !== "all");

  return (
    <section className="content-library-shell" aria-label="Generated content library">
      <header className="content-library-header">
        <h1>Generated Content Library</h1>
        <p>Browse and manage your generated websites/pages, blog posts, articles, and social posts.</p>
      </header>

      <ContentLibraryControls
        search={search}
        type={type}
        status={status}
        websiteId={websiteId}
        sort={sort}
        availableWebsites={availableWebsites}
        onSearchChange={setSearch}
        onTypeChange={setType}
        onStatusChange={setStatus}
        onWebsiteChange={setWebsiteId}
        onSortChange={setSort}
      />

      <p className="content-library-meta">Showing {items.length} of {total} content items.</p>

      {error ? (
        <div className="content-library-error">
          <p>{error}</p>
          <button type="button" onClick={() => void loadLibrary({ append: false, targetPage: 1 })}>
            Retry
          </button>
        </div>
      ) : null}

      {loading && items.length === 0 ? (
        <ContentLibraryLoading />
      ) : items.length === 0 ? (
        <ContentLibraryEmptyState hasFilters={hasFilters} />
      ) : (
        <section className="content-library-list" aria-label="Content library items">
          {items.map((item) => (
            <ContentLibraryCard
              key={item.id}
              item={item}
              deleting={deletingId === item.id}
              onDelete={handleDelete}
            />
          ))}
        </section>
      )}

      {loadingMore ? <p className="content-library-loading-more">Loading more content…</p> : null}
      {hasMore ? (
        <button
          type="button"
          className="wizard-button-secondary"
          onClick={() => void loadLibrary({ append: true, targetPage: page + 1 })}
          disabled={loading || loadingMore}
        >
          Load more
        </button>
      ) : null}
    </section>
  );
}
