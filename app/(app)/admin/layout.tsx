import type { ReactNode } from "react";
import { requireAdminAccess } from "@/lib/supabase/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminAccess();

  return (
    <section className="admin-shell" aria-label="Admin workspace">
      <div className="admin-main">{children}</div>
    </section>
  );
}
