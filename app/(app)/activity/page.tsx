import { routes } from "@/config/routes";
import { ActivityOverviewShell } from "@/components/activity/activity-overview-shell";
import { getDefaultPublishingActivityQuery } from "@/lib/activity/schema";
import { getPublishingActivityOverview } from "@/lib/activity/model";
import { requireUser } from "@/lib/supabase/auth";

export default async function ActivityPage() {
  const user = await requireUser(routes.activity);
  const initialOverview = await getPublishingActivityOverview(user.id, getDefaultPublishingActivityQuery());

  return <ActivityOverviewShell initialOverview={initialOverview} />;
}
