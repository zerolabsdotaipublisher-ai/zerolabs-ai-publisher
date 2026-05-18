import "server-only";

import type { User } from "@supabase/supabase-js";
import type { ProfileRole } from "@/lib/supabase/profile";
import { logger } from "@/lib/observability";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

const FALLBACK_UNAVAILABLE_LABEL = "Unavailable";
const DEFAULT_RECENT_RECORD_LIMIT = 12;

type ProfileRow = {
  id: string;
  email: string;
  role: ProfileRole;
  created_at: string;
};

type WebsiteRow = {
  id: string;
  user_id: string;
  site_title: string | null;
  website_type: string | null;
  status: string | null;
  generated_at: string | null;
  updated_at: string | null;
};

type PublishJobRow = {
  id: string;
  platform: string | null;
  status: string | null;
  updated_at: string | null;
  published_at: string | null;
  last_error: string | null;
};

type ScheduleRunRow = {
  id: string;
  status: string | null;
  updated_at: string | null;
  completed_at: string | null;
  error: string | null;
};

type MonitoringCounts = {
  failedPublishJobs: number;
  failedScheduleRuns: number;
  totalFailed: number;
  isAvailable: boolean;
};

type SafeCountResult = {
  value: number;
  isAvailable: boolean;
};

export type AdminTone = "info" | "warning" | "error";

export interface AdminUserRecord {
  id: string;
  email: string;
  role: ProfileRole;
  createdAt: string | null;
  status: string;
}

export interface AdminWebsiteRecord {
  id: string;
  title: string;
  ownerEmail: string;
  status: string;
  websiteType: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminActivityItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string | null;
  tone: AdminTone;
}

export interface AdminAlertItem {
  id: string;
  title: string;
  detail: string;
  tone: AdminTone;
}

export interface AdminDashboardData {
  users: {
    total: number;
    admins: number;
    recentSignups: number;
    records: AdminUserRecord[];
  };
  websites: {
    total: number;
    published: number;
    drafts: number;
    records: AdminWebsiteRecord[];
  };
  monitoring: {
    failedJobs: number;
    systemStatus: string;
    systemTone: AdminTone;
    alerts: AdminAlertItem[];
    recentActivity: AdminActivityItem[];
  };
  analytics: {
    websiteGenerationVolume: number;
    publishingActivity: number;
    userGrowth: number;
  };
}

function createEmptyAdminDashboardData(): AdminDashboardData {
  return {
    users: {
      total: 0,
      admins: 0,
      recentSignups: 0,
      records: [],
    },
    websites: {
      total: 0,
      published: 0,
      drafts: 0,
      records: [],
    },
    monitoring: {
      failedJobs: 0,
      systemStatus: FALLBACK_UNAVAILABLE_LABEL,
      systemTone: "warning",
      alerts: [
        {
          id: "monitoring-unavailable",
          title: "Monitoring data unavailable",
          detail: "Admin monitoring data is unavailable, so safe fallback values are being shown.",
          tone: "warning",
        },
      ],
      recentActivity: [],
    },
    analytics: {
      websiteGenerationVolume: 0,
      publishingActivity: 0,
      userGrowth: 0,
    },
  };
}

function logAdminFallback(scope: string, error: unknown): void {
  logger.warn(`${scope} fell back to safe admin defaults`, {
    category: "error",
    service: "supabase",
    error: { message: error instanceof Error ? error.message : String(error), name: "AdminDataFallbackWarning" },
  });
}

async function withAdminFallback<T>(scope: string, fallback: T, operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logAdminFallback(scope, error);
    return fallback;
  }
}

