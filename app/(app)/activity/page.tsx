import { routes } from "@/config/routes";
import { ActivityOverviewShell } from "@/components/activity/activity-overview-shell";
import { ActivitySummaryCards } from "@/components/activity/activity-summary-cards";
import { getDefaultPublishingActivityQuery } from "@/lib/activity/schema";
import { getPublishingActivityOverview } from "@/lib/activity/model";
import { requireUser } from "@/lib/supabase/auth";
import { listManagedWebsites } from "@/lib/management";

export default async function ActivityPage() {
  const user = await requireUser(routes.activity);
  const initialOverview = await getPublishingActivityOverview(user.id, getDefaultPublishingActivityQuery());
  const websites = await listManagedWebsites(user.id, { status: "all", includeDeleted: false });

  return (
    <section className="dashboard-home-shell" aria-label="Activity homepage">
      <header className="dashboard-home-header">
        <div className="dashboard-hero-panel">
          <span className="dashboard-eyebrow">Zero Labs workspace</span>
          <h1>Activity</h1>
          <p>
            Review your recent website generation, publishing, and analytics readiness.
          </p>
        </div>
      </header>

      <ActivitySummaryCards websites={websites} recentActivityCount={initialOverview.items.length} />

      <ActivityOverviewShell initialOverview={initialOverview} />
    </section>
  );
}
