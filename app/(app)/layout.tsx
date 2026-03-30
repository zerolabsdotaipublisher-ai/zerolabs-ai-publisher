import type { ReactNode } from "react";
import { routes } from "@/config/routes";
import { requireUser } from "@/lib/supabase/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SessionGuard } from "@/components/auth/session-guard";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser(routes.dashboard);

  return (
    <>
      <SessionGuard />
      <header className="app-header">
        <nav className="app-nav">
          <span className="app-nav-user">{user.email}</span>
          <SignOutButton />
        </nav>
      </header>
      <main className="app-page">{children}</main>
    </>
  );
}
