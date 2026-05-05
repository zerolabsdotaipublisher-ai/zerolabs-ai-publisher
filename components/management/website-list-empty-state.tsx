import Link from "next/link";
import { routes } from "@/config/routes";

interface WebsiteListEmptyStateProps {
  hasFilters: boolean;
}

export function WebsiteListEmptyState({ hasFilters }: WebsiteListEmptyStateProps) {
  if (hasFilters) {
    return (
      <section className="website-empty-state">
        <h2>No websites match your filters</h2>
        <p>Try removing filters or changing the search query.</p>
      </section>
    );
  }

  return (
    <section className="website-empty-state">
      <h2>No websites found</h2>
      <p>Create your first AI website, then manage it here.</p>
      <Link href={routes.createWebsite}>Create website</Link>
    </section>
  );
}
