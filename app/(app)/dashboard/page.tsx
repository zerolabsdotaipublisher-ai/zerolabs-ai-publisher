import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { routes } from "@/config/routes";
import { buildDashboardSummary } from "@/lib/dashboard";
import { listManagedWebsitesPage } from "@/lib/management";
import type { WebsiteListPage } from "@/lib/management/types";
import type { DashboardSummary } from "@/lib/dashboard/types";
import { logger } from "@/lib/observability";
import { requireUser } from "@/lib/supabase/auth";
import { createFallbackProfile, getProfileDisplayName, getSafeProfile } from "@/lib/supabase/profile";

export const dynamic = "force-dynamic";

const DASHBOARD_PER_PAGE = 12;

interface DashboardPageView {
  initialSummary?: DashboardSummary;
  initialListing: WebsiteListPage;
  initialListingError?: string;
  userEmail?: string | null;
  displayName?: string;
  currentUserId: string;
}

function createEmptyListing(): WebsiteListPage {
  return {
    websites: [],
    total: 0,
    page: 1,
    perPage: DASHBOARD_PER_PAGE,
    hasMore: false,
  };
}

async function loadDashboardPageView(): Promise<DashboardPageView> {
  const user = await requireUser(routes.dashboard);
  const profile = await getSafeProfile(user).catch(() => createFallbackProfile(user));
  const displayName = getProfileDisplayName(profile);
  const userEmail = profile.email || user.email;

  const [summaryResult, listingResult] = await Promise.allSettled([
    buildDashboardSummary({
      userId: user.id,
      email: user.email ?? "",
      displayName,
    }),
    listManagedWebsitesPage(user.id, {
      includeSchedules: false,
      status: "all",
      includeDeleted: false,
      page: 1,
      perPage: DASHBOARD_PER_PAGE,
    }),
  ]);

  if (summaryResult.status === "rejected") {
    logger.error("DashboardPage could not build the dashboard overview summary", {
      category: "error",
      service: "dashboard",
      userId: user.id,
      error: {
        message: summaryResult.reason instanceof Error ? summaryResult.reason.message : String(summaryResult.reason),
        name: "DashboardSummaryRenderError",
      },
    });
  }

  if (listingResult.status === "rejected") {
    logger.error("DashboardPage could not build the dashboard website workspace listing", {
      category: "error",
      service: "dashboard",
      userId: user.id,
      error: {
        message: listingResult.reason instanceof Error ? listingResult.reason.message : String(listingResult.reason),
        name: "DashboardListingRenderError",
      },
    });
  }

  return {
    initialSummary: summaryResult.status === "fulfilled" ? summaryResult.value : undefined,
    initialListing: listingResult.status === "fulfilled" ? listingResult.value : createEmptyListing(),
    initialListingError:
      listingResult.status === "rejected" ? "Unable to load your websites right now. Retry the workspace below." : undefined,
    userEmail,
    displayName,
    currentUserId: user.id,
  };
}

export default async function DashboardPage() {
  const view = await loadDashboardPageView();

  return (
    <DashboardHome
      initialSummary={view.initialSummary}
      initialListing={view.initialListing}
      initialListingError={view.initialListingError}
      userEmail={view.userEmail}
      displayName={view.displayName}
      currentUserId={view.currentUserId}
    />
  );
}
