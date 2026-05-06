interface ActivityEmptyStateProps {
  hasFilters: boolean;
}

export function ActivityEmptyState({ hasFilters }: ActivityEmptyStateProps) {
  return (
    <section className="activity-empty-state" aria-label="No publishing activity found">
      <h2>No publishing activity found</h2>
      <p>
        {hasFilters
          ? "Try broadening your filters or date range."
          : "Publish, schedule, or retry content to populate your activity overview."}
      </p>
    </section>
  );
}
