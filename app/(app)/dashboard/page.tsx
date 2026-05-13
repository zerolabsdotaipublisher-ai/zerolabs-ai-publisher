import Link from "next/link";
import { routes } from "@/config/routes";
import { getServerUser } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const user = await getServerUser();
  const cards = [
    {
      title: "Websites",
      description: "Manage generated sites, drafts, and live publishing destinations.",
      href: routes.websites,
    },
    {
      title: "Media Library",
      description: "Review and organize the assets that support your publishing output.",
      href: routes.contentLibrary,
    },
    {
      title: "Publishing Workflow",
      description: "Track activity, reviews, and approvals across your current publishing flow.",
      href: routes.activity,
    },
    {
      title: "Account",
      description: "Update your profile and keep your workspace settings aligned.",
      href: routes.profile,
    },
  ];

  return (
    <section className="dashboard-home-shell" aria-label="Dashboard">
      <header
        className="dashboard-panel-shell"
        style={{
          background: "var(--marketing-surface-bg)",
          borderColor: "var(--marketing-card-border)",
          boxShadow: "var(--marketing-surface-shadow)",
        }}
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <p
              className="w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
              style={{
                color: "var(--marketing-green)",
                borderColor: "var(--marketing-pill-border)",
                background: "var(--marketing-pill-bg)",
              }}
            >
              Zero Labs AI Publisher
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
              <p className="text-base" style={{ color: "var(--marketing-subtle)" }}>
                Welcome to Zero Labs AI Publisher.
              </p>
            </div>
          </div>
          {user?.email ? (
            <p className="text-sm" style={{ color: "var(--marketing-muted)" }}>
              Signed in as <span className="font-medium">{user.email}</span>
            </p>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="dashboard-panel-shell transition-transform duration-150 hover:-translate-y-0.5"
            style={{
              background: "var(--marketing-surface-bg)",
              borderColor: "var(--marketing-card-border)",
              boxShadow: "var(--marketing-surface-shadow)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: "var(--marketing-green)" }}
            >
              Workspace
            </p>
            <h2 className="text-xl font-semibold">{card.title}</h2>
            <p className="text-sm leading-6" style={{ color: "var(--marketing-muted)" }}>
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
