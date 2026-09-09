import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { InsightsChart, InsightsChartPoint, InsightsSnapshot } from "./types";

type QueryError = {
  code?: unknown;
  details?: unknown;
  hint?: unknown;
  message?: unknown;
};

type QueryResult<T> =
  | { value: T; missingTables: string[] }
  | { value: null; missingTables: string[] };

const DAY_COUNT = 7;

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isMissingSchemaError(error: QueryError | null | undefined): boolean {
  const code = readString(error?.code);
  const searchable = [
    readString(error?.message),
    readString(error?.details),
    readString(error?.hint),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    code === "42P01" ||
    code === "42703" ||
    code === "PGRST204" ||
    code === "PGRST205" ||
    searchable.includes("schema cache") ||
    searchable.includes("could not find the table") ||
    searchable.includes("could not find the column") ||
    ((searchable.includes("relation") || searchable.includes("column")) && searchable.includes("does not exist"))
  );
}

function toMissingTables(table: string, error: QueryError | null): string[] {
  return isMissingSchemaError(error) ? [table] : [];
}

function lastSevenDays(): Array<{ date: string; label: string }> {
  const today = new Date();
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const formatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  return Array.from({ length: DAY_COUNT }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() - (DAY_COUNT - 1 - index));

    return {
      date: date.toISOString().slice(0, 10),
      label: formatter.format(date),
    };
  });
}

async function countOwnerRows(table: string, ownerUserId: string): Promise<QueryResult<number>> {
  const supabase = await getSupabaseServerClient();
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("owner_user_id", ownerUserId);

  if (error) {
    return { value: null, missingTables: toMissingTables(table, error) };
  }

  return { value: typeof count === "number" ? count : 0, missingTables: [] };
}

async function listOwnedPostIds(ownerUserId: string): Promise<QueryResult<string[]>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("community_posts")
    .select("id")
    .eq("user_id", ownerUserId);

  if (error) {
    return { value: null, missingTables: toMissingTables("community_posts", error) };
  }

  return {
    value: (data ?? [])
      .map((row) => readString((row as { id?: unknown }).id))
      .filter((id): id is string => Boolean(id)),
    missingTables: [],
  };
}

async function probeTable(table: string): Promise<QueryResult<true>> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from(table).select("id", { count: "exact", head: true });

  if (error) {
    return { value: null, missingTables: toMissingTables(table, error) };
  }

  return { value: true, missingTables: [] };
}

async function countRowsForPosts(table: string, postIds: string[]): Promise<QueryResult<number>> {
  if (postIds.length === 0) {
    const probe = await probeTable(table);
    return { value: probe.value ? 0 : null, missingTables: probe.missingTables };
  }

  const supabase = await getSupabaseServerClient();
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .in("post_id", postIds);

  if (error) {
    return { value: null, missingTables: toMissingTables(table, error) };
  }

  return { value: typeof count === "number" ? count : 0, missingTables: [] };
}

async function countPostHearts(postIds: QueryResult<string[]>): Promise<QueryResult<number>> {
  if (postIds.value === null) {
    return { value: null, missingTables: postIds.missingTables };
  }

  if (postIds.value.length === 0) {
    return countRowsForPosts("community_post_reactions", postIds.value);
  }

  const supabase = await getSupabaseServerClient();
  const { count, error } = await supabase
    .from("community_post_reactions")
    .select("id", { count: "exact", head: true })
    .in("post_id", postIds.value)
    .eq("reaction_type", "heart");

  if (error) {
    return { value: null, missingTables: toMissingTables("community_post_reactions", error) };
  }

  return { value: typeof count === "number" ? count : 0, missingTables: [] };
}

