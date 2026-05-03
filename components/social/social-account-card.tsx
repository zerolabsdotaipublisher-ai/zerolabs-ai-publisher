"use client";

import type { SocialAccountConnection } from "@/lib/social/accounts/types";

interface SocialAccountCardProps {
  account: SocialAccountConnection;
  loading?: boolean;
  onRefresh: (accountId: string) => Promise<void>;
  onDisconnect: (accountId: string) => Promise<void>;
}

function badgeClass(status: SocialAccountConnection["status"]): string {
  if (status === "connected") return "content-schedule-badge content-schedule-status-active";
  if (status === "disconnected") return "content-schedule-badge content-schedule-status-unscheduled";
  return "content-schedule-badge content-schedule-status-failed";
}

function formatDate(value?: string): string {
  if (!value) return "n/a";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SocialAccountCard({ account, loading, onRefresh, onDisconnect }: SocialAccountCardProps) {
  return (
    <article className="social-account-card">
      <header className="social-account-card-header">
        <div>
          <h3>{account.displayName || account.username || `${account.platform} account`}</h3>
          <p>
            {account.platform} {account.platformAccountId ? `• ${account.platformAccountId}` : ""}
          </p>
        </div>
        <div className="social-schedule-card-badges">
          <span className={badgeClass(account.status)}>{account.status}</span>
          {account.reauthorizationRequired ? (
            <span className="content-schedule-badge content-schedule-status-failed">reauthorization required</span>
          ) : null}
        </div>
      </header>

      <div className="social-schedule-card-meta">
        <span>Username: {account.username ?? "n/a"}</span>
        <span>Token expires: {formatDate(account.tokenExpiresAt)}</span>
        <span>Last refresh: {formatDate(account.tokenLastRefreshedAt)}</span>
      </div>

      {account.lastError ? <p className="content-schedule-error">{account.lastError}</p> : null}

      <div className="content-schedule-actions">
        <button
          type="button"
          className="wizard-button-secondary"
          disabled={loading || account.status === "disconnected"}
          onClick={() => void onRefresh(account.id)}
        >
          Refresh / Reauthorize
        </button>
        <button
          type="button"
          disabled={loading || account.status === "disconnected"}
          onClick={() => void onDisconnect(account.id)}
        >
          Disconnect
        </button>
      </div>
    </article>
  );
}
