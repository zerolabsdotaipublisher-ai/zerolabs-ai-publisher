import { SignOutButton } from "@/components/auth/sign-out-button";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { routes } from "@/config/routes";
import { buildDashboardSummary } from "@/lib/dashboard";
import type { DashboardSummary } from "@/lib/dashboard/types";
import { logger } from "@/lib/observability";
import { requireUser } from "@/lib/supabase/auth";
import { createFallbackProfile, getProfileDisplayName, getSafeProfile } from "@/lib/supabase/profile";
import Link from "next/link";

export const dynamic = "force-dynamic";

type DashboardView = {
  mode: "standard" | "emergency";
  userEmail?: string | null;
  displayName?: string;
  summary?: DashboardSummary;
};

function renderEmergencyDashboard(displayName?: string, userEmail?: string | null) {
  return (
    <section className="dashboard-home-shell" aria-label="Dashboard temporarily unavailable">
      <header className="dashboard-home-header">
        <div className="dashboard-hero-panel">
          <span className="dashboard-eyebrow">Zero Labs workspace</span>
          <h1>Dashboard temporarily unavailable</h1>
          <p>We hit a dashboard rendering issue, but your session stayed online and a safe fallback view is being shown.</p>
        </div>

        <aside className="dashboard-welcome-card" aria-label="Account overview">
          <span className="dashboard-welcome-label">Account overview</span>
          <strong>{displayName ?? userEmail ?? "Zero Labs user"}</strong>
          {displayName && userEmail ? <p>{userEmail}</p> : null}
          <p>Use the safe actions below to continue working or sign out.</p>
        </aside>
      </header>

      <section className="dashboard-panel-shell dashboard-panel-shell-emphasis" aria-label="Dashboard recovery actions">
        <header className="dashboard-section-heading">
          <div>
            <h2>Recovery actions</h2>
            <p className="dashboard-empty-note">Dashboard data could not be rendered, so a stable fallback view is being shown instead.</p>
          </div>
        </header>

        <div className="dashboard-quick-actions-grid">
          <Link href={routes.dashboard} className="dashboard-quick-action">
            <span className="dashboard-quick-action-kicker">Retry</span>
            <strong>Reload dashboard</strong>
            <span className="dashboard-quick-action-description">Try rendering the dashboard again without leaving your session.</span>
            <span className="dashboard-quick-action-arrow">Reload →</span>
          </Link>
          <Link href={routes.profile} className="dashboard-quick-action">
            <span className="dashboard-quick-action-kicker">Account</span>
            <strong>Open profile</strong>
            <span className="dashboard-quick-action-description">Continue working from a safe account page while dashboard services recover.</span>
            <span className="dashboard-quick-action-arrow">Open →</span>
          </Link>
        </div>

        <SignOutButton
          containerClassName="app-nav-signout-group"
          className="app-nav-signout"
          errorClassName="app-nav-error"
        />
      </section>
    </section>
  );
}

async function loadDashboardView(): Promise<DashboardView> {
  const user = await requireUser(routes.dashboard);

  try {
    const profile = await getSafeProfile(user);
    const displayName = getProfileDisplayName(profile);

    const summary = await buildDashboardSummary({
      userId: user.id,
      email: user.email ?? "",
      displayName,
      memberSince: profile.created_at || user.created_at,
    });

    return {
      mode: "standard",
      userEmail: user.email,
      displayName,
      summary,
    };
  } catch (error) {
    logger.error("DashboardPage fell back to the emergency dashboard UI", {
      category: "error",
      service: "dashboard",
      userId: user.id,
      error: { message: error instanceof Error ? error.message : String(error), name: "DashboardRenderError" },
    });

    const fallbackProfile = createFallbackProfile(user);

    return {
      mode: "emergency",
      userEmail: fallbackProfile.email || user.email,
      displayName: getProfileDisplayName(fallbackProfile),
    };
  }
}

export default async function DashboardPage() {
  const view = await loadDashboardView();

  if (view.mode === "emergency" || !view.summary) {
    return renderEmergencyDashboard(view.displayName, view.userEmail);
  }

  return <DashboardHome initialSummary={view.summary} />;
}
