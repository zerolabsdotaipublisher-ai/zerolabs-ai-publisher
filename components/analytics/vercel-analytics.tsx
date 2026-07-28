import { Analytics } from "@vercel/analytics/next";

export const VERCEL_ANALYTICS_COMPONENT_LOCATION = "app/layout.tsx";
export const VERCEL_ANALYTICS_COMPONENT_RENDERED = true;

const analyticsMode =
  process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production"
    ? "production"
    : "development";

export const VERCEL_ANALYTICS_RUNTIME_MODE = analyticsMode;

export function VercelAnalyticsTracker() {
  return <Analytics mode={analyticsMode} />;
}
