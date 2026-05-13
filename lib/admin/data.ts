import "server-only";

import type { User } from "@supabase/supabase-js";
import type { ProfileRole } from "@/lib/supabase/profile";
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
    total: number | null;
    admins: number | null;
    recentSignups: number | null;
    records: AdminUserRecord[];
  };
  websites: {
    total: number | null;
    published: number | null;
    drafts: number | null;
    records: AdminWebsiteRecord[];
  };
  monitoring: {
    failedJobs: number | null;
    systemStatus: string;
    systemTone: AdminTone;
    alerts: AdminAlertItem[];
    recentActivity: AdminActivityItem[];
  };
  analytics: {
    websiteGenerationVolume: number | null;
    publishingActivity: number | null;
    userGrowth: number | null;
  };
}

function parseTimestamp(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function countItemsSince(values: Array<{ createdAt: string | null }>, days: number): number | null {
  if (values.length === 0) {
    return null;
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
      email: authUser.email ?? profile?.email ?? "Unknown email",
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
      email: profile.email,
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

async function safeCount(operation: () => Promise<{ count: number | null; error: { message: string } | null }>): Promise<number | null> {
  try {
    const { count, error } = await operation();

    if (error) {
      return null;
    }

    return count ?? 0;
  } catch {
    return null;
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
  const supabase = getSupabaseServiceClient();

  try {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: limit });

    if (error) {
      return [];
    }

    return data.users ?? [];
  } catch {
    return [];
  }
}

async function listProfileRows(limit = 100): Promise<ProfileRow[]> {
  const supabase = getSupabaseServiceClient();

  return safeRows(() =>
    supabase.from("profiles").select("id, email, role, created_at").order("created_at", { ascending: false }).limit(limit),
  );
}

async function getEmailMap(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const supabase = getSupabaseServiceClient();
  const profiles = await safeRows<{ id: string; email: string }>(() =>
    supabase.from("profiles").select("id, email").in("id", userIds),
  );

  return new Map(profiles.map((profile) => [profile.id, profile.email]));
}

async function listRecentWebsiteRows(limit = 12): Promise<WebsiteRow[]> {
  const supabase = getSupabaseServiceClient();

  return safeRows(() =>
    supabase
      .from("website_structures")
      .select("id, user_id, site_title, website_type, status, generated_at, updated_at")
      .is("deleted_at", null)
      .order("generated_at", { ascending: false })
      .limit(limit),
  );
}

async function listRecentPublishJobs(limit = 6): Promise<PublishJobRow[]> {
  const supabase = getSupabaseServiceClient();

  return safeRows(() =>
    supabase
      .from("social_publish_jobs")
      .select("id, platform, status, updated_at, published_at, last_error")
      .order("updated_at", { ascending: false })
      .limit(limit),
  );
}

async function listRecentScheduleRuns(limit = 6): Promise<ScheduleRunRow[]> {
  const supabase = getSupabaseServiceClient();

  return safeRows(() =>
    supabase
      .from("content_schedule_runs")
      .select("id, status, updated_at, completed_at, error")
      .order("updated_at", { ascending: false })
      .limit(limit),
  );
}

async function getWebsiteCounts() {
  const supabase = getSupabaseServiceClient();

  const [total, published, drafts] = await Promise.all([
    safeCount(() => supabase.from("website_structures").select("id", { count: "exact", head: true }).is("deleted_at", null)),
    safeCount(() =>
      supabase
        .from("website_structures")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("status", "published"),
    ),
    safeCount(() =>
      supabase.from("website_structures").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("status", "draft"),
    ),
  ]);

  return { total, published, drafts };
}

async function getUserCounts() {
  const supabase = getSupabaseServiceClient();

  const [total, admins] = await Promise.all([
    safeCount(() => supabase.from("profiles").select("id", { count: "exact", head: true })),
    safeCount(() => supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin")),
  ]);

  return { total, admins };
}

async function getMonitoringCounts() {
  const supabase = getSupabaseServiceClient();

  const [failedPublishJobs, failedScheduleRuns] = await Promise.all([
    safeCount(() =>
      supabase.from("social_publish_jobs").select("id", { count: "exact", head: true }).in("status", ["failed", "retry_pending"]),
    ),
    safeCount(() => supabase.from("content_schedule_runs").select("id", { count: "exact", head: true }).eq("status", "failed")),
  ]);

  const totalFailed =
    failedPublishJobs === null && failedScheduleRuns === null
      ? null
      : (failedPublishJobs ?? 0) + (failedScheduleRuns ?? 0);

  return { failedPublishJobs, failedScheduleRuns, totalFailed };
}

function buildAlerts(
  failedPublishJobs: number | null,
  failedScheduleRuns: number | null,
  totalFailed: number | null,
): { alerts: AdminAlertItem[]; systemStatus: string; systemTone: AdminTone } {
  if (totalFailed === null) {
    return {
      systemStatus: "Monitoring limited",
      systemTone: "warning",
      alerts: [
        {
          id: "monitoring-unavailable",
          title: "Monitoring data unavailable",
          detail: "No monitoring tables responded yet. The admin dashboard is showing a stable placeholder state.",
          tone: "warning",
        },
      ],
    };
  }

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

  if ((failedPublishJobs ?? 0) > 0) {
    alerts.push({
      id: "failed-publish-jobs",
      title: "Publishing jobs need attention",
      detail: `${failedPublishJobs} publish job${failedPublishJobs === 1 ? "" : "s"} are failed or waiting for retry.`,
      tone: "error",
    });
  }

  if ((failedScheduleRuns ?? 0) > 0) {
    alerts.push({
      id: "failed-schedule-runs",
      title: "Schedule runs failed",
      detail: `${failedScheduleRuns} content schedule run${failedScheduleRuns === 1 ? "" : "s"} reported an error.`,
      tone: "warning",
    });
  }

  return {
    systemStatus: "Needs attention",
    systemTone: "warning",
    alerts,
  };
}

function mapWebsites(rows: WebsiteRow[], emailMap: Map<string, string>): AdminWebsiteRecord[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.site_title,
    ownerEmail: emailMap.get(row.user_id) ?? "Unknown owner",
    status: row.status,
    websiteType: row.website_type,
    createdAt: row.generated_at,
    updatedAt: row.updated_at,
  }));
}

