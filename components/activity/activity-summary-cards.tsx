import type { WebsiteManagementRecord } from "@/lib/management";

interface ActivitySummaryCardsProps {
  websites: WebsiteManagementRecord[];
  recentActivityCount: number;
}

export function ActivitySummaryCards({ websites, recentActivityCount }: ActivitySummaryCardsProps) {
  const totalGenerated = websites.length;
  const draftWebsites = websites.filter((w) => w.publicationState === "draft" || w.publicationState === "unpublished_changes").length;
  const publishedWebsites = websites.filter((w) => w.publicationState === "live" || w.publicationState === "publishing" || w.publicationState === "updating").length;
  const analyticsConfigured = false; // Always false unless connected to vercel

  return (
    <section className="dashboard-panel-shell dashboard-panel-shell-emphasis" aria-label="Website Summary">
      <header className="dashboard-section-heading">
        <div>
          <h2>Website summary</h2>
          <p>Key metrics across your managed websites.</p>
        </div>
      </header>

      <div className="dashboard-quick-actions-grid">
        <div className="dashboard-quick-action">
          <span className="dashboard-quick-action-kicker">Websites</span>
          <strong>Total generated</strong>
          <span className="dashboard-quick-action-description">{totalGenerated} website{totalGenerated !== 1 ? 's' : ''} in your workspace.</span>
        </div>

        <div className="dashboard-quick-action">
          <span className="dashboard-quick-action-kicker">Status</span>
          <strong>Drafts</strong>
          <span className="dashboard-quick-action-description">{draftWebsites} website{draftWebsites !== 1 ? 's' : ''} awaiting review.</span>
        </div>

        <div className="dashboard-quick-action">
          <span className="dashboard-quick-action-kicker">Status</span>
          <strong>Published</strong>
          <span className="dashboard-quick-action-description">{publishedWebsites} live website{publishedWebsites !== 1 ? 's' : ''}.</span>
        </div>

        <div className="dashboard-quick-action">
          <span className="dashboard-quick-action-kicker">Activity</span>
          <strong>Recent events</strong>
          <span className="dashboard-quick-action-description">{recentActivityCount} operation{recentActivityCount !== 1 ? 's' : ''} in the selected period.</span>
        </div>

        <div className="dashboard-quick-action">
          <span className="dashboard-quick-action-kicker">Insights</span>
          <strong>Analytics readiness</strong>
          <span className="dashboard-quick-action-description">
            {analyticsConfigured ? "Connected" : "Analytics unavailable"}
          </span>
        </div>
      </div>
    </section>
  );
}
