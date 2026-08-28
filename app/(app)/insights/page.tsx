import Link from "next/link";
import { routes } from "@/config/routes";
import { requireUser } from "@/lib/supabase/auth";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

type InsightMetricState = {
  id: string;
  title: string;
  description: string;
  value: number | null;
  sourceLabel: string;
};

type CountFilter =
  | { type: "eq"; column: string; value: string }
  | { type: "in"; column: string; value: string[] };

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isMissingSchemaError(error: {
  code?: unknown;
  message?: unknown;
  details?: unknown;
  hint?: unknown;
} | null | undefined): boolean {
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
    searchable.includes("does not exist")
  );
}

async function listIdsForUser(table: string, userId: string): Promise<string[] | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("user_id", userId);

  if (error) {
    if (isMissingSchemaError(error)) {
      return null;
    }

    throw error;
  }

  return (data ?? [])
    .map((row) => readString((row as { id?: unknown }).id))
    .filter((value): value is string => Boolean(value));
}

async function listIdsForFirstAvailableTable(tables: string[], userId: string): Promise<string[] | null> {
  for (const table of tables) {
    const ids = await listIdsForUser(table, userId);
    if (ids !== null) {
      return ids;
    }
  }

  return null;
}

async function countRows(table: string, filters: CountFilter[] = []): Promise<number | null> {
  const supabase = getSupabaseServiceClient();
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  for (const filter of filters) {
    query =
      filter.type === "eq"
        ? query.eq(filter.column, filter.value)
        : query.in(filter.column, filter.value);
  }
  const { count, error } = await query;

  if (error) {
    if (isMissingSchemaError(error)) {
      return null;
    }

    throw error;
  }

  return typeof count === "number" ? count : 0;
}

async function countFirstAvailableTable(tables: string[], filters: CountFilter[] = []): Promise<number | null> {
  for (const table of tables) {
    const count = await countRows(table, filters);
    if (count !== null) return count;
  }

  return null;
}

function createOwnedIdFilter(column: string, values: string[]): CountFilter {
  if (values.length > 0) {
    return {
      type: "in",
      column,
      value: values,
    };
  }

  return {
    type: "eq",
    column,
    value: "__none__",
  };
}

async function loadInsightsMetrics(userId: string): Promise<InsightMetricState[]> {
  try {
    const [ownedWebsiteIds, ownedFeedPostIds] = await Promise.all([
      listIdsForUser("website_structures", userId),
      listIdsForFirstAvailableTable(["community_posts", "feed_posts"], userId),
    ]);

    const websiteViewsPromise = ownedWebsiteIds
      ? countRows("website_view_events", [createOwnedIdFilter("website_id", ownedWebsiteIds)])
      : Promise.resolve(null);
    const websiteHeartsPromise = ownedWebsiteIds
      ? countRows("website_reactions", [
          createOwnedIdFilter("website_id", ownedWebsiteIds),
          { type: "eq", column: "reaction_type", value: "heart" },
        ])
      : Promise.resolve(null);
    const websiteSharesPromise = ownedWebsiteIds
      ? countRows("website_shares", [createOwnedIdFilter("website_id", ownedWebsiteIds)])
      : Promise.resolve(null);
    const postHeartsPromise = ownedFeedPostIds
      ? countFirstAvailableTable(["community_post_reactions", "feed_post_reactions"], [
          createOwnedIdFilter("post_id", ownedFeedPostIds),
          { type: "eq", column: "reaction_type", value: "heart" },
        ])
      : Promise.resolve(null);
    const postSharesPromise = ownedFeedPostIds
      ? countFirstAvailableTable(["community_post_shares", "feed_post_shares"], [createOwnedIdFilter("post_id", ownedFeedPostIds)])
      : Promise.resolve(null);

    const [websiteViews, profileViews, postHearts, postShares, websiteHearts, websiteShares] = await Promise.all([
      websiteViewsPromise,
      countRows("profile_view_events", [{ type: "eq", column: "profile_user_id", value: userId }]),
      postHeartsPromise,
      postSharesPromise,
      websiteHeartsPromise,
      websiteSharesPromise,
    ]);

    return [
      {
        id: "website-views",
        title: "Website views",
        description: "People who viewed your websites.",
        value: websiteViews,
        sourceLabel: "website_view_events",
      },
      {
        id: "profile-views",
        title: "Profile views",
        description: "People who viewed your profile.",
        value: profileViews,
        sourceLabel: "profile_view_events",
      },
      {
        id: "post-hearts",
        title: "Post hearts",
        description: "Hearts on your feed posts.",
        value: postHearts,
        sourceLabel: "community_post_reactions",
      },
      {
        id: "post-shares",
        title: "Post shares",
        description: "Shares of your feed posts.",
        value: postShares,
        sourceLabel: "community_post_shares",
      },
      {
        id: "website-hearts",
        title: "Website hearts",
        description: "Hearts on your generated websites.",
        value: websiteHearts,
        sourceLabel: "website_reactions",
      },
      {
        id: "website-shares",
        title: "Website shares",
        description: "Shares of your generated websites.",
        value: websiteShares,
        sourceLabel: "website_shares",
      },
    ];
  } catch {
    return [
      {
        id: "website-views",
        title: "Website views",
        description: "People who viewed your websites.",
        value: null,
        sourceLabel: "website_view_events",
      },
      {
        id: "profile-views",
        title: "Profile views",
        description: "People who viewed your profile.",
        value: null,
        sourceLabel: "profile_view_events",
      },
      {
        id: "post-hearts",
        title: "Post hearts",
        description: "Hearts on your feed posts.",
        value: null,
        sourceLabel: "community_post_reactions",
      },
      {
        id: "post-shares",
        title: "Post shares",
        description: "Shares of your feed posts.",
        value: null,
        sourceLabel: "community_post_shares",
      },
      {
        id: "website-hearts",
        title: "Website hearts",
        description: "Hearts on your generated websites.",
        value: null,
        sourceLabel: "website_reactions",
      },
      {
        id: "website-shares",
        title: "Website shares",
        description: "Shares of your generated websites.",
        value: null,
        sourceLabel: "website_shares",
      },
    ];
  }
}

