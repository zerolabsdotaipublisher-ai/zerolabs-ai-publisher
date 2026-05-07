import type { ReactNode } from "react";
import Link from "next/link";
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
          <Link href={routes.dashboard}>Dashboard</Link>
          <Link href={routes.activity}>Activity</Link>
          <Link href={routes.contentLibrary}>Content library</Link>
          <Link href={routes.review}>Review</Link>
          <Link href={routes.approval}>Approval</Link>
          <Link href={routes.createWebsite}>Create website</Link>
          <Link href={routes.websites}>Websites</Link>
          <Link href={routes.profile}>Profile</Link>
          <span className="app-nav-user">{user.email}</span>
          <SignOutButton />
        </nav>
      </header>
      <main className="app-page">{children}</main>
    </>
  );
}
