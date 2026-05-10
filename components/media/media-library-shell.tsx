"use client";

import { useEffect, useMemo, useState } from "react";
import type { MediaApiRecord, MediaType } from "@/lib/media/types";
import { MediaLibraryGrid } from "./media-library-grid";

interface MediaListResponse {
  ok: boolean;
  items?: MediaApiRecord[];
  total?: number;
  page?: number;
  perPage?: number;
  hasMore?: boolean;
  error?: string;
}

interface MediaLibraryShellProps {
  linkedContentId?: string;
  linkedContentType?: string;
  onSelect?: (media: MediaApiRecord) => void;
}

const TYPE_FILTERS: Array<{ value: "all" | MediaType; label: string }> = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "document", label: "Documents" },
  { value: "thumbnail", label: "Thumbnails" },
  { value: "asset", label: "Assets" },
  { value: "file", label: "Files" },
];

export function MediaLibraryShell({ linkedContentId, linkedContentType, onSelect }: MediaLibraryShellProps) {
  const [items, setItems] = useState<MediaApiRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | MediaType>("all");
  const [selectedId, setSelectedId] = useState<string>();

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("perPage", "18");
    if (search.trim()) params.set("search", search.trim());
    if (typeFilter !== "all") params.set("mediaType", typeFilter);
    if (linkedContentId) params.set("linkedContentId", linkedContentId);
    if (linkedContentType) params.set("linkedContentType", linkedContentType);
    return params.toString();
  }, [linkedContentId, linkedContentType, page, search, typeFilter]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(undefined);

    fetch(`/api/media/list?${queryString}`)
      .then((response) => response.json() as Promise<MediaListResponse>)
      .then((body) => {
        if (!active) return;
        if (!body.ok || !body.items) {
          setError(body.error || "Unable to load media.");
          return;
        }

        setItems(body.items);
        setHasMore(Boolean(body.hasMore));
      })
      .catch(() => {
        if (active) setError("Unable to load media.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [queryString]);

  return (
    <section className="media-library-shell" aria-label="Media library">
      <header className="media-library-controls">
        <input
          value={search}
          placeholder="Search media"
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
        />
        <select
          value={typeFilter}
          onChange={(event) => {
            setPage(1);
            setTypeFilter(event.target.value as "all" | MediaType);
          }}
        >
          {TYPE_FILTERS.map((entry) => (
            <option key={entry.value} value={entry.value}>{entry.label}</option>
          ))}
        </select>
      </header>

      {loading ? <p>Loading media library…</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
      {!loading && !error ? (
        <MediaLibraryGrid
          items={items}
          selectedId={selectedId}
          onSelect={(media) => {
            setSelectedId(media.id);
            onSelect?.(media);
          }}
        />
      ) : null}

      <footer className="media-library-pagination">
        <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading}>
          Previous
        </button>
        <span>Page {page}</span>
        <button type="button" onClick={() => setPage((current) => current + 1)} disabled={!hasMore || loading}>
          Next
        </button>
      </footer>
    </section>
  );
}
