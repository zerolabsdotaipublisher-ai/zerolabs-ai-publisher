interface WebsiteMediaEmptyStateProps {
  hasFilters: boolean;
}

export function WebsiteMediaEmptyState({ hasFilters }: WebsiteMediaEmptyStateProps) {
  return (
    <section className="website-media-empty-state" aria-label="Website media empty state">
      <h3>{hasFilters ? "No matching media items" : "No media yet"}</h3>
      <p>
        {hasFilters
          ? "Try clearing search, media type, tag, or status filters."
          : "Upload media or reuse AI-generated assets to populate this website library."}
      </p>
    </section>
  );
}
