import Link from "next/link";
import { AdminFallback } from "@/components/admin/admin-fallback";
import { routes } from "@/config/routes";
import { logger } from "@/lib/observability";
import { formatAdminDate, getAdminDashboardData } from "@/lib/admin/data";
import { requireAdminUser } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

function renderMetric(value: number | null, emptyLabel = "No data yet"): string {
  return value === null ? emptyLabel : String(value);
}

async function loadAdminDashboardPage() {
  try {
    const { user, isAdmin } = await requireAdminUser();

    if (!user || !isAdmin) {
      return {
        ok: false as const,
        userEmail: user?.email,
        retryHref: routes.adminDashboard,
        description: "Admin access could not be confirmed on the server, so the stable fallback view is being shown.",
      };
    }

    return {
      ok: true as const,
      user,
      dashboard: await getAdminDashboardData(),
    };
  } catch (error) {
    logger.error("AdminDashboardPage fell back to admin fallback UI", {
      category: "error",
      service: "dashboard",
      error: { message: error instanceof Error ? error.message : String(error), name: "AdminDashboardRenderError" },
    });

    return {
      ok: false as const,
      retryHref: routes.adminDashboard,
    };
  }
}

export default async function AdminDashboardPage() {
  const result = await loadAdminDashboardPage();

  if (!result.ok) {
    return <AdminFallback userEmail={result.userEmail} retryHref={result.retryHref} description={result.description} />;
  }

  const { user, dashboard } = result;
  const tools = [
    {
      href: routes.adminUsers,
      kicker: "Users",
      label: "User management",
      description: "Review account roles, signups, and basic account status details.",
    },
    {
      href: routes.adminWebsites,
      kicker: "Websites",
      label: "Website management",
      description: "Track created websites, publishing state, and owner visibility.",
    },
    {
      href: routes.adminMonitoring,
      kicker: "Ops",
      label: "Monitoring",
      description: "See recent activity, failed jobs, and platform health summaries.",
    },
    {
      href: routes.adminAnalytics,
      kicker: "Insights",
      label: "Analytics",
      description: "Follow generation volume, publishing activity, and growth placeholders.",
    },
  ];

  return (
    <section className="dashboard-home-shell" aria-label="Admin dashboard homepage">
      <header className="dashboard-home-header">
        <div className="dashboard-hero-panel">
          <span className="dashboard-eyebrow">Zero Labs operations</span>
          <h1>Admin Dashboard</h1>
          <p>Manage Zero Labs AI Publisher operations with role-aware visibility across users, websites, monitoring, and analytics.</p>
        </div>

        <aside className="dashboard-welcome-card" aria-label="Admin account overview">
          <span className="dashboard-welcome-label">Signed in as</span>
          <strong>{user.email ?? "Zero Labs admin"}</strong>
          <p>This workspace is showing server-authoritative admin data and safe placeholders when operational data is unavailable.</p>
        </aside>
      </header>

      <section className="dashboard-panel-shell" aria-label="Admin summary metrics">
        <header className="dashboard-section-heading">
          <div>
            <h2>Platform overview</h2>
            <p>Track the current state of users, websites, and system monitoring from one admin workspace.</p>
          </div>
        </header>

        <div className="dashboard-metrics-grid">
          <article className="dashboard-metric-card">
            <span className="dashboard-metric-label">Total users</span>
            <strong className="dashboard-metric-value">{renderMetric(dashboard.users.total)}</strong>
            <span className="dashboard-metric-hint">{renderMetric(dashboard.users.recentSignups)} recent signups in the last 7 days</span>
          </article>
          <article className="dashboard-metric-card">
            <span className="dashboard-metric-label">Websites created</span>
            <strong className="dashboard-metric-value">{renderMetric(dashboard.websites.total)}</strong>
            <span className="dashboard-metric-hint">{renderMetric(dashboard.websites.published)} published · {renderMetric(dashboard.websites.drafts)} drafts</span>
          </article>
          <article className={`dashboard-metric-card${dashboard.monitoring.systemTone === "error" ? " dashboard-metric-card-error" : dashboard.monitoring.systemTone === "warning" ? " dashboard-metric-card-warning" : ""}`}>
            <span className="dashboard-metric-label">System status</span>
            <strong className="dashboard-metric-value">{dashboard.monitoring.systemStatus}</strong>
            <span className="dashboard-metric-hint">{renderMetric(dashboard.monitoring.failedJobs)} failed jobs or retries currently tracked</span>
          </article>
          <article className="dashboard-metric-card">
            <span className="dashboard-metric-label">Generation volume</span>
            <strong className="dashboard-metric-value">{renderMetric(dashboard.analytics.websiteGenerationVolume)}</strong>
            <span className="dashboard-metric-hint">Websites generated in the last 30 days</span>
          </article>
          <article className="dashboard-metric-card">
            <span className="dashboard-metric-label">User growth</span>
            <strong className="dashboard-metric-value">{renderMetric(dashboard.analytics.userGrowth)}</strong>
            <span className="dashboard-metric-hint">New accounts tracked in the last 30 days</span>
          </article>
        </div>
      </section>

      <div className="dashboard-two-column-grid">
        <section className="dashboard-panel-shell" aria-label="Admin users section">
          <header className="dashboard-section-heading">
            <div>
              <h2>Users</h2>
              <p>Review total users, recent signups, and role assignments.</p>
            </div>
            <Link href={routes.adminUsers} prefetch={false} className="dashboard-inline-link">
              Manage users
            </Link>
          </header>

          <dl className="dashboard-definition-grid">
            <div>
              <dt>Total users</dt>
              <dd>{renderMetric(dashboard.users.total)}</dd>
            </div>
            <div>
              <dt>Admins</dt>
              <dd>{renderMetric(dashboard.users.admins)}</dd>
            </div>
            <div>
              <dt>Recent signups</dt>
              <dd>{renderMetric(dashboard.users.recentSignups)}</dd>
            </div>
          </dl>

          {dashboard.users.records.length > 0 ? (
            <ul className="dashboard-compact-list">
              {dashboard.users.records.map((record) => (
                <li key={record.id}>
                  <strong>{record.email}</strong>
                  <span>{record.role} · {record.status}</span>
                  <span>Created {formatAdminDate(record.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dashboard-empty-note">No user data yet.</p>
          )}
        </section>

        <section className="dashboard-panel-shell" aria-label="Admin websites section">
          <header className="dashboard-section-heading">
            <div>
              <h2>Websites</h2>
              <p>Watch created websites, published output, and draft inventory.</p>
            </div>
            <Link href={routes.adminWebsites} prefetch={false} className="dashboard-inline-link">
              Manage websites
            </Link>
          </header>

          <dl className="dashboard-definition-grid">
            <div>
              <dt>Total websites</dt>
              <dd>{renderMetric(dashboard.websites.total)}</dd>
            </div>
            <div>
              <dt>Published</dt>
              <dd>{renderMetric(dashboard.websites.published)}</dd>
            </div>
            <div>
              <dt>Drafts</dt>
              <dd>{renderMetric(dashboard.websites.drafts)}</dd>
            </div>
          </dl>

          {dashboard.websites.records.length > 0 ? (
            <ul className="dashboard-compact-list">
              {dashboard.websites.records.map((website) => (
                <li key={website.id}>
                  <strong>{website.title}</strong>
                  <span>{website.websiteType} · {website.status} · {website.ownerEmail}</span>
                  <span>Created {formatAdminDate(website.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dashboard-empty-note">No website data yet.</p>
          )}
        </section>
      </div>

      <div className="dashboard-two-column-grid">
        <section className="dashboard-panel-shell" aria-label="Admin activity and monitoring section">
          <header className="dashboard-section-heading">
            <div>
              <h2>Activity &amp; monitoring</h2>
              <p>Track recent operational events, failed jobs, and monitoring alerts.</p>
            </div>
            <Link href={routes.adminMonitoring} prefetch={false} className="dashboard-inline-link">
              Open monitoring
            </Link>
          </header>

          <ul className="dashboard-alert-list">
            {dashboard.monitoring.alerts.map((alert) => (
              <li
                key={alert.id}
                className={`dashboard-alert ${alert.tone === "error" ? "dashboard-alert-error" : alert.tone === "warning" ? "dashboard-alert-warning" : "dashboard-alert-info"}`}
              >
                <div>
                  <strong>{alert.title}</strong>
                  <p>{alert.detail}</p>
                </div>
              </li>
            ))}
          </ul>

          {dashboard.monitoring.recentActivity.length > 0 ? (
            <ul className="dashboard-activity-list">
              {dashboard.monitoring.recentActivity.map((activity) => (
                <li
                  key={activity.id}
                  className={`dashboard-activity-item${activity.tone === "error" ? " dashboard-activity-error" : activity.tone === "warning" ? " dashboard-activity-warning" : ""}`}
                >
                  <div>
                    <strong>{activity.title}</strong>
                    <p>{activity.detail}</p>
                  </div>
                  <span>{formatAdminDate(activity.timestamp)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dashboard-empty-note">No recent activity yet.</p>
          )}
        </section>

        <section className="dashboard-panel-shell" aria-label="Admin analytics section">
          <header className="dashboard-section-heading">
            <div>
              <h2>Analytics</h2>
              <p>Use stable stat cards now and expand into deeper reporting when more datasets become available.</p>
            </div>
            <Link href={routes.adminAnalytics} prefetch={false} className="dashboard-inline-link">
              Open analytics
            </Link>
          </header>

          <div className="dashboard-metrics-grid">
            <article className="dashboard-metric-card">
              <span className="dashboard-metric-label">Website generation volume</span>
              <strong className="dashboard-metric-value">{renderMetric(dashboard.analytics.websiteGenerationVolume)}</strong>
              <span className="dashboard-metric-hint">Last 30 days</span>
            </article>
            <article className="dashboard-metric-card">
              <span className="dashboard-metric-label">Publishing activity</span>
              <strong className="dashboard-metric-value">{renderMetric(dashboard.analytics.publishingActivity)}</strong>
              <span className="dashboard-metric-hint">Published website records tracked so far</span>
            </article>
            <article className="dashboard-metric-card">
              <span className="dashboard-metric-label">User growth</span>
              <strong className="dashboard-metric-value">{renderMetric(dashboard.analytics.userGrowth)}</strong>
              <span className="dashboard-metric-hint">Stable placeholder when no auth data is available</span>
            </article>
          </div>
        </section>
      </div>

      <section className="dashboard-panel-shell" aria-label="Admin tools">
        <header className="dashboard-section-heading">
          <div>
            <h2>Tools</h2>
            <p>Jump directly into the admin sections for platform operations.</p>
          </div>
        </header>

        <div className="dashboard-quick-actions-grid">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} prefetch={false} className="dashboard-quick-action">
              <span className="dashboard-quick-action-kicker">{tool.kicker}</span>
              <strong>{tool.label}</strong>
              <span className="dashboard-quick-action-description">{tool.description}</span>
              <span className="dashboard-quick-action-arrow">Open →</span>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
