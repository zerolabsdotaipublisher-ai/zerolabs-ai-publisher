export function WebsiteListLoading() {
  return (
    <section className="website-list-loading" aria-live="polite" aria-busy="true">
      <p>Loading websites…</p>
      <div className="website-list-loading-grid">
        {Array.from({ length: 3 }).map((_, index) => (
          <article key={index} className="website-list-loading-card" />
        ))}
      </div>
    </section>
  );
}
