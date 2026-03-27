import type { ReactNode } from "react";
import { requireUser } from "@/lib/supabase/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireUser("/dashboard");

  return <main className="app-page">{children}</main>;
}
