"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AiAssetApiRecord, AiAssetStatus, AiAssetType } from "@/lib/ai-assets/types";
import { AiAssetGrid } from "./ai-asset-grid";

interface AiAssetListResponse {
  ok: boolean;
  items?: AiAssetApiRecord[];
  hasMore?: boolean;
  error?: string;
}

interface AiAssetLibraryShellProps {
  linkedContentId?: string;
  linkedContentType?: string;
  onSelect?: (asset: AiAssetApiRecord) => void;
}

const TYPE_FILTERS: Array<{ value: "all" | AiAssetType; label: string }> = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "thumbnail", label: "Thumbnails" },
  { value: "optimized", label: "Optimized" },
  { value: "social", label: "Social" },
  { value: "cropped", label: "Cropped" },
  { value: "resized", label: "Resized" },
];

const STATUS_FILTERS: Array<{ value: "all" | AiAssetStatus; label: string }> = [
  { value: "all", label: "Any status" },
  { value: "available", label: "Available" },
  { value: "attached", label: "Attached" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
  { value: "failed", label: "Failed" },
];

export function AiAssetLibraryShell({ linkedContentId, linkedContentType, onSelect }: AiAssetLibraryShellProps) {
  const [items, setItems] = useState<AiAssetApiRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | AiAssetType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AiAssetStatus>("all");
  const [selectedId, setSelectedId] = useState<string>();

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("perPage", "18");
    if (search.trim()) params.set("search", search.trim());
    if (typeFilter !== "all") params.set("assetType", typeFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (linkedContentId) params.set("linkedContentId", linkedContentId);
    if (linkedContentType) params.set("linkedContentType", linkedContentType);
    return params.toString();
  }, [linkedContentId, linkedContentType, page, search, statusFilter, typeFilter]);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const response = await fetch(`/api/ai-assets/list?${queryString}`);
      const body = await response.json() as AiAssetListResponse;
      if (!body.ok || !body.items) {
        setError(body.error || "Unable to load AI assets.");
        return;
      }

      setItems(body.items);
      setHasMore(Boolean(body.hasMore));
    } catch {
      setError("Unable to load AI assets.");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  return (
    <section className="media-library-shell ai-asset-library-shell" aria-label="AI asset library">
      <header className="media-library-controls">
        <input
          value={search}
          placeholder="Search AI assets"
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
        />
        <select
          value={typeFilter}
          onChange={(event) => {
            setPage(1);
            setTypeFilter(event.target.value as "all" | AiAssetType);
          }}
        >
          {TYPE_FILTERS.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => {
            setPage(1);
            setStatusFilter(event.target.value as "all" | AiAssetStatus);
          }}
        >
          {STATUS_FILTERS.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}
        </select>
      </header>

      {loading ? <p>Loading AI assets…</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
      {!loading && !error ? (
        <AiAssetGrid
          items={items}
          selectedId={selectedId}
          onSelect={(asset) => {
            setSelectedId(asset.id);
            onSelect?.(asset);
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
