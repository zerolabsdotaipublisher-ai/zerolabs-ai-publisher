import type { ReactNode } from "react";
import { AppNavigation } from "@/components/app/app-navigation";
import { SessionGuard } from "@/components/auth/session-guard";
import { routes } from "@/config/routes";
import { createFallbackProfile, getSafeProfile } from "@/lib/supabase/profile";
import { requireUser } from "@/lib/supabase/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser(routes.dashboard);
  const profile = await getSafeProfile(user).catch(() => createFallbackProfile(user));

  return (
    <>
      <SessionGuard />
      <div className="app-shell">
        <AppNavigation userEmail={user.email} userRole={profile.role} />
        <main id="main-content" className="app-page">
          {children}
        </main>
      </div>
    </>
  );
}
