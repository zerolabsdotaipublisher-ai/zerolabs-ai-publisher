import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { routes } from "@/config/routes";
import { logger } from "@/lib/observability";
import { requireUser } from "@/lib/supabase/auth";
import { createFallbackProfile, getProfileDisplayName, getSafeProfile } from "@/lib/supabase/profile";

export const dynamic = "force-dynamic";

const workspaceActions = [
  {
    href: routes.createWebsite,
    kicker: "Launch",
    label: "Create website",
    description: "Spin up a new AI website project with the guided workflow.",
  },
  {
    href: routes.websites,
    kicker: "Manage",
    label: "View websites",
    description: "Open your active website list, publishing state, and controls.",
  },
  {
    href: routes.contentLibrary,
    kicker: "Library",
    label: "Content library",
    description: "Browse generated drafts, assets, and ready-to-review content.",
  },
  {
    href: routes.activity,
    kicker: "Monitor",
    label: "Activity",
    description: "Track recent publishing activity, retries, and updates.",
  },
  {
    href: routes.profile,
    kicker: "Account",
    label: "Profile",
    description: "Review your account details and workspace settings.",
  },
];

const adminActions = [
  {
    href: routes.adminDashboard,
    kicker: "Admin",
    label: "Open Admin Dashboard",
    description: "Open the admin overview only when you want the operations workspace.",
  },
  {
    href: routes.adminDeployments,
    kicker: "Deploy",
    label: "Deployment Center",
    description: "Inspect recent Vercel builds, statuses, and environment readiness.",
  },
  {
    href: routes.adminUsers,
    kicker: "Users",
    label: "Manage Users",
    description: "Review account roles, signups, and user visibility safely.",
  },
  {
    href: routes.adminAnalytics,
    kicker: "Insights",
    label: "Analytics Readiness",
    description: "Review platform metrics and Vercel analytics readiness without fake traffic data.",
  },
];

type DashboardView = {
  mode: "standard" | "emergency";
  userEmail?: string | null;
  displayName?: string;
  isAdmin?: boolean;
};

function DashboardActionGrid({ actions, prefetch = true }: { actions: typeof workspaceActions; prefetch?: boolean }) {
  return (
    <div className="dashboard-quick-actions-grid">
      {actions.map((action) => (
        <Link key={action.href} href={action.href} prefetch={prefetch} className="dashboard-quick-action">
          <span className="dashboard-quick-action-kicker">{action.kicker}</span>
          <strong>{action.label}</strong>
          <span className="dashboard-quick-action-description">{action.description}</span>
          <span className="dashboard-quick-action-arrow">Open →</span>
        </Link>
      ))}
    </div>
  );
}

function renderStandardDashboard(displayName?: string, userEmail?: string | null, isAdmin = false) {
  return (
    <section className="dashboard-home-shell" aria-label="Dashboard homepage">
      <header className="dashboard-home-header">
        <div className="dashboard-hero-panel">
          <span className="dashboard-eyebrow">Zero Labs workspace</span>
          <h1>Dashboard</h1>
          <p>
            Welcome back, {displayName ?? userEmail ?? "Zero Labs user"}. Your customer dashboard loads first as the
            stable entry point for authenticated users.
          </p>
        </div>

        <aside className="dashboard-welcome-card" aria-label="Account overview">
          <span className="dashboard-welcome-label">Account overview</span>
          <strong>{displayName ?? userEmail ?? "Zero Labs user"}</strong>
          {displayName && userEmail ? <p>{userEmail}</p> : null}
          <p>Your publishing controls are ready, and your dashboard session is active.</p>
        </aside>
      </header>

      <section className="dashboard-panel-shell dashboard-panel-shell-emphasis" aria-label="Dashboard quick links">
        <header className="dashboard-section-heading">
          <div>
            <h2>Workspace shortcuts</h2>
            <p>Open the key areas you use most to create, review, publish, and manage your AI publishing work.</p>
          </div>
        </header>

        <DashboardActionGrid actions={workspaceActions} />
      </section>

      {isAdmin ? (
        <section className="dashboard-panel-shell" aria-label="Admin shortcuts">
          <header className="dashboard-section-heading">
            <div>
              <h2>Admin access</h2>
              <p>Admin tools are optional links only. Your main dashboard remains the stable landing route.</p>
            </div>
          </header>

          <DashboardActionGrid actions={adminActions} prefetch={false} />
        </section>
      ) : null}
    </section>
  );
}

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

    return {
      mode: "standard",
      userEmail: user.email,
      displayName: getProfileDisplayName(profile),
      isAdmin: profile.role === "admin",
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

  if (view.mode === "emergency") {
    return renderEmergencyDashboard(view.displayName, view.userEmail);
  }

  return renderStandardDashboard(view.displayName, view.userEmail, view.isAdmin);
}
