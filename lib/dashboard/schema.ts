import { routes } from "@/config/routes";
import type { DashboardQuickAction } from "./types";

export const DASHBOARD_MAX_RECENT_ACTIVITY = 12;

export const DASHBOARD_QUICK_ACTIONS: DashboardQuickAction[] = [
  {
    id: "create-website",
    label: "Create new website",
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
    id: "open-drafts",
    label: "Open drafts",
    description: "Review websites that are still in draft before publishing.",
    href: `${routes.websites}?status=draft`,
    eventName: "dashboard_quick_action_open_drafts",
  },
  {
    id: "view-insights",
    label: "View Insights",
    description: "Review performance and workspace insights.",
    href: routes.insights,
    eventName: "dashboard_quick_action_view_insights",
  },
  {
    id: "open-feed",
    label: "Open Feed",
    description: "Share websites and follow updates from the community.",
    href: routes.feed,
    eventName: "dashboard_quick_action_open_feed",
  },
  {
    id: "content-library",
    label: "Content library",
    description: "Browse and manage generated websites, blogs, articles, and social content.",
    href: routes.contentLibrary,
    eventName: "dashboard_quick_action_content_library",
  },
  {
    id: "approval-queue",
    label: "Approval queue",
    description: "Submit, approve, reject, request changes, and track approval before publishing.",
    href: routes.approval,
    eventName: "dashboard_quick_action_approval_queue",
  },
];

export const DASHBOARD_MVP_BOUNDARIES = [
  "Dashboard is an AI Publisher homepage summary only (not a full analytics platform).",
  "Metrics are owner-scoped snapshots aggregated from existing website and content systems.",
  "Quick actions route users into existing workflows; dashboard does not add duplicate management or publishing pipelines.",
  "Alerting is lightweight and in-app only; no external notification delivery is introduced.",
] as const;