function buildRecentActivity(
  websites: AdminWebsiteRecord[],
  publishJobs: PublishJobRow[],
  scheduleRuns: ScheduleRunRow[],
): AdminActivityItem[] {
  const websiteActivity = websites.slice(0, 4).map((website) => ({
    id: `website-${website.id}`,
    title: `${website.title} updated`,
    detail: `${website.websiteType} website · ${website.status} · ${website.ownerEmail}`,
    timestamp: website.updatedAt ?? website.createdAt,
    tone: website.status === "published" ? "info" : "warning",
  }));

  const publishActivity = publishJobs.map((job) => ({
    id: `publish-${job.id}`,
    title: `${job.platform} publish job ${job.status}`,
    detail: job.last_error ? job.last_error : "Publishing workflow updated recently.",
    timestamp: job.updated_at ?? job.published_at,
    tone: toToneFromStatus(job.status),
  }));

  const scheduleActivity = scheduleRuns.map((run) => ({
    id: `schedule-${run.id}`,
    title: `Content schedule run ${run.status}`,
    detail: run.error ? run.error : "Content scheduling workflow updated recently.",
    timestamp: run.updated_at ?? run.completed_at,
    tone: run.status === "failed" ? "error" : "info",
  }));

  return [...websiteActivity, ...publishActivity, ...scheduleActivity]
    .sort((left, right) => parseTimestamp(right.timestamp) - parseTimestamp(left.timestamp))
    .slice(0, 6);
}

export async function listAdminUsers(limit = 25): Promise<AdminUserRecord[]> {
  const [authUsers, profiles] = await Promise.all([listAuthUsers(Math.max(limit, 100)), listProfileRows(Math.max(limit, 100))]);
  return mergeUsers(authUsers, profiles).slice(0, limit);
}

export async function listAdminWebsites(limit = 25): Promise<AdminWebsiteRecord[]> {
  const websiteRows = await listRecentWebsiteRows(limit);
  const emailMap = await getEmailMap([...new Set(websiteRows.map((row) => row.user_id))]);
  return mapWebsites(websiteRows, emailMap).slice(0, limit);
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [users, userCounts, websiteCounts, websiteRows, monitoringCounts, publishJobs, scheduleRuns] = await Promise.all([
    listAdminUsers(6),
    getUserCounts(),
    getWebsiteCounts(),
    listRecentWebsiteRows(8),
    getMonitoringCounts(),
    listRecentPublishJobs(4),
    listRecentScheduleRuns(4),
  ]);

  const emailMap = await getEmailMap([...new Set(websiteRows.map((row) => row.user_id))]);
  const websites = mapWebsites(websiteRows, emailMap);
  const recentSignups = countItemsSince(users, 7);
  const userGrowth = countItemsSince(users, 30);
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
      records: users,
    },
    websites: {
      total: websiteCounts.total,
      published: websiteCounts.published,
      drafts: websiteCounts.drafts,
      records: websites,
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
}

export function formatAdminDate(value: string | null | undefined): string {
  if (!value) {
    return "No data yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
