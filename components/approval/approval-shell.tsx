"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApprovalListPage, ApprovalQuery } from "@/lib/approval";
import { ApprovalList } from "./approval-list";

interface ApprovalShellProps {
  initialPage: ApprovalListPage;
  initialQuery: ApprovalQuery;
}

interface ApprovalApiResponse extends ApprovalListPage {
  ok: boolean;
  error?: string;
}

const SEARCH_DEBOUNCE_MS = 250;

export function ApprovalShell({ initialPage, initialQuery }: ApprovalShellProps) {
  const [items, setItems] = useState(initialPage.items);
  const [total, setTotal] = useState(initialPage.total);
  const [page, setPage] = useState(initialPage.page);
  const [perPage] = useState(initialPage.perPage);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [search, setSearch] = useState(initialQuery.search ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery.search ?? "");
  const [type, setType] = useState<ApprovalQuery["type"]>(initialQuery.type);
  const [sort, setSort] = useState<ApprovalQuery["sort"]>(initialQuery.sort);
  const [approvalState, setApprovalState] = useState<ApprovalQuery["approvalState"]>(initialQuery.approvalState);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const loadQueue = useCallback(async (options: { append: boolean; targetPage: number }) => {
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
    params.set("approvalState", approvalState);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (type !== "all") params.set("type", type);

    try {
      const response = await fetch(`/api/approval?${params.toString()}`, { method: "GET", cache: "no-store" });
      const body = (await response.json()) as ApprovalApiResponse;
      if (!response.ok || !body.ok) {
        setError(body.error || "Unable to load approval queue.");
        return;
      }

      setItems((current) => (options.append ? [...current, ...body.items] : body.items));
      setTotal(body.total);
      setPage(body.page);
      setHasMore(body.hasMore);
    } catch (fetchError) {
      setError(
        fetchError instanceof TypeError
          ? "Network error while loading approval queue. Check your connection and retry."
          : "Unable to load approval queue.",
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [approvalState, debouncedSearch, perPage, sort, type]);

  useEffect(() => {
    void loadQueue({ append: false, targetPage: 1 });
  }, [loadQueue]);

  const hasFilters = useMemo(
    () => Boolean(debouncedSearch || type !== "all" || approvalState !== "all"),
    [approvalState, debouncedSearch, type],
  );

  return (
    <section className="review-shell" aria-label="AI content approval queue">
      <header className="review-header">
        <h1>AI Content Approval</h1>
        <p>Submit, approve, reject, request changes, and track approval lifecycle before publish.</p>
      </header>

      <section className="review-controls" aria-label="Approval filters">
        <label>
          Search
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title or keywords" />
        </label>
        <label>
          Type
          <select value={type} onChange={(event) => setType(event.target.value as ApprovalQuery["type"])}>
            <option value="all">All types</option>
            <option value="website_page">Website pages</option>
            <option value="blog_post">Blog posts</option>
            <option value="article">Articles</option>
            <option value="social_post">Social posts</option>
          </select>
        </label>
        <label>
          Approval state
          <select value={approvalState} onChange={(event) => setApprovalState(event.target.value as ApprovalQuery["approvalState"])}>
            <option value="all">All states</option>
            <option value="draft">Draft</option>
            <option value="pending_approval">Pending approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="needs_changes">Needs changes</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label>
          Sort
          <select value={sort} onChange={(event) => setSort(event.target.value as ApprovalQuery["sort"])}>
            <option value="updated_desc">Recently updated</option>
            <option value="created_desc">Recently created</option>
            <option value="title_asc">Title (A-Z)</option>
          </select>
        </label>
      </section>

      <p className="review-meta" role="status" aria-live="polite">Showing {items.length} of {total} approval items.</p>

      {error ? (
        <div className="review-error">
          <p>{error}</p>
          <button type="button" onClick={() => void loadQueue({ append: false, targetPage: 1 })}>Retry</button>
        </div>
      ) : null}

      {loading && items.length === 0 ? (
        <div className="review-loading" aria-busy="true">
          <p>Loading approval queue…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="review-empty">
          <h2>No approval items</h2>
          <p>
            {hasFilters
              ? "No content matches your current approval filters."
              : "Generated content will appear here when approval is needed."}
          </p>
        </div>
      ) : (
        <ApprovalList items={items} />
      )}

      {loadingMore ? <p className="review-loading-more">Loading more approval items…</p> : null}
      {hasMore ? (
        <button
          type="button"
          className="wizard-button-secondary"
          onClick={() => void loadQueue({ append: true, targetPage: page + 1 })}
          disabled={loading || loadingMore}
        >
          Load more
        </button>
      ) : null}
    </section>
  );
}
