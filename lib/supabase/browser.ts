"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | undefined;
let appUrl: string | undefined;

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
  if (!appUrl) {
    throw new Error("Supabase browser config is not initialized");
  }

  return appUrl;
}
