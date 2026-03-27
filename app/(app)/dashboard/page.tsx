import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerUser } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const user = await getServerUser();

  return (
    <section className="dashboard-panel">
      <h1>Dashboard</h1>
      <p>Signed in as {user?.email}</p>
      <SignOutButton />
    </section>
  );
}
