import Link from "next/link";
import { routes } from "@/config/routes";

export function WebsiteEmptyState() {
  return (
    <section className="website-empty-state">
      <h2>No websites found</h2>
      <p>Create your first AI website, then manage it here.</p>
      <Link href={routes.createWebsite}>Create website</Link>
    </section>
  );
}
