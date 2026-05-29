"use client";

import { useMemo, useState } from "react";
import type { SocialPlatform } from "@/lib/social/types";
import type { SocialPublishHistoryJob } from "@/lib/social/history";
import { SocialHistoryList } from "./social-history-list";

interface SocialHistoryPanelProps {
  initialItems: SocialPublishHistoryJob[];
}

interface HistoryApiResponse {
  ok: boolean;
  items?: SocialPublishHistoryJob[];
  total?: number;
  page?: number;
  perPage?: number;
  error?: string;
}

const STATUS_OPTIONS = ["", "requested", "queued", "publishing", "published", "failed", "retry", "canceled"];
const PLATFORM_OPTIONS: Array<"" | SocialPlatform> = ["", "instagram", "facebook", "linkedin", "x"];

export function SocialHistoryPanel({ initialItems }: SocialHistoryPanelProps) {
  const [items, setItems] = useState<SocialPublishHistoryJob[]>(initialItems);
  const [status, setStatus] = useState("");
  const [platform, setPlatform] = useState<"" | SocialPlatform>("");
  const [accountId, setAccountId] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [total, setTotal] = useState(initialItems.length);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / perPage)), [perPage, total]);

  async function load(nextPage = page) {
    setLoading(true);
    setError(undefined);

    const params = new URLSearchParams({
      page: String(nextPage),
      perPage: String(perPage),
    });
    if (status) params.set("status", status);
    if (platform) params.set("platform", platform);
    if (accountId.trim()) params.set("accountId", accountId.trim());

    try {
      const response = await fetch(`/api/social/history?${params.toString()}`);
      const body = (await response.json()) as HistoryApiResponse;
      if (!response.ok || !body.ok || !body.items) {
        throw new Error(body.error || "Unable to load social history.");
      }
      setPage(body.page ?? nextPage);
      setTotal(body.total ?? 0);
      setItems(body.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load social history.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRetry(historyJobId: string) {
    setLoading(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const response = await fetch(`/api/social/history/${historyJobId}/retry`, {
        method: "POST",
      });
      const body = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !body.ok) {
        throw new Error(body.error || "Unable to retry publish from history.");
      }

      setMessage("Retry triggered from history.");
      await load(1);
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "Unable to retry publish from history.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="content-schedule-panel" id="social-history" aria-label="Social publishing history">
      <div className="content-schedule-header">
        <div>
          <h2>Social publishing history</h2>
          <p>Audit timeline for publish requests, delivery lifecycle, and retry operations.</p>
        </div>
      </div>

      {message ? <p className="content-schedule-success">{message}</p> : null}
      {error ? <p className="content-schedule-error">{error}</p> : null}

      <form
        className="content-schedule-form"
        onSubmit={(event) => {
          event.preventDefault();
          void load(1);
        }}
      >
        <div className="content-schedule-grid">
          <label>
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {STATUS_OPTIONS.map((entry) => (
                <option key={entry || "all"} value={entry}>
                  {entry || "All"}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Platform</span>
            <select value={platform} onChange={(event) => setPlatform(event.target.value as "" | SocialPlatform)}>
              {PLATFORM_OPTIONS.map((entry) => (
                <option key={entry || "all"} value={entry}>
                  {entry || "All"}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Account ID</span>
            <input
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
              placeholder="Instagram account id"
            />
          </label>
        </div>

        <div className="content-schedule-actions">
          <button type="submit" disabled={loading}>
            {loading ? "Loading..." : "Apply filters"}
          </button>
        </div>
      </form>

      <SocialHistoryList items={items} loading={loading} onRetry={handleRetry} />

      <div className="content-schedule-actions">
        <button
          type="button"
          className="wizard-button-secondary"
          disabled={loading || page <= 1}
          onClick={() => void load(page - 1)}
        >
          Previous
        </button>
        <span>
          Page {page} / {pageCount}
        </span>
        <button
          type="button"
          className="wizard-button-secondary"
          disabled={loading || page >= pageCount}
          onClick={() => void load(page + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}
