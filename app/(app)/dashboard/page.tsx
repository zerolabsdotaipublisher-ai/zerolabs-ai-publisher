import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { routes } from "@/config/routes";
import {
  buildDashboardSummary,
  getDashboardUserDisplayName,
  getDefaultDashboardErrorMessage,
  type DashboardSummary,
} from "@/lib/dashboard";
import { requireUser } from "@/lib/supabase/auth";

export default async function DashboardPage() {
  const user = await requireUser(routes.dashboard);

  let initialSummary: DashboardSummary | undefined;
  let initialError: string | undefined;

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
