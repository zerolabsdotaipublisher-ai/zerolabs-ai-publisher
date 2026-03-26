/**
 * Central configuration entry point.
 *
 * This is the single public API for all application configuration. Prefer
 * importing from "@/config" over reaching into individual config files.
 *
 * ⚠️  Server-side only — do not import in client components.
 *     The services config contains server secrets (Supabase service role key,
 *     OpenAI API key, etc.) that must not be exposed to the browser.
 *     Use getPublicConfig() to obtain the browser-safe subset.
 *
 * Usage:
 *
 *   import { config, isProduction, getPublicConfig } from "@/config";
 *
 *   const model = config.services.openai.model;
 *   const name  = config.app.name;
 *   if (isProduction()) { ... }
 *
 * See docs/setup/configuration.md for the full architecture guide.
 */

export type { AppConfig, PublicAppConfig } from "./app";
export type {
  AuthConfig,
  BillingConfig,
  DatabaseConfig,
  EmailConfig,
  OpenAIConfig,
  QdrantConfig,
  ServiceConfig,
  SupabaseConfig,
  WasabiConfig,
  ZeroFlowConfig,
} from "./services";
export type { FeatureFlags } from "./features";
export type { RuntimeEnvironment } from "./env";

export { appConfig, publicAppConfig } from "./app";
export { servicesConfig } from "./services";
export { features } from "./features";
export { env, validateEnv } from "./env";
export { routes } from "./routes";

import { appConfig, publicAppConfig } from "./app";
import type { PublicAppConfig } from "./app";
import { servicesConfig } from "./services";
import { features } from "./features";
import { env } from "./env";

// ---------------------------------------------------------------------------
// Unified config object
// ---------------------------------------------------------------------------

/**
 * Unified application configuration object.
 * Server-side only — contains service secrets.
 */
export const config = {
  /** App metadata and operational settings */
  app: appConfig,
  /** External service configs grouped by provider */
  services: servicesConfig,
  /** Feature flag values */
  features,
} as const;

// ---------------------------------------------------------------------------
// Environment helpers
// ---------------------------------------------------------------------------

/** Returns true when running in a Vercel production deployment or a
 *  NODE_ENV=production build. */
export function isProduction(): boolean {
  return env.runtime.stage === "production";
}

/** Returns true when running in a Vercel preview deployment (branch / PR). */
export function isPreview(): boolean {
  return env.runtime.stage === "preview";
}

/** Returns true in local development or any context that is neither
 *  production nor preview. */
export function isDevelopment(): boolean {
  return env.runtime.stage === "development";
}

// ---------------------------------------------------------------------------
// Browser-safe helpers
// ---------------------------------------------------------------------------

/**
 * Returns the browser-safe subset of app configuration.
 * Safe to pass as props to Client Components or serialize into page metadata.
 * All fields are backed by NEXT_PUBLIC_* environment variables.
 */
export function getPublicConfig(): PublicAppConfig {
  return publicAppConfig;
}
