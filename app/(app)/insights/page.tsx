import Link from "next/link";
import { routes } from "@/config/routes";

const insightCards = [
  {
    title: "Publishing system signals",
    description: "Use the dashboard, activity feed, and preview workflow together to review operational readiness before releasing generated work.",
    href: routes.dashboard,
    cta: "Open dashboard",
  },
  {
    title: "Review the public narrative",
    description: "The public homepage and blog remain part of the same shared theme and accessibility system used across the logged-in workspace.",
    href: routes.blog,
    cta: "Open blog",
  },
  {
    title: "Continue building",
    description: "Move directly into the create flow when you want to turn the latest prompt and page plan into a preview-ready website.",
    href: routes.createWebsite,
    cta: "Create website",
  },
] as const;

export default function InsightsPage() {
  return (
    <section className="dashboard-home-shell" aria-label="Insights workspace">
      <header className="dashboard-home-header">
        <div className="dashboard-hero-panel">
          <span className="dashboard-eyebrow">Zero Labs insights</span>
          <h1>Insights</h1>
          <p>Use this page as the stable app entry point for product context, publishing signal review, and links into the most relevant workflows.</p>
        </div>

        <aside className="dashboard-welcome-card" aria-label="Insights overview">
          <span className="dashboard-welcome-label">What this covers</span>
          <strong>Operational visibility</strong>
          <p>Shared theme, shared accessibility standards, and direct routes into the core publishing surfaces.</p>
        </aside>
      </header>

      <section className="dashboard-panel-shell" aria-label="Insights quick links">
        <header className="dashboard-section-heading">
          <div>
            <h2>Key insight routes</h2>
            <p>These links keep the new app navigation stable without changing auth, generation logic, or dashboard data contracts.</p>
          </div>
        </header>

        <div className="dashboard-quick-actions-grid">
          {insightCards.map((card) => (
            <Link key={card.href} href={card.href} className="dashboard-quick-action">
              <span className="dashboard-quick-action-kicker">Insights</span>
              <strong>{card.title}</strong>
              <span className="dashboard-quick-action-description">{card.description}</span>
              <span className="dashboard-quick-action-arrow">{card.cta}</span>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
