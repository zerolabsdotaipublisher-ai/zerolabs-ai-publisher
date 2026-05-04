import { routes } from "@/config/routes";
import type { DashboardQuickAction } from "./types";

export const DASHBOARD_MAX_RECENT_ACTIVITY = 12;

export const DASHBOARD_QUICK_ACTIONS: DashboardQuickAction[] = [
  {
    id: "create-website",
    label: "Create website",
    description: "Start a new AI website project.",
    href: routes.createWebsite,
    eventName: "dashboard_quick_action_create_website",
  },
  {
    id: "generate-content",
    label: "Generate content",
    description: "Open generation workflows for fresh drafts.",
    href: routes.generateWebsite,
    eventName: "dashboard_quick_action_generate_content",
  },
  {
    id: "view-websites",
    label: "View websites",
    description: "Manage website status, metadata, and publishing.",
    href: routes.websites,
    eventName: "dashboard_quick_action_view_websites",
  },
  {
    id: "schedule-social",
    label: "Schedule social post",
    description: "Use social scheduling from your website workflows.",
    href: routes.websites,
    eventName: "dashboard_quick_action_schedule_social_post",
  },
  {
    id: "connect-social-account",
    label: "Connect social account",
    description: "Connect Instagram account used by social publishing.",
    href: `/api/social/accounts/connect/instagram?returnTo=${encodeURIComponent(routes.dashboard)}`,
    eventName: "dashboard_quick_action_connect_social_account",
  },
];

export const DASHBOARD_MVP_BOUNDARIES = [
  "Dashboard is an AI Publisher homepage summary only (not a full analytics platform).",
  "Metrics are owner-scoped snapshots aggregated from existing website, content, scheduling, social history, and account systems.",
  "Quick actions route users into existing workflows; dashboard does not add duplicate management or publishing pipelines.",
  "Social account connection action targets current MVP-supported provider flow (Instagram).",
  "Alerting is lightweight and in-app only; no external notification delivery is introduced.",
] as const;
