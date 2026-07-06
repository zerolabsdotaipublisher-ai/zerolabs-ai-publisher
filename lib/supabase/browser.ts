"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | undefined;
let appUrl: string | undefined;

function resolveBrowserOrigin(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const origin = window.location.origin?.trim();
  return origin ? origin : null;
}

export type SupabaseBrowserConfig = {
  url: string;
  anonKey: string;
  appUrl: string;
};

export function initializeSupabaseBrowserClient(config: SupabaseBrowserConfig): SupabaseClient {
  appUrl = config.appUrl;

  if (!browserClient) {
    browserClient = createBrowserClient(config.url, config.anonKey);
  }

  return browserClient;
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    throw new Error("Supabase browser client is not initialized");
  }

  return browserClient;
}

export function getSupabaseAppUrl(): string {
  const browserOrigin = resolveBrowserOrigin();
  if (browserOrigin) {
    return browserOrigin;
  }

  if (!appUrl) {
    throw new Error("Supabase browser config is not initialized");
  }

  return appUrl;
}
