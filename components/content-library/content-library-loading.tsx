export function ContentLibraryLoading() {
  return (
    <section className="content-library-list" aria-busy="true" aria-label="Loading content library">
      {Array.from({ length: 6 }).map((_, index) => (
        <article key={index} className="content-library-card content-library-card-skeleton" />
      ))}
    </section>
  );
}
