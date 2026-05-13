import Link from "next/link";
import { routes } from "@/config/routes";
import { requireUser } from "@/lib/supabase/auth";

export default async function DashboardPage() {
  const user = await requireUser(routes.dashboard);

  const actions = [
    { href: routes.createWebsite, label: "Create website", description: "Start a new AI website project." },
    { href: routes.websites, label: "View websites", description: "Open your managed website list." },
    { href: routes.contentLibrary, label: "Content library", description: "Browse generated content." },
    { href: routes.activity, label: "Activity", description: "Review recent publishing activity." },
    { href: routes.profile, label: "Profile", description: "Update your account settings." },
  ];

  return (
    <section className="dashboard-home-shell" aria-label="Dashboard homepage">
      <header className="dashboard-home-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome to Zero Labs AI Publisher</p>
          <p>{user.email ?? "Signed in"}</p>
        </div>
      </header>

      <section className="dashboard-panel-shell" aria-label="Dashboard quick links">
        <h2>Get started</h2>
        <div className="dashboard-quick-actions-grid">
          {actions.map((action) => (
            <Link key={action.href} href={action.href} className="dashboard-quick-action">
              <strong>{action.label}</strong>
              <span>{action.description}</span>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
