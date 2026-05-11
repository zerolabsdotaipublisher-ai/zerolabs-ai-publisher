export function WebsiteMediaLoadingState() {
  return (
    <section className="website-media-loading-state" aria-label="Loading website media library">
      <p>Loading website media library…</p>
      <div className="media-library-grid" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="website-media-skeleton" />
        ))}
      </div>
    </section>
  );
}
