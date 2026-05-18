"use client";

import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { routes } from "@/config/routes";

interface AdminFallbackProps {
  userEmail?: string | null;
  title?: string;
  description?: string;
  retryHref?: string;
}

export function AdminFallback({
  userEmail,
  title = "Admin dashboard temporarily limited",
  description = "Admin data is unavailable right now, so a safe fallback view is being shown instead of failing the page.",
  retryHref = routes.adminDashboard,
}: AdminFallbackProps) {
  return (
    <section className="dashboard-home-shell" aria-label="Admin dashboard fallback">
      <header className="dashboard-home-header">
        <div className="dashboard-hero-panel">
          <span className="dashboard-eyebrow">Zero Labs operations</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <aside className="dashboard-welcome-card" aria-label="Admin account overview">
          <span className="dashboard-welcome-label">Signed in as</span>
          <strong>{userEmail ?? "Zero Labs admin"}</strong>
          <p>Use the actions below to retry safely or return to the main dashboard.</p>
        </aside>
      </header>

      <section className="dashboard-panel-shell" aria-label="Admin fallback status">
        <header className="dashboard-section-heading">
          <div>
            <h2>Admin services unavailable</h2>
            <p className="dashboard-empty-note">User count unavailable · analytics unavailable</p>
          </div>
        </header>

        <div className="dashboard-quick-actions-grid">
          <Link href={retryHref} className="dashboard-quick-action">
            <span className="dashboard-quick-action-kicker">Retry</span>
            <strong>Retry admin page</strong>
            <span className="dashboard-quick-action-description">Try loading this admin page again without leaving your session.</span>
            <span className="dashboard-quick-action-arrow">Open →</span>
          </Link>

          <Link href={routes.dashboard} className="dashboard-quick-action">
            <span className="dashboard-quick-action-kicker">Fallback</span>
            <strong>Back to dashboard</strong>
            <span className="dashboard-quick-action-description">Return to the stable main dashboard route.</span>
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
