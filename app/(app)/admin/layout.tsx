import type { ReactNode } from "react";
import Link from "next/link";
import { AdminSectionNav } from "@/components/admin/admin-section-nav";
import { config, routes } from "@/config";
import { requireAdminAccess } from "@/lib/supabase/auth";
import { getProfileDisplayName } from "@/lib/supabase/profile";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await requireAdminAccess(routes.admin);
  const displayName = getProfileDisplayName(profile);

  return (
    <section className="admin-shell" aria-label="Admin workspace">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-panel">
          <span className="admin-sidebar-kicker">Zero Labs</span>
          <strong className="admin-sidebar-title">Admin Workspace</strong>
          <p className="admin-sidebar-copy">
            Server-rendered operations workspace for deployments, analytics readiness, and access management.
          </p>
        </div>

        <div className="admin-sidebar-panel">
          <span className="admin-sidebar-label">Signed in as</span>
          <strong className="admin-sidebar-user">{displayName}</strong>
          {user.email && user.email !== displayName ? <span className="admin-sidebar-meta">{user.email}</span> : null}
          <div className="admin-sidebar-pill-row">
            <span className="admin-sidebar-pill">Role: {profile.role}</span>
            <span className="admin-sidebar-pill">Env: {config.app.environment}</span>
          </div>
        </div>

        <AdminSectionNav />

        <div className="admin-sidebar-panel">
          <span className="admin-sidebar-label">Customer workspace</span>
          <p className="admin-sidebar-copy">Regular dashboard, create flow, and generation paths remain unchanged.</p>
          <Link href={routes.dashboard} className="admin-sidebar-action">
            Back to dashboard
          </Link>
        </div>
      </aside>

      <div className="admin-main">{children}</div>
    </section>
  );
}