async function listOwnerEventsByDay(table: string, ownerUserId: string, startDate: Date): Promise<QueryResult<Map<string, number>>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from(table)
    .select("created_at")
    .eq("owner_user_id", ownerUserId)
    .gte("created_at", startDate.toISOString());

  if (error) {
    return { value: null, missingTables: toMissingTables(table, error) };
  }

  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    const createdAt = readString((row as { created_at?: unknown }).created_at);
    const date = createdAt && !Number.isNaN(Date.parse(createdAt)) ? new Date(createdAt).toISOString().slice(0, 10) : undefined;
    if (date) {
      totals.set(date, (totals.get(date) ?? 0) + 1);
    }
  }

  return { value: totals, missingTables: [] };
}

function buildChart(args: {
  websiteEvents: QueryResult<Map<string, number>>;
  profileEvents: QueryResult<Map<string, number>>;
}): InsightsChart {
  const days = lastSevenDays();

  const points: InsightsChartPoint[] = days.map((day) => ({
    ...day,
    websiteViews: args.websiteEvents.value?.get(day.date) ?? (args.websiteEvents.value === null ? null : 0),
    profileViews: args.profileEvents.value?.get(day.date) ?? (args.profileEvents.value === null ? null : 0),
  }));

  return {
    points,
    websiteViewsConfigured: args.websiteEvents.value !== null,
    profileViewsConfigured: args.profileEvents.value !== null,
  };
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

export async function getInsightsSnapshot(ownerUserId: string): Promise<InsightsSnapshot> {
  const days = lastSevenDays();
  const startDate = new Date(`${days[0].date}T00:00:00.000Z`);
  const postIds = await listOwnedPostIds(ownerUserId);

  const [websiteViews, profileViews, postHearts, postShares, websiteHearts, websiteShares, websiteEvents, profileEvents] = await Promise.all([
    countOwnerRows("website_view_events", ownerUserId),
    countOwnerRows("profile_view_events", ownerUserId),
    countPostHearts(postIds),
    postIds.value === null
      ? Promise.resolve({ value: null, missingTables: postIds.missingTables } satisfies QueryResult<number>)
      : countRowsForPosts("community_post_shares", postIds.value),
    countOwnerRows("website_reactions", ownerUserId),
    countOwnerRows("website_shares", ownerUserId),
    listOwnerEventsByDay("website_view_events", ownerUserId, startDate),
    listOwnerEventsByDay("profile_view_events", ownerUserId, startDate),
  ]);

  const metrics = [
    {
      id: "website-views" as const,
      title: "Website views",
      description: "People who viewed your published websites.",
      value: websiteViews.value,
      sourceTable: "website_view_events",
    },
    {
      id: "profile-views" as const,
      title: "Profile views",
      description: "Profile views recorded by the application.",
      value: profileViews.value,
      sourceTable: "profile_view_events",
    },
    {
      id: "post-hearts" as const,
      title: "Post hearts",
      description: "Hearts on your feed posts.",
      value: postHearts.value,
      sourceTable: "community_post_reactions",
    },
    {
      id: "post-shares" as const,
      title: "Post shares",
      description: "Shares of your feed posts.",
      value: postShares.value,
      sourceTable: "community_post_shares",
    },
    {
      id: "website-hearts" as const,
      title: "Website hearts",
      description: "Hearts on your published websites.",
      value: websiteHearts.value,
      sourceTable: "website_reactions",
    },
    {
      id: "website-shares" as const,
      title: "Website shares",
      description: "Shares of your published websites.",
      value: websiteShares.value,
      sourceTable: "website_shares",
    },
  ];

  const missingTables = unique([
    ...websiteViews.missingTables,
    ...profileViews.missingTables,
    ...postHearts.missingTables,
    ...postShares.missingTables,
    ...websiteHearts.missingTables,
    ...websiteShares.missingTables,
    ...websiteEvents.missingTables,
    ...profileEvents.missingTables,
  ]);

  return {
    metrics,
    readiness: {
      configuredMetricCount: metrics.filter((metric) => metric.value !== null).length,
      totalMetricCount: metrics.length,
      missingTables,
    },
    chart: buildChart({ websiteEvents, profileEvents }),
  };
}
