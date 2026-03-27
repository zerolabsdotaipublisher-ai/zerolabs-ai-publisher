import type { ReactNode } from "react";
import { routes } from "@/config/routes";
import { requireUser } from "@/lib/supabase/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireUser(routes.dashboard);

  return <main className="app-page">{children}</main>;
}
