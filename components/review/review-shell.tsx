"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReviewListPage, ReviewQuery } from "@/lib/review/types";
import { ReviewList } from "./review-list";

interface ReviewShellProps {
  initialPage: ReviewListPage;
  initialQuery: ReviewQuery;
}

interface ReviewApiResponse extends ReviewListPage {
  ok: boolean;
  error?: string;
}

// 250ms keeps search responsive while preventing excessive API churn on rapid typing.
const SEARCH_DEBOUNCE_MS = 250;

export function ReviewShell({ initialPage, initialQuery }: ReviewShellProps) {
  const [items, setItems] = useState(initialPage.items);
  const [total, setTotal] = useState(initialPage.total);
  const [page, setPage] = useState(initialPage.page);
  const [perPage] = useState(initialPage.perPage);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [search, setSearch] = useState(initialQuery.search ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery.search ?? "");
  const [type, setType] = useState<ReviewQuery["type"]>(initialQuery.type);
  const [sort, setSort] = useState<ReviewQuery["sort"]>(initialQuery.sort);
  const [reviewState, setReviewState] = useState<ReviewQuery["reviewState"]>(initialQuery.reviewState);
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
    params.set("reviewState", reviewState);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (type !== "all") params.set("type", type);

    try {
      const response = await fetch(`/api/review?${params.toString()}`, { method: "GET", cache: "no-store" });
      const body = (await response.json()) as ReviewApiResponse;
      if (!response.ok || !body.ok) {
        setError(body.error || "Unable to load review queue.");
        return;
      }

      setItems((current) => (options.append ? [...current, ...body.items] : body.items));
      setTotal(body.total);
      setPage(body.page);
      setHasMore(body.hasMore);
    } catch (fetchError) {
      setError(
        fetchError instanceof TypeError
          ? "Network error while loading review queue. Check your connection and retry."
          : "Unable to load review queue.",
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, perPage, reviewState, sort, type]);

  useEffect(() => {
    void loadQueue({ append: false, targetPage: 1 });
  }, [loadQueue]);

  const hasFilters = useMemo(
    () => Boolean(debouncedSearch || type !== "all" || reviewState !== "all"),
    [debouncedSearch, reviewState, type],
  );

  return (
    <section className="review-shell" aria-label="AI content review queue">
      <header className="review-header">
        <h1>AI Content Review</h1>
        <p>Review generated website pages, blog posts, articles, and social posts before publishing.</p>
      </header>

      <section className="review-controls" aria-label="Review filters">
        <label>
          Search
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title or keywords" />
        </label>
        <label>
          Type
          <select value={type} onChange={(event) => setType(event.target.value as ReviewQuery["type"])}>
            <option value="all">All types</option>
            <option value="website_page">Website pages</option>
            <option value="blog_post">Blog posts</option>
            <option value="article">Articles</option>
            <option value="social_post">Social posts</option>
          </select>
        </label>
        <label>
          Review state
          <select value={reviewState} onChange={(event) => setReviewState(event.target.value as ReviewQuery["reviewState"])}>
            <option value="all">All states</option>
            <option value="pending_review">Pending review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="needs_changes">Needs changes</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label>
          Sort
          <select value={sort} onChange={(event) => setSort(event.target.value as ReviewQuery["sort"])}>
            <option value="updated_desc">Recently updated</option>
            <option value="created_desc">Recently created</option>
            <option value="title_asc">Title (A-Z)</option>
          </select>
        </label>
      </section>

      <p className="review-meta" role="status" aria-live="polite">Showing {items.length} of {total} review items.</p>

      {error ? (
        <div className="review-error">
          <p>{error}</p>
          <button type="button" onClick={() => void loadQueue({ append: false, targetPage: 1 })}>Retry</button>
        </div>
      ) : null}

      {loading && items.length === 0 ? (
        <div className="review-loading" aria-busy="true">
          <p>Loading review queue…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="review-empty">
          <h2>No review items</h2>
          <p>
            {hasFilters
              ? "No content matches your current review filters."
              : "Generated content will appear here when review is needed."}
          </p>
        </div>
      ) : (
        <ReviewList items={items} />
      )}

      {loadingMore ? <p className="review-loading-more">Loading more review items…</p> : null}
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
