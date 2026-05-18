import "server-only";

import type { User } from "@supabase/supabase-js";
import type { ProfileRole } from "@/lib/supabase/profile";
import { logger } from "@/lib/observability";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  email: string;
  role: ProfileRole;
  created_at: string;
};

type WebsiteRow = {
  id: string;
  user_id: string;
  site_title: string;
  website_type: string;
  status: string;
  generated_at: string;
  updated_at: string;
};

type PublishJobRow = {
  id: string;
  platform: string;
  status: string;
  updated_at: string;
  published_at: string | null;
  last_error: string | null;
};

type ScheduleRunRow = {
  id: string;
  status: string;
  updated_at: string;
  completed_at: string | null;
  error: string | null;
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
      systemStatus: "Unavailable",
      systemTone: "warning",
      alerts: [
        {
          id: "admin-data-unavailable",
          title: "Admin data unavailable",
          detail: "Admin metrics are temporarily unavailable, so safe fallback values are being shown instead of failing the page.",
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
    return "Profile synced";
  }

  if (user.banned_until && parseTimestamp(user.banned_until) > Date.now()) {
    return "Suspended";
  }

  if (!user.email_confirmed_at) {
    return "Pending confirmation";
  }

  return "Active";
}

function mergeUsers(authUsers: User[], profiles: ProfileRow[]): AdminUserRecord[] {
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const merged: AdminUserRecord[] = authUsers.map((authUser) => {
    const profile = profileById.get(authUser.id);

    return {
      id: authUser.id,
      email: authUser.email ?? profile?.email ?? "Unavailable",
      role: profile?.role ?? "user",
      createdAt: authUser.created_at ?? profile?.created_at ?? null,
      status: summarizeUserStatus(authUser),
    };
  });

  const knownIds = new Set(merged.map((user) => user.id));
  for (const profile of profiles) {
    if (knownIds.has(profile.id)) {
      continue;
    }

    merged.push({
      id: profile.id,
      email: profile.email || "Unavailable",
      role: profile.role,
      createdAt: profile.created_at,
      status: "Profile synced",
    });
  }

  return merged.sort((left, right) => parseTimestamp(right.createdAt) - parseTimestamp(left.createdAt));
}

function toToneFromStatus(status: string): AdminTone {
  if (status === "failed") {
    return "error";
  }

  if (status === "retry_pending" || status === "pending" || status === "publishing") {
    return "warning";
  }

  return "info";
}

function logAdminDataFallback(scope: string, error: unknown) {
  logger.warn(`${scope} falling back to safe admin defaults`, {
    category: "error",
    service: "supabase",
    error: { message: error instanceof Error ? error.message : String(error), name: "AdminDataFallbackWarning" },
  });
}

async function withAdminFallback<T>(scope: string, fallback: T, operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logAdminDataFallback(scope, error);
    return fallback;
  }
}

async function safeCount(operation: () => Promise<{ count: number | null; error: { message: string } | null }>): Promise<number> {
  try {
    const { count, error } = await operation();

    if (error) {
      return 0;
    }

    return count ?? 0;
  } catch {
    return 0;
  }
}

async function safeRows<T>(operation: () => Promise<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  try {
    const { data, error } = await operation();

    if (error) {
      return [];
    }

    return data ?? [];
  } catch {
    return [];
  }
}

async function listAuthUsers(limit = 100): Promise<User[]> {
  return withAdminFallback("listAuthUsers", [], async () => {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: limit });

    if (error) {
      return [];
    }

    return data.users ?? [];
  });
}

async function listProfileRows(limit = 100): Promise<ProfileRow[]> {
  return withAdminFallback("listProfileRows", [], async () => {
    const supabase = getSupabaseServiceClient();
    return safeRows(async () =>
      await supabase.from("profiles").select("id, email, role, created_at").order("created_at", { ascending: false }).limit(limit),
    );
  });
}

async function getEmailMap(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) {
    return new Map();
  }

  return withAdminFallback("getEmailMap", new Map<string, string>(), async () => {
    const supabase = getSupabaseServiceClient();
    const profiles = await safeRows<{ id: string; email: string }>(async () =>
      await supabase.from("profiles").select("id, email").in("id", userIds),
    );

    return new Map(profiles.map((profile) => [profile.id, profile.email]));
  });
}

async function listRecentWebsiteRows(limit = 12): Promise<WebsiteRow[]> {
  return withAdminFallback("listRecentWebsiteRows", [], async () => {
    const supabase = getSupabaseServiceClient();

    return safeRows(async () =>
      await supabase
        .from("website_structures")
        .select("id, user_id, site_title, website_type, status, generated_at, updated_at")
        .is("deleted_at", null)
        .order("generated_at", { ascending: false })
        .limit(limit),
    );
  });
}

async function listRecentPublishJobs(limit = 6): Promise<PublishJobRow[]> {
  return withAdminFallback("listRecentPublishJobs", [], async () => {
    const supabase = getSupabaseServiceClient();

    return safeRows(async () =>
      await supabase
        .from("social_publish_jobs")
        .select("id, platform, status, updated_at, published_at, last_error")
        .order("updated_at", { ascending: false })
        .limit(limit),
    );
  });
}

async function listRecentScheduleRuns(limit = 6): Promise<ScheduleRunRow[]> {
  return withAdminFallback("listRecentScheduleRuns", [], async () => {
    const supabase = getSupabaseServiceClient();

    return safeRows(async () =>
      await supabase
        .from("content_schedule_runs")
        .select("id, status, updated_at, completed_at, error")
        .order("updated_at", { ascending: false })
        .limit(limit),
    );
  });
}

