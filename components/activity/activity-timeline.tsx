import type { PublishingActivityTimelineGroup } from "@/lib/activity/types";

interface ActivityTimelineProps {
  groups: PublishingActivityTimelineGroup[];
}

export function ActivityTimeline({ groups }: ActivityTimelineProps) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <section className="activity-timeline" aria-label="Publishing activity timeline">
      <header>
        <h2>Timeline</h2>
        <p>Chronological grouping for recent operational events.</p>
      </header>
      {groups.map((group) => (
        <article key={group.date} className="activity-timeline-group">
          <h3>{group.label}</h3>
          <ul>
            {group.items.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.status.replaceAll("_", " ")}</span>
                <time dateTime={item.occurredAt}>{new Date(item.occurredAt).toLocaleTimeString()}</time>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
