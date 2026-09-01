import { routes } from "@/config/routes";
import type { SocialAccountConnection } from "@/lib/social/accounts";
import type { DashboardQuickAction } from "./types";

export const DASHBOARD_MAX_RECENT_ACTIVITY = 12;

export const DASHBOARD_QUICK_ACTIONS: DashboardQuickAction[] = [
  {
    id: "create-website",
    label: "Create new website",
    description: "Start a new AI website project.",
    href: routes.generateWebsite,
    eventName: "dashboard_quick_action_create_website",
  },
  {
    id: "open-drafts",
    label: "Open drafts",
    description: "Manage your unpublished websites.",
    href: routes.websites,
    eventName: "dashboard_quick_action_open_drafts",
  },
  {
    id: "share-to-feed",
    label: "Share to Feed",
    description: "Share your public websites with the community.",
    href: routes.feed,
    eventName: "dashboard_quick_action_share_to_feed",
  },
  {
    id: "view-insights",
    label: "View Insights",
    description: "See analytics and performance.",
    href: routes.insights,
    eventName: "dashboard_quick_action_view_insights",
  },
];

export const DASHBOARD_MVP_BOUNDARIES = [
  "Dashboard is an AI Publisher homepage summary only (not a full analytics platform).",
  "Metrics are owner-scoped snapshots aggregated from existing website, content, scheduling, social history, and account systems.",
  "Quick actions route users into existing workflows; dashboard does not add duplicate management or publishing pipelines.",
  "Social account connection action targets current MVP-supported provider flow (Instagram).",
  "Alerting is lightweight and in-app only; no external notification delivery is introduced.",
] as const;

export function isAccountAttentionRequired(account: SocialAccountConnection): boolean {
  return (
    account.reauthorizationRequired ||
    ["expired", "invalid", "reauthorization_required"].includes(account.status)
  );
}
