interface ContentLibraryEmptyStateProps {
  hasFilters: boolean;
}

export function ContentLibraryEmptyState({ hasFilters }: ContentLibraryEmptyStateProps) {
  return (
    <section className="content-library-empty-state" aria-label="No content found">
      <h2>No generated content found</h2>
      <p>
        {hasFilters
          ? "Try clearing search or filters to broaden results."
          : "Generate website, blog, article, or social content to populate your library."}
      </p>
    </section>
  );
}