function renderMetricValue(value: number | null): string {
  return value === null ? "Not configured" : value.toLocaleString();
}

export default async function InsightsPage() {
  const user = await requireUser(routes.insights);
  const metrics = await loadInsightsMetrics(user.id);
  const configuredMetrics = metrics.filter((metric) => metric.value !== null).length;

  return (
    <section className="dashboard-home-shell" aria-label="Insights workspace">
      <header className="dashboard-home-header">
        <div className="dashboard-hero-panel">
          <span className="dashboard-eyebrow">Zero Labs insights</span>
          <h1>Insights</h1>
          <p>Website and feed analytics remain honest here: metrics only show counts when the event tables are configured and owner-scoped data can be queried safely.</p>
        </div>

        <aside className="dashboard-welcome-card" aria-label="Insights overview">
          <span className="dashboard-welcome-label">Current readiness</span>
          <strong>{configuredMetrics} of {metrics.length} metrics configured</strong>
          <p>Nothing on this page is fabricated. Missing analytics stay unavailable until the related Supabase tables and policies are added.</p>
        </aside>
      </header>

      <section className="dashboard-panel-shell" aria-label="Insights metrics">
        <header className="dashboard-section-heading">
          <div>
            <h2>Analytics readiness</h2>
            <p>These cards are wired for real counts only. If the backing tables are absent, the UI stays in a not-configured state.</p>
          </div>

          <div className="dashboard-panel-actions">
            <Link href={routes.dashboard} className="dashboard-inline-link">
              Open dashboard
            </Link>
            <Link href={routes.generateWebsite} className="dashboard-inline-link">
              Generate website
            </Link>
            <Link href={routes.feed} className="dashboard-inline-link">
              Open feed
            </Link>
          </div>
        </header>

        <div className="dashboard-metrics-grid">
          {metrics.map((metric) => (
            <article
              key={metric.id}
              className={`dashboard-metric-card${metric.value === null ? " dashboard-metric-card-warning" : ""}`}
            >
              <p className="dashboard-metric-label">{metric.title}</p>
              <p className="dashboard-metric-value">{renderMetricValue(metric.value)}</p>
              <p className="dashboard-metric-hint">{metric.description}</p>
              <p className="dashboard-section-footnote">Source: {metric.sourceLabel}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
