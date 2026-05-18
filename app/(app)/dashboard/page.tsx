import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { routes } from "@/config/routes";
import { getAdminDashboardData } from "@/lib/admin/data";
import { logger } from "@/lib/observability";
import { requireUser } from "@/lib/supabase/auth";
import { createFallbackProfile, getSafeProfile } from "@/lib/supabase/profile";

function renderStandardDashboard(userEmail?: string | null) {
  const actions = [
    {
      href: routes.createWebsite,
      kicker: "Launch",
      label: "Create website",
      description: "Spin up a new AI website project with the current guided workflow.",
    },
    {
      href: routes.websites,
      kicker: "Manage",
      label: "View websites",
      description: "Open your active website list, status, and publishing controls.",
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
      description: "Track recent publishing activity, retries, and important updates.",
    },
    {
      href: routes.profile,
      kicker: "Account",
      label: "Profile",
      description: "Review your account details and keep workspace settings current.",
    },
  ];

  return (
    <section className="dashboard-home-shell" aria-label="Dashboard homepage">
      <header className="dashboard-home-header">
        <div className="dashboard-hero-panel">
          <span className="dashboard-eyebrow">Zero Labs workspace</span>
          <h1>Dashboard</h1>
          <p>
            Welcome back to Zero Labs AI Publisher. Move between websites, content, activity, and profile settings
            from one calm, green-glass workspace.
          </p>
        </div>

        <aside className="dashboard-welcome-card" aria-label="Account overview">
          <span className="dashboard-welcome-label">Signed in as</span>
          <strong>{userEmail ?? "Zero Labs user"}</strong>
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

        <div className="dashboard-quick-actions-grid">
          {actions.map((action) => (
            <Link key={action.href} href={action.href} className="dashboard-quick-action">
              <span className="dashboard-quick-action-kicker">{action.kicker}</span>
              <strong>{action.label}</strong>
              <span className="dashboard-quick-action-description">{action.description}</span>
              <span className="dashboard-quick-action-arrow">Open →</span>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}

function renderEmergencyDashboard(userEmail?: string | null) {
  return (
    <section className="dashboard-home-shell" aria-label="Dashboard temporarily unavailable">
      <header className="dashboard-home-header">
        <div className="dashboard-hero-panel">
          <span className="dashboard-eyebrow">Zero Labs workspace</span>
          <h1>Dashboard temporarily unavailable</h1>
          <p>We hit a server-side dashboard issue, but your session is still active and the app stayed online.</p>
        </div>

        <aside className="dashboard-welcome-card" aria-label="Account overview">
          <span className="dashboard-welcome-label">Signed in as</span>
          <strong>{userEmail ?? "Zero Labs user"}</strong>
          <p>Use the actions below to retry safely or sign out.</p>
        </aside>
      </header>

      <section className="dashboard-panel-shell dashboard-panel-shell-emphasis" aria-label="Dashboard recovery actions">
        <header className="dashboard-section-heading">
          <div>
            <h2>Recovery actions</h2>
            <p className="dashboard-empty-note">Dashboard data could not be rendered, so a safe fallback view is being shown instead.</p>
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
            <span className="dashboard-quick-action-description">Continue working in a safe account page while dashboard services recover.</span>
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

export default async function DashboardPage() {
  const user = await requireUser(routes.dashboard);
  const profile = await getSafeProfile(user).catch(() => createFallbackProfile(user));

  try {
    if (profile.role === "admin") {
      await getAdminDashboardData();
      redirect(routes.adminDashboard);
    }

    return renderStandardDashboard(user.email);
  } catch (error) {
    logger.error("DashboardPage fell back to emergency dashboard UI", {
      category: "error",
      service: "dashboard",
      userId: user.id,
      error: { message: error instanceof Error ? error.message : String(error), name: "DashboardRenderError" },
    });
    return renderEmergencyDashboard(user.email);
  }
}
