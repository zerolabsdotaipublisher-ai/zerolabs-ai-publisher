/**
 * Feature flag configuration.
 *
 * Provides a typed, centralized set of boolean flags that gate feature areas.
 * Flags default to false when their corresponding environment variable is
 * absent or set to any value other than "true".
 *
 * Add a new flag by:
 *   1. Adding the env var to .env.example
 *   2. Reading it in config/env.ts under env.features
 *   3. Declaring the field in FeatureFlags below
 *   4. Mapping it in the features export below
 *
 * Import from "@/config" for the unified entry point.
 */

import { env } from "./env";

/** All application feature flags. */
export interface FeatureFlags {
  /** Enable analytics collection (ENABLE_ANALYTICS) */
  enableAnalytics: boolean;
  /** Enable billing and subscription features (ENABLE_BILLING) */
  enableBilling: boolean;
  /** Enable content publishing workflows (ENABLE_PUBLISHING) */
  enablePublishing: boolean;
  /** Enable project creation and management (ENABLE_PROJECT_CREATION) */
  enableProjectCreation: boolean;
  /** Enable ZeroFlow platform integration (ENABLE_ZEROFLOW_INTEGRATION) */
  enableZeroFlowIntegration: boolean;
}

export const features: FeatureFlags = {
  enableAnalytics: env.features.enableAnalytics,
  enableBilling: env.features.enableBilling,
  enablePublishing: env.features.enablePublishing,
  enableProjectCreation: env.features.enableProjectCreation,
  enableZeroFlowIntegration: env.features.enableZeroFlowIntegration,
};
