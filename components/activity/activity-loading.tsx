export function ActivityLoading() {
  return (
    <section className="activity-list" aria-busy="true" aria-label="Loading publishing activity">
      {Array.from({ length: 8 }).map((_, index) => (
        <article key={index} className="activity-item activity-item-skeleton" />
      ))}
    </section>
  );
}