function parseTimestamp(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function countItemsSince(values: Array<{ createdAt: string | null }>, days: number): number {
  if (values.length === 0) {
    return 0;
  }

  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  return values.filter((value) => parseTimestamp(value.createdAt) >= threshold).length;
}

function summarizeUserStatus(user?: User): string {
  if (!user) {
    return FALLBACK_UNAVAILABLE_LABEL;
  }

  if (user.banned_until && parseTimestamp(user.banned_until) > Date.now()) {
    return "Suspended";
  }

  if (!user.email_confirmed_at) {
    return "Pending confirmation";
  }

  return "Active";
}

function toToneFromStatus(status: string | null | undefined): AdminTone {
  if (status === "failed") {
    return "error";
  }

  if (status === "retry_pending" || status === "pending" || status === "publishing") {
    return "warning";
  }

  return "info";
}

async function safeRows<T>(scope: string, operation: () => Promise<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  return withAdminFallback(scope, [], async () => {
    const { data, error } = await operation();

    if (error) {
      logAdminFallback(scope, error.message);
      return [];
    }

    return data ?? [];
  });
}

async function safeCount(scope: string, operation: () => Promise<{ count: number | null; error: { message: string } | null }>): Promise<SafeCountResult> {
  return withAdminFallback(scope, { value: 0, isAvailable: false }, async () => {
    const { count, error } = await operation();

    if (error) {
      logAdminFallback(scope, error.message);
      return { value: 0, isAvailable: false };
    }

    return {
      value: count ?? 0,
      isAvailable: true,
    };
  });
}

async function listAuthUsers(limit = 100): Promise<User[]> {
  return withAdminFallback("listAuthUsers", [], async () => {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: limit });

    if (error) {
      logAdminFallback("listAuthUsers", error.message);
      return [];
    }

    return data.users ?? [];
  });
}

async function listProfileRows(limit = 100): Promise<ProfileRow[]> {
  return safeRows("listProfileRows", async () => {
    const supabase = getSupabaseServiceClient();
    return await supabase.from("profiles").select("id, email, role, created_at").order("created_at", { ascending: false }).limit(limit);
  });
}

async function getEmailMap(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const profiles = await safeRows<{ id: string; email: string }>("getEmailMap", async () => {
    const supabase = getSupabaseServiceClient();
    return await supabase.from("profiles").select("id, email").in("id", userIds);
  });

  return new Map(profiles.map((profile) => [profile.id, profile.email]));
}

async function listRecentWebsiteRows(limit = DEFAULT_RECENT_RECORD_LIMIT): Promise<WebsiteRow[]> {
  return safeRows("listRecentWebsiteRows", async () => {
    const supabase = getSupabaseServiceClient();
    return await supabase
      .from("website_structures")
      .select("id, user_id, site_title, website_type, status, generated_at, updated_at")
      .is("deleted_at", null)
      .order("generated_at", { ascending: false })
      .limit(limit);
  });
}

async function listRecentPublishJobs(limit = 6): Promise<PublishJobRow[]> {
  return safeRows("listRecentPublishJobs", async () => {
    const supabase = getSupabaseServiceClient();
    return await supabase
      .from("social_publish_jobs")
      .select("id, platform, status, updated_at, published_at, last_error")
      .order("updated_at", { ascending: false })
      .limit(limit);
  });
}

async function listRecentScheduleRuns(limit = 6): Promise<ScheduleRunRow[]> {
  return safeRows("listRecentScheduleRuns", async () => {
    const supabase = getSupabaseServiceClient();
    return await supabase
      .from("content_schedule_runs")
      .select("id, status, updated_at, completed_at, error")
      .order("updated_at", { ascending: false })
      .limit(limit);
  });
}

async function getUserCounts(): Promise<{ total: number; admins: number }> {
  const [total, admins] = await Promise.all([
    safeCount("getUserCounts.total", async () => {
      const supabase = getSupabaseServiceClient();
      return await supabase.from("profiles").select("id", { count: "exact", head: true });
    }),
    safeCount("getUserCounts.admins", async () => {
      const supabase = getSupabaseServiceClient();
      return await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
    }),
  ]);

  return {
    total: total.value,
    admins: admins.value,
  };
}

async function getWebsiteCounts(): Promise<{ total: number; published: number; drafts: number }> {
  const [total, published, drafts] = await Promise.all([
    safeCount("getWebsiteCounts.total", async () => {
      const supabase = getSupabaseServiceClient();
      return await supabase.from("website_structures").select("id", { count: "exact", head: true }).is("deleted_at", null);
    }),
    safeCount("getWebsiteCounts.published", async () => {
      const supabase = getSupabaseServiceClient();
      return await supabase.from("website_structures").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("status", "published");
    }),
    safeCount("getWebsiteCounts.drafts", async () => {
      const supabase = getSupabaseServiceClient();
      return await supabase.from("website_structures").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("status", "draft");
    }),
  ]);

  return {
    total: total.value,
    published: published.value,
    drafts: drafts.value,
  };
}

