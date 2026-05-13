import Link from "next/link";
import { routes } from "@/config/routes";
import { requireUser } from "@/lib/supabase/auth";

export default async function DashboardPage() {
  const user = await requireUser(routes.dashboard);

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
          <strong>{user.email ?? "Zero Labs user"}</strong>
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
