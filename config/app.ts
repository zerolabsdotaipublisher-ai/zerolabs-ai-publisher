/**
 * Application-level configuration.
 *
 * Composes typed app metadata and operational defaults from the raw
 * environment values in config/env.ts. Server-side only — only import
 * in server-side code (API routes, Server Components, server actions).
 *
 * Import from "@/config" for the unified entry point.
 */

import type { RuntimeEnvironment } from "./env";
import { env } from "./env";

/** Full application configuration — server-side only. */
export interface AppConfig {
  /** Display name shown in the UI */
  name: string;
  /** Short description of the application */
  description: string;
  /** Canonical base URL for this deployment */
  url: string;
  /** Current runtime stage */
  environment: RuntimeEnvironment;
}

/**
 * Browser-safe subset of AppConfig.
 * Only includes values backed by NEXT_PUBLIC_* variables — safe to pass to
 * client components or serialize into page props.
 */
export interface PublicAppConfig {
  /** Display name shown in the UI */
  name: string;
  /** Canonical base URL for this deployment */
  url: string;
  /** Current runtime stage */
  environment: RuntimeEnvironment;
}

export const appConfig: AppConfig = {
  name: env.app.name,
  description: "AI-powered publishing application",
  url: env.app.url,
  environment: env.runtime.stage,
};

export const publicAppConfig: PublicAppConfig = {
  name: appConfig.name,
  url: appConfig.url,
  environment: appConfig.environment,
};
