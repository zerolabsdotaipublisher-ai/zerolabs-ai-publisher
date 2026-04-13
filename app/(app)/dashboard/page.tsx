import Link from "next/link";
import { routes } from "@/config/routes";
import { getServerUser } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const user = await getServerUser();

  return (
    <section className="dashboard-panel">
      <h1>Dashboard</h1>
      <p>Signed in as {user?.email}</p>
      <p>Ready to generate a new website?</p>
      <Link href={routes.createWebsite}>Create website</Link>
      <Link href={routes.websites}>Manage websites</Link>
    </section>
  );
}
