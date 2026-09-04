import "server-only";

/**
 * Central configuration entry point.
 *
 * This is the single public API for server-side application configuration.
 * Prefer importing from "@/config" over reaching into individual server
 * config files.
 *
 * The services config contains server secrets (Supabase service role key,
 * OpenAI API key, etc.) that must not be exposed to the browser.
 * Use "@/config/public" for client-safe application config.
 *
 * Usage:
 *
 *   import { config, isProduction } from "@/config";
 *
 *   const model = config.services.openai.model;
 *   const name = config.app.name;
 *   if (isProduction()) { ... }
 */

export type { AppConfig } from "./app";
export type {
  AuthConfig,
  BillingConfig,
  DatabaseConfig,
  EmailConfig,
  OpenAIConfig,
  MediaConfig,
  MetaConfig,
  PipelineConfig,
  QdrantConfig,
  SchedulerConfig,
  ServiceConfig,
  SupabaseConfig,
  WasabiConfig,
  ZeroFlowConfig,
} from "./services";
export type { FeatureFlags } from "./features";
export type { RuntimeEnvironment } from "./env";

export { appConfig } from "./app";
export { servicesConfig } from "./services";
export { features } from "./features";
export { env, validateEnv } from "./env";
export { routes } from "./routes";

import { appConfig } from "./app";
import { servicesConfig } from "./services";
import { features } from "./features";
import { env } from "./env";

export const config = {
  app: appConfig,
  services: servicesConfig,
  features,
} as const;

export function isProduction(): boolean {
  return env.runtime.stage === "production";
}

export function isPreview(): boolean {
  return env.runtime.stage === "preview";
}

export function isDevelopment(): boolean {
  return env.runtime.stage === "development";
}
