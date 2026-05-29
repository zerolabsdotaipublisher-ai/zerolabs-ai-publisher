"use client";

import { useEffect, useState } from "react";
import type {
  SocialAccountConnection,
  SocialAccountPlatform,
  SocialAccountProvider,
} from "@/lib/social/accounts/types";
import { SocialAccountCard } from "./social-account-card";

interface SocialAccountManagerProps {
  initialAccounts: SocialAccountConnection[];
  initialProviders: SocialAccountProvider[];
}

interface SocialAccountsApiResponse {
  ok: boolean;
  accounts?: SocialAccountConnection[];
  providers?: SocialAccountProvider[];
  error?: string;
}

export function SocialAccountManager({ initialAccounts, initialProviders }: SocialAccountManagerProps) {
  const [accounts, setAccounts] = useState<SocialAccountConnection[]>(initialAccounts);
  const [providers, setProviders] = useState<SocialAccountProvider[]>(initialProviders);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("socialAccountConnected");
    const connectError = params.get("socialAccountError");
    if (connected) {
      setMessage(`${connected} account connected.`);
    }
    if (connectError) {
      setError(connectError);
    }
  }, []);

  async function reload() {
    const response = await fetch("/api/social/accounts");
    const body = (await response.json()) as SocialAccountsApiResponse;
    if (!response.ok || !body.ok || !body.accounts || !body.providers) {
      throw new Error(body.error || "Unable to load social account connections.");
    }

    setAccounts(body.accounts);
    setProviders(body.providers);
  }

  async function handleRefresh(accountId: string) {
    setLoading(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const response = await fetch(`/api/social/accounts/${accountId}/refresh`, { method: "POST" });
      const body = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !body.ok) {
        throw new Error(body.error || "Unable to refresh social account token.");
      }
      await reload();
      setMessage("Social account token refreshed.");
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to refresh social account token.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect(accountId: string) {
    setLoading(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const response = await fetch(`/api/social/accounts/${accountId}/disconnect`, { method: "POST" });
      const body = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !body.ok) {
        throw new Error(body.error || "Unable to disconnect social account.");
      }
      await reload();
      setMessage("Social account disconnected.");
    } catch (disconnectError) {
      setError(disconnectError instanceof Error ? disconnectError.message : "Unable to disconnect social account.");
    } finally {
      setLoading(false);
    }
  }

  function startConnection(platform: SocialAccountPlatform) {
    setError(undefined);
    setMessage(undefined);

    const returnTo = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    const connectUrl = `/api/social/accounts/connect/${platform}?returnTo=${encodeURIComponent(returnTo)}`;
    window.location.assign(connectUrl);
  }

  const connectedPlatforms = new Set(accounts.map((account) => account.platform));

  return (
    <section className="content-schedule-panel" aria-label="Social account management">
      <div className="content-schedule-header">
        <div>
          <h2>Social account connections</h2>
          <p>Connect and manage social accounts used by publishing, scheduling, and history tracking.</p>
        </div>
      </div>

      {message ? <p className="content-schedule-success">{message}</p> : null}
      {error ? <p className="content-schedule-error">{error}</p> : null}

      <div className="content-schedule-actions">
        {providers.map((provider) => {
          const isConnected = connectedPlatforms.has(provider.platform);
          return (
            <button
              key={provider.platform}
              type="button"
              className="wizard-button-secondary"
              disabled={loading || !provider.supportsOAuth || (!provider.mvpSupported && !isConnected)}
              onClick={() => startConnection(provider.platform)}
            >
              {isConnected
                ? `Reconnect ${provider.platform}`
                : provider.mvpSupported
                  ? `Connect ${provider.platform}`
                  : `${provider.platform} (coming soon)`}
            </button>
          );
        })}
      </div>

      {accounts.length === 0 ? (
        <p>No social accounts are connected yet.</p>
      ) : (
        <div className="social-account-list">
          {accounts.map((account) => (
            <SocialAccountCard
              key={account.id}
              account={account}
              loading={loading}
              onRefresh={handleRefresh}
              onDisconnect={handleDisconnect}
            />
          ))}
        </div>
      )}
    </section>
  );
}
