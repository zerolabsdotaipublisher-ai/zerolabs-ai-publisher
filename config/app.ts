import "server-only";

/**
 * Application-level configuration.
 *
 * Composes typed app metadata and operational defaults from the raw
 * environment values in config/env.ts. Server-side only - only import
 * in server-side code (API routes, Server Components, server actions).
 *
 * Import from "@/config" for the unified server-only entry point.
 */

import type { RuntimeEnvironment } from "./env";
import { env } from "./env";

/** Full application configuration - server-side only. */
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

export const appConfig: AppConfig = {
  name: env.app.name,
  description: "AI-powered publishing application",
  url: env.app.url,
  environment: env.runtime.stage,
};
