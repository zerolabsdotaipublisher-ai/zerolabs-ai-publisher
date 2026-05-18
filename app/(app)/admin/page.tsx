import Link from "next/link";
import { AdminFallback } from "@/components/admin/admin-fallback";
import { routes } from "@/config/routes";
import { logger } from "@/lib/observability";
import { requireAdminUser } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

async function loadAdminIndexView() {
  try {
    const { user, isAdmin } = await requireAdminUser();

    if (!user || !isAdmin) {
      return {
        mode: "fallback" as const,
        userEmail: user?.email,
        title: "Admin access unavailable",
        description: "This account does not have confirmed admin access for server-rendered admin pages.",
        retryHref: routes.admin,
      };
    }

    return {
      mode: "ready" as const,
      userEmail: user.email,
    };
  } catch (error) {
    logger.error("AdminIndexPage fell back to AdminFallback", {
      category: "error",
      service: "dashboard",
      error: { message: error instanceof Error ? error.message : String(error), name: "AdminIndexRenderError" },
    });

    return {
      mode: "fallback" as const,
      title: "Admin access unavailable",
      description: "Admin routing could not be resolved safely, so a fallback view is being shown.",
      retryHref: routes.admin,
    };
  }
}

export default async function AdminIndexPage() {
  const view = await loadAdminIndexView();

  if (view.mode === "fallback") {
    return (
      <AdminFallback
        userEmail={view.userEmail}
        title={view.title}
        description={view.description}
        retryHref={view.retryHref}
      />
    );
  }

  return (
    <section className="dashboard-home-shell" aria-label="Admin landing page">
      <header className="dashboard-home-header">
        <div className="dashboard-hero-panel">
          <span className="dashboard-eyebrow">Zero Labs operations</span>
          <h1>Admin access</h1>
          <p>Open the admin workspace manually from here to keep the main dashboard route stable after login.</p>
        </div>

        <aside className="dashboard-welcome-card" aria-label="Admin account overview">
          <span className="dashboard-welcome-label">Signed in as</span>
          <strong>{view.userEmail ?? "Zero Labs admin"}</strong>
          <p>Admin navigation stays optional and never redirects during SSR.</p>
        </aside>
      </header>

      <section className="dashboard-panel-shell" aria-label="Admin navigation">
        <header className="dashboard-section-heading">
          <div>
            <h2>Admin shortcuts</h2>
            <p>Open the admin workspace only when you want the operations view.</p>
          </div>
        </header>

        <div className="dashboard-quick-actions-grid">
          <Link href={routes.adminDashboard} prefetch={false} className="dashboard-quick-action">
            <span className="dashboard-quick-action-kicker">Admin</span>
            <strong>Open Admin Dashboard</strong>
            <span className="dashboard-quick-action-description">Open the server-rendered admin overview manually.</span>
            <span className="dashboard-quick-action-arrow">Open →</span>
          </Link>
          <Link href={routes.dashboard} prefetch={false} className="dashboard-quick-action">
            <span className="dashboard-quick-action-kicker">Back</span>
            <strong>Return to dashboard</strong>
            <span className="dashboard-quick-action-description">Return to the stable customer dashboard route.</span>
            <span className="dashboard-quick-action-arrow">Open →</span>
          </Link>
        </div>
      </section>
    </section>
  );
}
