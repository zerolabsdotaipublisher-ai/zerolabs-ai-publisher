import type { ReactNode } from "react";
import { AppNavigation } from "@/components/app/app-navigation";
import { SessionGuard } from "@/components/auth/session-guard";
import { routes } from "@/config/routes";
import { requireUserProfile } from "@/lib/supabase/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await requireUserProfile(routes.dashboard);

  return (
    <>
      <SessionGuard />
      <div className="app-shell">
        <AppNavigation userEmail={user.email} userRole={profile.role} />
        <main className="app-page">{children}</main>
      </div>
    </>
  );
}