async function getWebsiteCounts() {
  return withAdminFallback("getWebsiteCounts", { total: 0, published: 0, drafts: 0 }, async () => {
    const supabase = getSupabaseServiceClient();

    const [total, published, drafts] = await Promise.all([
      safeCount(async () => await supabase.from("website_structures").select("id", { count: "exact", head: true }).is("deleted_at", null)),
      safeCount(async () =>
        await supabase
          .from("website_structures")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("status", "published"),
      ),
      safeCount(async () =>
        await supabase.from("website_structures").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("status", "draft"),
      ),
    ]);

    return { total, published, drafts };
  });
}

async function getUserCounts() {
  return withAdminFallback("getUserCounts", { total: 0, admins: 0 }, async () => {
    const supabase = getSupabaseServiceClient();

    const [total, admins] = await Promise.all([
      safeCount(async () => await supabase.from("profiles").select("id", { count: "exact", head: true })),
      safeCount(async () => await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin")),
    ]);

    return { total, admins };
  });
}

async function getMonitoringCounts() {
  return withAdminFallback("getMonitoringCounts", { failedPublishJobs: 0, failedScheduleRuns: 0, totalFailed: 0 }, async () => {
    const supabase = getSupabaseServiceClient();

    const [failedPublishJobs, failedScheduleRuns] = await Promise.all([
      safeCount(async () =>
        await supabase.from("social_publish_jobs").select("id", { count: "exact", head: true }).in("status", ["failed", "retry_pending"]),
      ),
      safeCount(async () => await supabase.from("content_schedule_runs").select("id", { count: "exact", head: true }).eq("status", "failed")),
    ]);

    return {
      failedPublishJobs,
      failedScheduleRuns,
      totalFailed: failedPublishJobs + failedScheduleRuns,
    };
  });
}

function buildAlerts(
  failedPublishJobs: number,
  failedScheduleRuns: number,
  totalFailed: number,
): { alerts: AdminAlertItem[]; systemStatus: string; systemTone: AdminTone } {
  if (totalFailed === 0) {
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

  if (failedPublishJobs > 0) {
    alerts.push({
      id: "failed-publish-jobs",
      title: "Publishing jobs need attention",
      detail: `${failedPublishJobs} publish job${failedPublishJobs === 1 ? "" : "s"} are failed or waiting for retry.`,
      tone: "error",
    });
  }

  if (failedScheduleRuns > 0) {
    alerts.push({
      id: "failed-schedule-runs",
      title: "Schedule runs failed",
      detail: `${failedScheduleRuns} content schedule run${failedScheduleRuns === 1 ? "" : "s"} reported an error.`,
      tone: "warning",
    });
  }

  return {
    systemStatus: alerts.length > 0 ? "Needs attention" : "Unavailable",
    systemTone: "warning",
    alerts:
      alerts.length > 0
        ? alerts
        : [
            {
              id: "monitoring-unavailable",
              title: "Monitoring data unavailable",
              detail: "Monitoring data is unavailable, so safe fallback values are being shown.",
              tone: "warning",
            },
          ],
  };
}

function mapWebsites(rows: WebsiteRow[], emailMap: Map<string, string>): AdminWebsiteRecord[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.site_title || "Unavailable",
    ownerEmail: emailMap.get(row.user_id) ?? "Unavailable",
    status: row.status || "Unavailable",
    websiteType: row.website_type || "Unavailable",
    createdAt: row.generated_at,
    updatedAt: row.updated_at,
  }));
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
    title: `${job.platform || "Unavailable"} publish job ${job.status || "Unavailable"}`,
    detail: job.last_error ? job.last_error : "Publishing workflow updated recently.",
    timestamp: job.updated_at ?? job.published_at,
    tone: toToneFromStatus(job.status),
  }));

  const scheduleActivity: AdminActivityItem[] = scheduleRuns.map((run) => ({
    id: `schedule-${run.id}`,
    title: `Content schedule run ${run.status || "Unavailable"}`,
    detail: run.error ? run.error : "Content scheduling workflow updated recently.",
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
    const websiteRows = await listRecentWebsiteRows(limit);
    const emailMap = await getEmailMap([...new Set(websiteRows.map((row) => row.user_id))]);
    return mapWebsites(websiteRows, emailMap).slice(0, limit);
  });
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  return withAdminFallback("getAdminDashboardData", createEmptyAdminDashboardData(), async () => {
    const [allUsers, userCounts, websiteCounts, websiteRows, monitoringCounts, publishJobs, scheduleRuns] = await Promise.all([
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
    const recentSignups = countItemsSince(allUsers, 7);
    const userGrowth = countItemsSince(allUsers, 30);
    const websiteGenerationVolume = countItemsSince(
      websites.map((website) => ({ createdAt: website.createdAt })),
      30,
    );
    const alertsSummary = buildAlerts(
      monitoringCounts.failedPublishJobs,
      monitoringCounts.failedScheduleRuns,
      monitoringCounts.totalFailed,
    );

    return {
      users: {
        total: userCounts.total,
        admins: userCounts.admins,
        recentSignups,
        records: allUsers.slice(0, 6),
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
        websiteGenerationVolume,
        publishingActivity: websiteCounts.published,
        userGrowth,
      },
    };
  });
}

export function formatAdminDate(value: string | null | undefined): string {
  if (!value) {
    return "No data yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "No data yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