async function getMonitoringCounts(): Promise<MonitoringCounts> {
  const [failedPublishJobs, failedScheduleRuns] = await Promise.all([
    safeCount("getMonitoringCounts.failedPublishJobs", async () => {
      const supabase = getSupabaseServiceClient();
      return await supabase.from("social_publish_jobs").select("id", { count: "exact", head: true }).in("status", ["failed", "retry_pending"]);
    }),
    safeCount("getMonitoringCounts.failedScheduleRuns", async () => {
      const supabase = getSupabaseServiceClient();
      return await supabase.from("content_schedule_runs").select("id", { count: "exact", head: true }).eq("status", "failed");
    }),
  ]);

  return {
    failedPublishJobs: failedPublishJobs.value,
    failedScheduleRuns: failedScheduleRuns.value,
    totalFailed: failedPublishJobs.value + failedScheduleRuns.value,
    isAvailable: failedPublishJobs.isAvailable || failedScheduleRuns.isAvailable,
  };
}

function mergeUsers(authUsers: User[], profiles: ProfileRow[]): AdminUserRecord[] {
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const mergedUsers: AdminUserRecord[] = authUsers.map((authUser) => {
    const profile = profileById.get(authUser.id);

    return {
      id: authUser.id,
      email: authUser.email ?? profile?.email ?? FALLBACK_UNAVAILABLE_LABEL,
      role: profile?.role ?? "user",
      createdAt: authUser.created_at ?? profile?.created_at ?? null,
      status: summarizeUserStatus(authUser),
    };
  });

  const knownIds = new Set(mergedUsers.map((user) => user.id));
  for (const profile of profiles) {
    if (knownIds.has(profile.id)) {
      continue;
    }

    mergedUsers.push({
      id: profile.id,
      email: profile.email || FALLBACK_UNAVAILABLE_LABEL,
      role: profile.role,
      createdAt: profile.created_at,
      status: FALLBACK_UNAVAILABLE_LABEL,
    });
  }

  return mergedUsers.sort((left, right) => parseTimestamp(right.createdAt) - parseTimestamp(left.createdAt));
}

function mapWebsites(rows: WebsiteRow[], emailMap: Map<string, string>): AdminWebsiteRecord[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.site_title ?? FALLBACK_UNAVAILABLE_LABEL,
    ownerEmail: emailMap.get(row.user_id) ?? FALLBACK_UNAVAILABLE_LABEL,
    status: row.status ?? FALLBACK_UNAVAILABLE_LABEL,
    websiteType: row.website_type ?? FALLBACK_UNAVAILABLE_LABEL,
    createdAt: row.generated_at,
    updatedAt: row.updated_at,
  }));
}

function buildAlerts(monitoringCounts: MonitoringCounts): { alerts: AdminAlertItem[]; systemStatus: string; systemTone: AdminTone } {
  if (!monitoringCounts.isAvailable) {
    return {
      systemStatus: FALLBACK_UNAVAILABLE_LABEL,
      systemTone: "warning",
      alerts: [
        {
          id: "monitoring-unavailable",
          title: "Monitoring data unavailable",
          detail: "Admin monitoring data is unavailable, so safe fallback values are being shown.",
          tone: "warning",
        },
      ],
    };
  }

  if (monitoringCounts.totalFailed === 0) {
    return {
      systemStatus: "Healthy",
      systemTone: "info",
      alerts: [
        {
          id: "healthy",
          title: "No failed jobs detected",
          detail: "Publishing and scheduling checks are clear right now.",
          tone: "info",
        },
      ],
    };
  }

  const alerts: AdminAlertItem[] = [];

  if (monitoringCounts.failedPublishJobs > 0) {
    alerts.push({
      id: "failed-publish-jobs",
      title: "Publishing jobs need attention",
      detail: `${monitoringCounts.failedPublishJobs} publish job${monitoringCounts.failedPublishJobs === 1 ? "" : "s"} are failed or waiting for retry.`,
      tone: "error",
    });
  }

  if (monitoringCounts.failedScheduleRuns > 0) {
    alerts.push({
      id: "failed-schedule-runs",
      title: "Schedule runs failed",
      detail: `${monitoringCounts.failedScheduleRuns} content schedule run${monitoringCounts.failedScheduleRuns === 1 ? "" : "s"} reported an error.`,
      tone: "warning",
    });
  }

  return {
    systemStatus: "Needs attention",
    systemTone: "warning",
    alerts,
  };
}

