import { DashboardHome } from "@/components/dashboard/dashboard-home";
import {
  buildDashboardSummary,
  getDashboardUserDisplayName,
  getDefaultDashboardErrorMessage,
  type DashboardSummary,
} from "@/lib/dashboard";
import { getServerUser } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const user = await getServerUser();

  if (!user) {
    return <DashboardHome initialError={getDefaultDashboardErrorMessage()} />;
  }

  let initialError: string | undefined;
  let initialSummary: DashboardSummary | undefined;

  try {
    initialSummary = await buildDashboardSummary({
      userId: user.id,
      email: user.email ?? "",
      displayName: getDashboardUserDisplayName(user.user_metadata),
    });
  } catch {
    initialError = getDefaultDashboardErrorMessage();
  }

  return <DashboardHome initialSummary={initialSummary} initialError={initialError} />;
}