function buildRecentActivity(
  websites: AdminWebsiteRecord[],
  publishJobs: PublishJobRow[],
  scheduleRuns: ScheduleRunRow[],
): AdminActivityItem[] {
  const websiteActivity: AdminActivityItem[] = websites.slice(0, 4).map((website) => ({
    id: `website-${website.id}`,
    title: `${website.title} updated`,
    detail: `${website.websiteType} website · ${website.status} · ${website.ownerEmail}`,
    timestamp: website.updatedAt ?? website.createdAt,
    tone: website.status === "published" ? "info" : "warning",
  }));

  const publishActivity: AdminActivityItem[] = publishJobs.map((job) => ({
    id: `publish-${job.id}`,
    title: `${job.platform ?? FALLBACK_UNAVAILABLE_LABEL} publish job ${job.status ?? FALLBACK_UNAVAILABLE_LABEL}`,
    detail: job.last_error ?? "Publishing workflow updated recently.",
    timestamp: job.updated_at ?? job.published_at,
    tone: toToneFromStatus(job.status),
  }));

  const scheduleActivity: AdminActivityItem[] = scheduleRuns.map((run) => ({
    id: `schedule-${run.id}`,
    title: `Content schedule run ${run.status ?? FALLBACK_UNAVAILABLE_LABEL}`,
    detail: run.error ?? "Content scheduling workflow updated recently.",
    timestamp: run.updated_at ?? run.completed_at,
    tone: run.status === "failed" ? "error" : "info",
  }));

  return [...websiteActivity, ...publishActivity, ...scheduleActivity]
    .sort((left, right) => parseTimestamp(right.timestamp) - parseTimestamp(left.timestamp))
    .slice(0, 6);
}

export async function listAdminUsers(limit = 25): Promise<AdminUserRecord[]> {
  return withAdminFallback("listAdminUsers", [], async () => {
    const [authUsers, profiles] = await Promise.all([listAuthUsers(Math.max(limit, 100)), listProfileRows(Math.max(limit, 100))]);
    return mergeUsers(authUsers, profiles).slice(0, limit);
  });
}

export async function listAdminWebsites(limit = 25): Promise<AdminWebsiteRecord[]> {
  return withAdminFallback("listAdminWebsites", [], async () => {
    const websiteRows = await listRecentWebsiteRows(Math.max(limit, DEFAULT_RECENT_RECORD_LIMIT));
    const emailMap = await getEmailMap([...new Set(websiteRows.map((row) => row.user_id))]);
    return mapWebsites(websiteRows, emailMap).slice(0, limit);
  });
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  return withAdminFallback("getAdminDashboardData", createEmptyAdminDashboardData(), async () => {
    const [users, userCounts, websiteCounts, websiteRows, monitoringCounts, publishJobs, scheduleRuns] = await Promise.all([
      listAdminUsers(100),
      getUserCounts(),
      getWebsiteCounts(),
      listRecentWebsiteRows(100),
      getMonitoringCounts(),
      listRecentPublishJobs(4),
      listRecentScheduleRuns(4),
    ]);

    const emailMap = await getEmailMap([...new Set(websiteRows.map((row) => row.user_id))]);
    const websites = mapWebsites(websiteRows, emailMap);
    const alertsSummary = buildAlerts(monitoringCounts);

    return {
      users: {
        total: userCounts.total,
        admins: userCounts.admins,
        recentSignups: countItemsSince(users, 7),
        records: users.slice(0, 6),
      },
      websites: {
        total: websiteCounts.total,
        published: websiteCounts.published,
        drafts: websiteCounts.drafts,
        records: websites.slice(0, 8),
      },
      monitoring: {
        failedJobs: monitoringCounts.totalFailed,
        systemStatus: alertsSummary.systemStatus,
        systemTone: alertsSummary.systemTone,
        alerts: alertsSummary.alerts,
        recentActivity: buildRecentActivity(websites, publishJobs, scheduleRuns),
      },
      analytics: {
        websiteGenerationVolume: countItemsSince(websites.map((website) => ({ createdAt: website.createdAt })), 30),
        publishingActivity: websiteCounts.published,
        userGrowth: countItemsSince(users, 30),
      },
    };
  });
}

export function formatAdminDate(value: string | null | undefined): string {
  if (!value) {
    return FALLBACK_UNAVAILABLE_LABEL;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return FALLBACK_UNAVAILABLE_LABEL;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
